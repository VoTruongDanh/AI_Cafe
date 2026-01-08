<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use OpenApi\Annotations as OA;

class FaceRecognitionController extends Controller
{
    use Concerns\EnsuresAdminAccess;

    protected string $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = config('services.local_ai.url', 'https://127.0.0.1:9009');
    }

    /**
     * Lấy danh sách khách hàng có avatar để nhận diện
     * 
     * @OA\Get(
     *     path="/admin/face/customers",
     *     tags={"Face Recognition"},
     *     summary="Danh sách khách hàng có avatar",
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
     * Nhận diện khuôn mặt từ ảnh camera
     * 
     * @OA\Post(
     *     path="/admin/face/recognize",
     *     tags={"Face Recognition"},
     *     summary="Nhận diện khuôn mặt khách hàng",
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
        $this->ensureAdmin($request);

        $request->validate([
            'image_base64' => ['required', 'string'],
        ]);

        $imageBase64 = $request->input('image_base64');

        // Lấy danh sách khách hàng có avatar
        $customers = User::whereNotNull('avatar')
            ->where('avatar', '!=', '')
            ->select('id', 'name', 'email', 'phone', 'avatar', 'loyalty_tier', 'loyalty_points', 'created_at')
            ->get();

        if ($customers->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Không có khách hàng nào có ảnh đại diện trong hệ thống'
            ], 404);
        }

        // Gửi request đến AI Service để nhận diện
        try {
            $response = Http::timeout(30)
                ->withoutVerifying()
                ->post($this->aiServiceUrl . '/face/recognize', [
                    'image_base64' => $imageBase64,
                    'customers' => $customers->map(function ($customer) {
                        return [
                            'id' => $customer->id,
                            'name' => $customer->name,
                            'avatar_url' => url($customer->avatar),
                            'avatar_path' => $customer->avatar, // Đường dẫn relative để AI đọc từ disk
                        ];
                    })->toArray()
                ]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['matched']) && $result['matched']) {
                    // Tìm thấy khách hàng
                    $matchedCustomer = $customers->firstWhere('id', $result['customer_id']);
                    
                    // Lấy 5 sản phẩm gần nhất từ đơn hàng
                    $recentProducts = $this->getRecentProducts($result['customer_id']);
                    
                    return response()->json([
                        'success' => true,
                        'matched' => true,
                        'confidence' => $result['confidence'] ?? 0,
                        'customer' => $matchedCustomer,
                        'recent_products' => $recentProducts,
                        'message' => 'Đã nhận diện thành công'
                    ]);
                }
                
                return response()->json([
                    'success' => true,
                    'matched' => false,
                    'message' => $result['message'] ?? 'Không tìm thấy khách hàng phù hợp'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'AI Service không phản hồi'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối AI Service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kiểm tra trạng thái AI Face Recognition Service
     * 
     * @OA\Get(
     *     path="/admin/face/status",
     *     tags={"Face Recognition"},
     *     summary="Kiểm tra trạng thái AI Service",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Trạng thái AI Service")
     * )
     */
    public function checkStatus(Request $request)
    {
        $this->ensureAdmin($request);

        try {
            $response = Http::timeout(5)
                ->withoutVerifying()
                ->get($this->aiServiceUrl . '/face/status');

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'ai_service' => 'online',
                    'deepface_ready' => $response->json()['deepface_ready'] ?? false,
                    'message' => 'AI Service đang hoạt động'
                ]);
            }

            return response()->json([
                'success' => false,
                'ai_service' => 'offline',
                'message' => 'AI Service không phản hồi'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'ai_service' => 'offline',
                'message' => 'Không thể kết nối đến AI Service'
            ]);
        }
    }

    /**
     * Lấy 5 sản phẩm gần nhất từ đơn hàng của khách hàng
     */
    private function getRecentProducts(int $customerId): array
    {
        // Lấy 5 sản phẩm gần nhất (theo thời gian đặt hàng)
        $recentOrderItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $customerId)
            ->whereIn('orders.status', ['completed', 'delivered', 'processing'])
            ->with(['product:id,name,thumbnail,price'])
            ->select('order_items.product_id', 'order_items.created_at')
            ->orderByDesc('order_items.created_at')
            ->limit(5)
            ->get()
            ->unique('product_id') // Loại bỏ trùng lặp
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
