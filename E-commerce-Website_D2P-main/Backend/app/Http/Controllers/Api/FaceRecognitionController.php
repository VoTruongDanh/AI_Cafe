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

class FaceRecognitionController extends Controller
{
    use Concerns\EnsuresAdminAccess;

    protected string $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = config('services.local_ai.url', 'http://127.0.0.1:9009');
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
        \Log::info('[FaceRecognition] recognize() called', [
            'method' => $request->method(),
            'path' => $request->path(),
            'url' => $request->fullUrl(),
            'has_token' => $request->bearerToken() ? 'yes' : 'no',
            'user' => $request->user() ? $request->user()->id : 'null'
        ]);
        
        $this->ensureAdmin($request);

        try {
            $request->validate([
                'image_base64' => ['required', 'string'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('[FaceRecognition] Validation failed', [
                'errors' => $e->errors()
            ]);
            throw $e;
        }

        $imageBase64 = $request->input('image_base64');
        \Log::info('[FaceRecognition] Image received', [
            'image_length' => strlen($imageBase64),
            'image_preview' => substr($imageBase64, 0, 50) . '...'
        ]);
        // Lấy danh sách customers có avatar
        $customers = User::whereNotNull('avatar')
            ->where('avatar', '!=', '')
            ->select('id', 'name', 'email', 'phone', 'avatar', 'loyalty_tier', 'loyalty_points', 'created_at')
            ->get();

        \Log::info('[FaceRecognition] Customers query result', [
            'count' => $customers->count(),
            'isEmpty' => $customers->isEmpty()
        ]);

        // Cache customers lên AI Service (chỉ cache nếu có customers và cache chưa có)
        // Cache một lần, không phải mỗi request để tránh chậm
        if (!$customers->isEmpty()) {
            try {
                // Kiểm tra cache có sẵn không bằng cách gọi status (nhanh hơn)
                // Tăng timeout từ 2s lên 3s để tránh timeout khi AI service đang xử lý
                $statusResponse = Http::timeout(3)
                    ->withoutVerifying()
                    ->get($this->aiServiceUrl . '/face/status');
                
                if ($statusResponse->successful()) {
                    $statusData = $statusResponse->json();
                    $cachedCount = $statusData['customer_cache_size'] ?? 0;
                    $dbCount = $customers->count();
                    
                    // Chỉ cache nếu cache chưa có hoặc số lượng khác nhau
                    if ($cachedCount == 0 || $cachedCount != $dbCount) {
                        \Log::info('[FaceRecognition] Cache customers needed (cached: ' . $cachedCount . ', db: ' . $dbCount . ')');
                        // Cache trong background (async) để không chặn request
                        // Nhưng vì Laravel không có async HTTP, nên chỉ tăng timeout để không block quá lâu
                        $cacheResponse = Http::timeout(15)
                            ->withoutVerifying()
                            ->post($this->aiServiceUrl . '/face/cache-customers', [
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
                            \Log::info('[FaceRecognition] ✅ Cache customers completed (version: ' . ($cacheResponse->json()['version'] ?? 'N/A') . ')');
                        } else {
                            \Log::warning('[FaceRecognition] Cache customers failed', ['status' => $cacheResponse->status()]);
                        }
                    } else {
                        // Cache đã đầy đủ - không cần rebuild
                        // Không log để giảm noise (chỉ log khi cần cache)
                    }
                } else {
                    \Log::warning('[FaceRecognition] Status check failed', ['status' => $statusResponse->status()]);
                }
            } catch (\Exception $e) {
                // Không chặn flow nếu cache thất bại; tiếp tục recognize
                \Log::warning('[FaceRecognition] Failed to check/cache customers', ['error' => $e->getMessage()]);
            }
        }

        // Gửi request đến AI Service để nhận diện (chỉ gửi ảnh, không gửi lại customers)
        try {
            \Log::info('[FaceRecognition] Calling AI Service', ['url' => $this->aiServiceUrl . '/face/recognize']);
            try {
                $response = Http::timeout(5)
                    ->withoutVerifying()
                    ->post($this->aiServiceUrl . '/face/recognize', [
                        'image_base64' => $imageBase64
                    ]);
            } catch (ConnectionException $e) {
                \Log::error('[FaceRecognition] AI Service connection failed', [
                    'error' => $e->getMessage(),
                    'url' => $this->aiServiceUrl . '/face/recognize'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'AI Service không phản hồi. Vui lòng kiểm tra lại.',
                    'error' => 'AI Service timeout or connection error',
                    'face_detected' => false,
                ], 500);
            } catch (\Exception $e) {
                \Log::error('[FaceRecognition] AI Service request failed', [
                    'error' => $e->getMessage(),
                    'type' => get_class($e),
                    'url' => $this->aiServiceUrl . '/face/recognize'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'AI Service không phản hồi. Vui lòng kiểm tra lại.',
                    'error' => 'AI Service error: ' . $e->getMessage(),
                    'face_detected' => false,
                ], 500);
            }
            
            \Log::info('[FaceRecognition] AI Service response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'has_body' => !empty($response->body())
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                // Base response với thông tin từ AI Service
                $baseResponse = [
                    'success' => true,
                    'face_detected' => $result['face_detected'] ?? false,
                    'face_box' => $result['face_box'] ?? null,
                    'face_quality' => $result['face_quality'] ?? 0,
                    'face_size' => $result['face_size'] ?? null,
                    'cropped_face' => $result['cropped_face'] ?? null,
                    'processing_time_ms' => $result['processing_time_ms'] ?? 0,
                    'no_customers_in_db' => $customers->isEmpty(), // Thông báo cho frontend biết chưa có customers
                ];
                
                if (isset($result['matched']) && $result['matched']) {
                    // Tìm thấy khách hàng
                    $matchedCustomer = $customers->firstWhere('id', $result['customer_id']);
                    
                    // Nếu không tìm thấy customer trong collection (có thể do cache không đồng bộ)
                    if (!$matchedCustomer && isset($result['customer_id'])) {
                        $matchedCustomer = User::find($result['customer_id']);
                    }
                    
                    // Lấy 5 sản phẩm gần nhất từ đơn hàng (chỉ khi có customer)
                    $recentProducts = $matchedCustomer ? $this->getRecentProducts($result['customer_id']) : [];
                    
                    // ✅ Nâng cấp: Auto-update avatar CHỈ khi CỰC KỲ CHẮC CHẮN + Policy = 'auto'
                    // Nếu không đủ điều kiện khắt khe → NV quyết định qua nút thủ công
                    $newQuality = $baseResponse['face_quality'] ?? 0;
                    $oldQuality = $result['avatar_quality'] ?? null;
                    $hasCropped = !empty($baseResponse['cropped_face']);
                    $cosineSim = $result['cosine_similarity'] ?? 0;
                    $policy = $result['policy'] ?? 'unknown'; // ✅ Bắt buộc: Policy phải là 'auto'

                    // Điều kiện AUTO-UPDATE (CỰC KỲ KHẮT KHE - Tránh Data Poisoning):
                    // 1) policy == 'auto' (BẮT BUỘC: Phải là kết quả tự tin tuyệt đối, không nằm trong vùng xám/review)
                    // 2) cosine_similarity >= 0.85 (85%+) - phải cực kỳ chắc chắn là cùng người
                    // 3) newQuality >= (oldQuality + 10) - Ảnh mới tốt hơn ảnh cũ ít nhất 10%
                    // 4) newQuality >= 60 - Chất lượng ảnh mới >= 60%
                    // Lưu ý: Nếu thiếu điều kiện số 1, tuyệt đối không update tự động để tránh Data Poisoning
                    if ($matchedCustomer && $hasCropped && $oldQuality !== null) {
                        $policyIsAuto = ($policy === 'auto'); // ✅ Điều kiện BẮT BUỘC
                        $veryHighConfidence = $cosineSim >= 0.85;
                        $significantImprovement = $newQuality >= ($oldQuality + 10);
                        $highQuality = $newQuality >= 60;

                        // ✅ CHỈ update khi TẤT CẢ điều kiện đều đạt (bao gồm policy == 'auto')
                        if ($policyIsAuto && $veryHighConfidence && $significantImprovement && $highQuality) {
                            try {
                                $avatarPath = $this->saveCroppedAvatar($baseResponse['cropped_face'], $matchedCustomer->id);
                                if ($avatarPath) {
                                    $matchedCustomer->avatar = $avatarPath;
                                    $matchedCustomer->save();
                                    \Log::info("✅ Avatar auto-updated for customer {$matchedCustomer->id} (policy={$policy}, cosine={$cosineSim}, quality: {$oldQuality} -> {$newQuality})");
                                }
                            } catch (\Exception $e) {
                                \Log::warning('Không thể cập nhật avatar tự động: ' . $e->getMessage());
                            }
                        } else {
                            // Log lý do không update để debug
                            $reasons = [];
                            if (!$policyIsAuto) $reasons[] = "policy={$policy} (not 'auto')";
                            if (!$veryHighConfidence) $reasons[] = "cosine={$cosineSim} < 0.85";
                            if (!$significantImprovement) $reasons[] = "quality improvement insufficient ({$oldQuality} -> {$newQuality})";
                            if (!$highQuality) $reasons[] = "newQuality={$newQuality} < 60";
                            \Log::info("⏸ Avatar auto-update skipped for customer {$matchedCustomer->id}: " . implode(', ', $reasons));
                        }
                        // Nếu không đủ điều kiện khắt khe → NV dùng nút thủ công
                    }
                    
                    return response()->json(array_merge($baseResponse, [
                        'matched' => true,
                        'confidence' => $result['confidence'] ?? 0,
                        'cosine_similarity' => $result['cosine_similarity'] ?? null,
                        'customer' => $matchedCustomer,
                        'customer_id' => $result['customer_id'],
                        'recent_products' => $recentProducts,
                        'message' => $result['message'] ?? 'Đã nhận diện thành công'
                    ]));
                }
                
                // Nếu không có customers trong DB, thông báo rõ ràng
                $message = $customers->isEmpty() 
                    ? 'Chưa có khách hàng nào có ảnh đại diện trong hệ thống. Vui lòng thêm khách hàng mới.'
                    : ($result['message'] ?? 'Không tìm thấy khách hàng phù hợp');
                
                return response()->json(array_merge($baseResponse, [
                    'matched' => false,
                    'message' => $message
                ]));
            }

            \Log::warning('[FaceRecognition] AI Service response not successful', [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 200)
            ]);
            return response()->json([
                'success' => false,
                'message' => 'AI Service không phản hồi'
            ], 500);

        } catch (\Exception $e) {
            \Log::error('[FaceRecognition] Exception in recognize()', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối AI Service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Debug - Test face detection only (không cần customers)
     */
    public function detectOnly(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'image_base64' => ['required', 'string'],
        ]);

        try {
            $response = Http::timeout(10)
                ->withoutVerifying()
                ->post($this->aiServiceUrl . '/face/detect', [
                    'image_base64' => $request->input('image_base64'),
                ]);

            if ($response->successful()) {
                $result = $response->json();
                return response()->json([
                    'success' => true,
                    'ai_response' => $result,
                    'ai_url' => $this->aiServiceUrl,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'AI Service không phản hồi',
                'status' => $response->status(),
                'body' => $response->body(),
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối AI Service: ' . $e->getMessage(),
                'ai_url' => $this->aiServiceUrl,
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
                $result = $response->json();
                // Support both DeepFace and FaceNet-PyTorch
                $faceReady = $result['facenet_ready'] ?? $result['deepface_ready'] ?? false;
                return response()->json([
                    'success' => true,
                    'ai_service' => 'online',
                    'deepface_ready' => $faceReady, // Keep for backward compatibility
                    'facenet_ready' => $faceReady,
                    'model' => $result['model'] ?? 'unknown',
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
     * Xóa cache embedding khi avatar được cập nhật
     * 
     * @OA\Post(
     *     path="/admin/face/clear-cache",
     *     tags={"Face Recognition"},
     *     summary="Xóa cache embedding để cập nhật avatar mới",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Cache đã được xóa")
     * )
     */
    public function clearCache(Request $request)
    {
        $this->ensureAdmin($request);

        try {
            $response = Http::timeout(5)
                ->withoutVerifying()
                ->post($this->aiServiceUrl . '/face/clear-cache');

            if ($response->successful()) {
                $result = $response->json();
                return response()->json([
                    'success' => true,
                    'cleared' => $result['cleared'] ?? 0,
                    'message' => $result['message'] ?? 'Cache đã được xóa'
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

    /**
     * Cập nhật avatar thủ công từ ảnh đã crop (cho nhân viên)
     * 
     * @OA\Post(
     *     path="/admin/face/update-avatar",
     *     tags={"Face Recognition"},
     *     summary="Cập nhật avatar thủ công",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="customer_id", type="integer", description="ID khách hàng"),
     *         @OA\Property(property="cropped_face", type="string", description="Ảnh mặt đã crop (base64)")
     *     )),
     *     @OA\Response(response=200, description="Cập nhật thành công")
     * )
     */
    public function updateAvatarManual(Request $request)
    {
        $this->ensureAdmin($request);

        $request->validate([
            'customer_id' => ['required', 'integer'],
            'cropped_face' => ['required', 'string'],
        ]);

        $customerId = $request->input('customer_id');
        $croppedFace = $request->input('cropped_face');

        $customer = User::find($customerId);
        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy khách hàng'
            ], 404);
        }

        try {
            $avatarPath = $this->saveCroppedAvatar($croppedFace, $customerId);
            if ($avatarPath) {
                $customer->avatar = $avatarPath;
                $customer->save();

                // Clear cache embedding của khách này
                try {
                    Http::timeout(5)
                        ->withoutVerifying()
                        ->post($this->aiServiceUrl . '/face/clear-cache');
                } catch (\Exception $e) {
                    // Bỏ qua nếu không clear được cache
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Cập nhật avatar thành công',
                    'avatar' => $avatarPath,
                    'customer_id' => $customerId
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Không thể lưu ảnh avatar'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi cập nhật avatar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lưu ảnh face đã crop thành avatar mới
     */
    private function saveCroppedAvatar(string $croppedFaceBase64, int $customerId): ?string
    {
        // Loại bỏ prefix data:image
        if (str_starts_with($croppedFaceBase64, 'data:image')) {
            $croppedFaceBase64 = substr($croppedFaceBase64, strpos($croppedFaceBase64, ',') + 1);
        }

        $data = base64_decode($croppedFaceBase64);
        if (!$data) {
            return null;
        }

        $uploadDir = public_path('uploads/avatars');
        if (!File::exists($uploadDir)) {
            File::makeDirectory($uploadDir, 0755, true);
        }

        $fileName = 'avatar_' . $customerId . '_' . time() . '.jpeg';
        $filePath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

        if (file_put_contents($filePath, $data) === false) {
            return null;
        }

        // Đường dẫn lưu trong DB (relative từ public/)
        return '/uploads/avatars/' . $fileName;
    }
}
