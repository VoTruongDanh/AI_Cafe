<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use OpenApi\Annotations as OA;

class FaceRecognitionV2Controller extends Controller
{
    use Concerns\EnsuresAdminAccess;

    protected string $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = config('services.local_ai.url', 'http://127.0.0.1:9009');
    }

    /**
     * Lấy danh sách khách hàng có avatar để nhận diện (V2)
     * 
     * @OA\Get(
     *     path="/admin/face/v2/customers",
     *     tags={"Face Recognition V2"},
     *     summary="Danh sách khách hàng có avatar (V2)",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Danh sách khách hàng")
     * )
     */
    public function getCustomersWithAvatar(Request $request)
    {
        $this->ensureAdmin($request);

        $customers = User::whereNotNull('avatar')
            ->where('avatar', '!=', '')
            ->where('role', 'customer')
            ->select('id', 'name', 'email', 'phone', 'avatar', 'loyalty_tier', 'loyalty_points', 'created_at')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $customers->count(),
            'customers' => $customers
        ]);
    }

    /**
     * Nhận diện khuôn mặt từ ảnh camera (V2 - ArcFace)
     * 
     * @OA\Post(
     *     path="/admin/face/v2/recognize",
     *     tags={"Face Recognition V2"},
     *     summary="Nhận diện khuôn mặt khách hàng (V2 - ArcFace)",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="image_base64", type="string", description="Ảnh từ camera (base64)")
     *     )),
     *     @OA\Response(response=200, description="Kết quả nhận diện"),
     *     @OA\Response(response=404, description="Không tìm thấy khách hàng")
     * )
     */
    public function recognize(Request $request)
    {
        \Log::info('[FaceRecognitionV2] recognize() called');
        
        $this->ensureAdmin($request);

        try {
            $request->validate([
                'image_base64' => ['required', 'string'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('[FaceRecognitionV2] Validation failed', ['errors' => $e->errors()]);
            throw $e;
        }

        $imageBase64 = $request->input('image_base64');
        
        // Lấy danh sách customers có avatar
        $customers = User::whereNotNull('avatar')
            ->where('avatar', '!=', '')
            ->select('id', 'name', 'email', 'phone', 'avatar', 'loyalty_tier', 'loyalty_points', 'created_at')
            ->get();

        // Cache customers lên AI Service V2 (chỉ cache nếu cần)
        if (!$customers->isEmpty()) {
            try {
                // Kiểm tra cache V2 có sẵn không
                $statusResponse = Http::timeout(3)
                    ->withoutVerifying()
                    ->get($this->aiServiceUrl . '/face/v2/status');
                
                if ($statusResponse->successful()) {
                    $statusData = $statusResponse->json();
                    $cachedCount = $statusData['customer_cache_size'] ?? 0;
                    $dbCount = $customers->count();
                    
                    // Chỉ cache nếu cache chưa có hoặc số lượng khác nhau
                    if ($cachedCount == 0 || $cachedCount != $dbCount) {
                        \Log::info('[FaceRecognitionV2] Cache customers needed (cached: ' . $cachedCount . ', db: ' . $dbCount . ')');
                        $cacheResponse = Http::timeout(15)
                            ->withoutVerifying()
                            ->post($this->aiServiceUrl . '/face/v2/cache-customers', [
                                'customers' => $customers->map(function ($customer) {
                                    return [
                                        'id' => $customer->id,
                                        'name' => $customer->name,
                                        'avatar_url' => url($customer->avatar),
                                        'avatar_path' => $customer->avatar,
                                    ];
                                })->toArray()
                            ]);
                        
                        if ($cacheResponse->successful()) {
                            \Log::info('[FaceRecognitionV2] ✅ Cache customers completed (version: ' . ($cacheResponse->json()['cache_version'] ?? 'N/A') . ')');
                        } else {
                            \Log::warning('[FaceRecognitionV2] Cache customers failed', ['status' => $cacheResponse->status(), 'body' => $cacheResponse->body()]);
                        }
                    } else {
                        \Log::debug('[FaceRecognitionV2] Cache already up-to-date (cached: ' . $cachedCount . ', db: ' . $dbCount . ')');
                    }
                } else {
                    \Log::warning('[FaceRecognitionV2] Status check failed', ['status' => $statusResponse->status()]);
                }
            } catch (\Exception $e) {
                // Không chặn flow nếu cache thất bại; tiếp tục recognize
                \Log::warning('[FaceRecognitionV2] Failed to check/cache customers', ['error' => $e->getMessage()]);
            }
        }

        // Gửi request đến AI Service V2 để nhận diện
        try {
            try {
                $response = Http::timeout(10)
                    ->withoutVerifying()
                    ->post($this->aiServiceUrl . '/face/v2/recognize', [
                        'image_base64' => $imageBase64
                    ]);
            } catch (ConnectionException $e) {
                \Log::error('[FaceRecognitionV2] AI Service connection failed', ['error' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'message' => 'AI Service không phản hồi. Vui lòng kiểm tra lại.',
                    'error' => 'AI Service timeout or connection error',
                    'face_detected' => false,
                ], 500);
            } catch (\Exception $e) {
                \Log::error('[FaceRecognitionV2] AI Service request failed', ['error' => $e->getMessage()]);
                return response()->json([
                    'success' => false,
                    'message' => 'AI Service không phản hồi. Vui lòng kiểm tra lại.',
                    'error' => 'AI Service error: ' . $e->getMessage(),
                    'face_detected' => false,
                ], 500);
            }

            if ($response->successful()) {
                $result = $response->json();
                
                // Base response với thông tin từ AI Service V2
                $baseResponse = [
                    'success' => $result['success'] ?? true,
                    'face_detected' => $result['face_detected'] ?? false,
                    'face_box' => $result['face_box'] ?? null,
                    'face_quality' => $result['face_quality'] ?? 0,
                    'processing_time_ms' => $result['processing_time_ms'] ?? 0,
                    'no_customers_in_db' => $customers->isEmpty(),
                ];
                
                if (isset($result['matched']) && $result['matched']) {
                    // Tìm thấy khách hàng
                    $matchedCustomer = $customers->firstWhere('id', $result['customer_id']);
                    
                    if (!$matchedCustomer && isset($result['customer_id'])) {
                        $matchedCustomer = User::find($result['customer_id']);
                    }
                    
                    // Lấy 5 sản phẩm gần nhất từ đơn hàng
                    $recentProducts = $matchedCustomer ? $this->getRecentProducts($result['customer_id']) : [];
                    
                    return response()->json(array_merge($baseResponse, [
                        'matched' => true,
                        'confidence' => $result['similarity_percent'] ?? ($result['similarity'] ?? 0) * 100,
                        'cosine_similarity' => $result['similarity'] ?? null,
                        'customer' => $matchedCustomer,
                        'customer_id' => $result['customer_id'],
                        'recent_products' => $recentProducts,
                        'message' => $result['message'] ?? 'Đã nhận diện thành công',
                        'version' => 'v2'
                    ]));
                }
                
                // Không tìm thấy
                $message = $customers->isEmpty() 
                    ? 'Chưa có khách hàng nào có ảnh đại diện trong hệ thống. Vui lòng thêm khách hàng mới.'
                    : ($result['message'] ?? 'Không tìm thấy khách hàng phù hợp');
                
                return response()->json(array_merge($baseResponse, [
                    'matched' => false,
                    'message' => $message,
                    'best_similarity' => $result['best_similarity'] ?? null,
                    'best_customer_name' => $result['best_customer_name'] ?? null,
                    'similarity_threshold' => $result['similarity_threshold'] ?? null,
                    'version' => 'v2'
                ]));
            }

            return response()->json([
                'success' => false,
                'message' => 'AI Service không phản hồi'
            ], 500);

        } catch (\Exception $e) {
            \Log::error('[FaceRecognitionV2] Exception in recognize()', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối AI Service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kiểm tra trạng thái AI Face Recognition Service V2
     * 
     * @OA\Get(
     *     path="/admin/face/v2/status",
     *     tags={"Face Recognition V2"},
     *     summary="Kiểm tra trạng thái AI Service V2",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Trạng thái AI Service V2")
     * )
     */
    public function checkStatus(Request $request)
    {
        $this->ensureAdmin($request);

        try {
            $response = Http::timeout(5)
                ->withoutVerifying()
                ->get($this->aiServiceUrl . '/face/v2/status');

            if ($response->successful()) {
                $result = $response->json();
                return response()->json([
                    'success' => true,
                    'ai_service' => 'online',
                    'version' => 'v2',
                    'available' => $result['available'] ?? false,
                    'model_loaded' => $result['model_loaded'] ?? false,
                    'faiss_available' => $result['faiss_available'] ?? false,
                    'customer_cache_size' => $result['customer_cache_size'] ?? 0,
                    'similarity_threshold' => $result['similarity_threshold'] ?? null,
                    'message' => $result['message'] ?? 'AI Service V2 đang hoạt động'
                ]);
            }

            return response()->json([
                'success' => false,
                'ai_service' => 'offline',
                'message' => 'AI Service V2 không phản hồi'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'ai_service' => 'offline',
                'message' => 'Không thể kết nối đến AI Service V2'
            ]);
        }
    }

    /**
     * Lấy 5 sản phẩm gần nhất từ đơn hàng của khách hàng
     */
    private function getRecentProducts(int $customerId): array
    {
        $recentOrderItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->whereIn('orders.status', ['completed', 'delivered', 'processing'])
            ->with(['product:id,name,thumbnail,price'])
            ->select('order_items.product_id', 'order_items.created_at')
            ->orderByDesc('order_items.created_at')
            ->limit(5)
            ->get()
            ->unique('product_id')
            ->take(5)
            ->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'name' => $item->product->name ?? 'Sản phẩm đã xóa',
                    'thumbnail' => $item->product->thumbnail ?? null,
                    'price' => $item->product->price ?? 0,
                    'last_ordered_at' => $item->created_at,
                ];
            })
            ->toArray();

        return $recentOrderItems;
    }
}
