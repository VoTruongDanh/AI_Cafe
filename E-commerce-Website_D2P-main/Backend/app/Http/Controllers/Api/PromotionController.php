<?php

namespace App\Http\Controllers\Api;

use App\Models\Promotion;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class PromotionController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/api/promotions",
     *     tags={"Promotions"},
     *     summary="Danh sách chương trình khuyến mãi",
     *     @OA\Parameter(name="only_active", in="query", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách chương trình",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Promotion")),
     *             @OA\Property(property="links", type="object"),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    public function index(Request $request)
    {
        // ✅ Log request để debug
        \Log::info('🎫 [PromotionController] Request params', [
            'only_active' => $request->input('only_active'),
            'category' => $request->input('category'),
            'all_params' => $request->all(),
        ]);
        
        // ✅ Kiểm tra xem có phải admin không
        $isAdmin = $request->user() && $request->user()->role === 'admin';

        $query = Promotion::query();

        // Load products relationship if requested
        if ($request->boolean('with_products', true)) {
            $query->withCount('products');
        }

        $promotions = $query
            // ✅ Chỉ filter channels nếu KHÔNG phải admin
            ->when(!$isAdmin, function ($q) {
                $q->where(function ($query) {
                    $query->whereNull('channels')
                        ->orWhereJsonContains('channels', 'web')
                        ->orWhereJsonContains('channels', 'online')
                        ->orWhereJsonContains('channels', 'website')
                        ->orWhereJsonContains('channels', 'all');
                });
            })
            ->when($request->boolean('only_active'), fn ($q) => $q->active())
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->input('search');
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%");
                });
            })
            // Filter theo loại khuyến mãi (flash_sale, special_offer, coupon)
            ->when($request->filled('category'), function ($query) use ($request) {
                $category = $request->input('category');
                $query->where('promotion_category', $category);
            })
            ->orderByDesc('starts_at')
            ->paginate($request->input('per_page', 15));

        // Load products for each promotion after pagination
        if ($request->boolean('with_products', true)) {
            $promotions->load('products:id,name,price,thumbnail');
        }

        return response()->json($promotions);
    }

    /**
     * @OA\Post(
     *     path="/api/promotions",
     *     tags={"Promotions"},
     *     summary="Tạo chương trình khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/PromotionStoreRequest")),
     *     @OA\Response(response=201, description="Tạo thành công", @OA\JsonContent(ref="#/components/schemas/Promotion")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $this->validatePromotion($request);
        
        // ✅ KIỂM TRA GIỚI HẠN FLASH SALE VÀ SPECIAL OFFER
        $promotionCategory = $data['promotion_category'] ?? 'coupon';
        $isActive = $data['is_active'] ?? true;
        
        if ($isActive && in_array($promotionCategory, ['flash_sale', 'special_offer'])) {
            // Kiểm tra xem đã có promotion cùng loại đang hoạt động chưa
            $existingPromotion = Promotion::where('promotion_category', $promotionCategory)
                ->where('is_active', true)
                ->where(function ($q) {
                    $now = now();
                    $q->where(function ($q2) use ($now) {
                        $q2->whereNull('starts_at')
                            ->orWhere('starts_at', '<=', $now);
                    })
                    ->where(function ($q2) use ($now) {
                        $q2->whereNull('ends_at')
                            ->orWhere('ends_at', '>=', $now);
                    });
                })
                ->first();
            
            if ($existingPromotion) {
                $categoryName = $promotionCategory === 'flash_sale' ? 'Flash Sale' : 'Khuyến mãi đặc biệt';
                return response()->json([
                    'message' => "Chỉ được có 1 {$categoryName} đang hoạt động. Vui lòng tắt hoặc chỉnh sửa '{$existingPromotion->name}' trước khi thêm mới.",
                    'existing_promotion' => [
                        'id' => $existingPromotion->id,
                        'name' => $existingPromotion->name,
                        'code' => $existingPromotion->code,
                    ]
                ], 422);
            }
        }

        $promotion = Promotion::create($data);

        $conflictInfo = [];
        if ($productIds = $request->input('product_ids')) {
            // ✅ Kiểm tra xung đột khuyến mãi và lấy thông tin
            $conflictInfo = $this->validatePromotionConflict($promotion, $productIds);
            
            $promotion->products()->sync($productIds);
        }

        // ✅ Broadcast event
        event(new \App\Events\PromotionCreated($promotion));

        $response = [
            'promotion' => $promotion->load('products'),
            'message' => 'Thêm khuyến mãi thành công!',
        ];
        
        // ✅ Thêm thông tin xung đột nếu có
        if (!empty($conflictInfo)) {
            $response['conflicts'] = $conflictInfo;
            $response['message'] .= ' Một số sản phẩm đã được tự động loại bỏ khỏi khuyến mãi xung đột.';
        }

        return response()->json($response, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/promotions/{id}",
     *     tags={"Promotions"},
     *     summary="Chi tiết chương trình khuyến mãi",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết", @OA\JsonContent(ref="#/components/schemas/Promotion")),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Request $request, $id)
    {
        // ✅ Kiểm tra xem có phải admin không
        $isAdmin = $request->user() && $request->user()->role === 'admin';

        $query = Promotion::where('id', $id);

        // ✅ Chỉ filter channels nếu KHÔNG phải admin
        if (!$isAdmin) {
            $query->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhereJsonContains('channels', 'web')
                    ->orWhereJsonContains('channels', 'online')
                    ->orWhereJsonContains('channels', 'website')
                    ->orWhereJsonContains('channels', 'all');
            });
        }

        $promotion = $query->firstOrFail();

        return response()->json($promotion->load('products'));
    }

    /**
     * @OA\Put(
     *     path="/api/promotions/{id}",
     *     tags={"Promotions"},
     *     summary="Cập nhật chương trình khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/PromotionUpdateRequest")),
     *     @OA\Response(response=200, description="Cập nhật thành công", @OA\JsonContent(ref="#/components/schemas/Promotion")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function update(Request $request, $id)
    {
        $this->ensureAdmin($request);

        // ✅ Log request data để debug
        \Log::info('🔍 [PromotionController] Update request', [
            'promotion_id' => $id,
            'is_active' => $request->input('is_active'),
            'is_active_type' => gettype($request->input('is_active')),
            'all_data' => $request->all(),
        ]);

        // ✅ Tìm promotion với filter channels cho web
        $promotion = Promotion::where('id', $id)
            ->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhereJsonContains('channels', 'web')
                    ->orWhereJsonContains('channels', 'online')
                    ->orWhereJsonContains('channels', 'website')
                    ->orWhereJsonContains('channels', 'all');
            })
            ->firstOrFail();

        $data = $this->validatePromotion($request, $promotion->id);
        
        // ✅ KIỂM TRA GIỚI HẠN FLASH SALE VÀ SPECIAL OFFER KHI UPDATE
        $promotionCategory = $data['promotion_category'] ?? $promotion->promotion_category ?? 'coupon';
        $isActive = $data['is_active'] ?? $promotion->is_active ?? true;
        
        if ($isActive && in_array($promotionCategory, ['flash_sale', 'special_offer'])) {
            // Kiểm tra xem đã có promotion cùng loại đang hoạt động chưa (ngoại trừ promotion hiện tại)
            $existingPromotion = Promotion::where('promotion_category', $promotionCategory)
                ->where('is_active', true)
                ->where('id', '!=', $id)
                ->where(function ($q) {
                    $now = now();
                    $q->where(function ($q2) use ($now) {
                        $q2->whereNull('starts_at')
                            ->orWhere('starts_at', '<=', $now);
                    })
                    ->where(function ($q2) use ($now) {
                        $q2->whereNull('ends_at')
                            ->orWhere('ends_at', '>=', $now);
                    });
                })
                ->first();
            
            if ($existingPromotion) {
                $categoryName = $promotionCategory === 'flash_sale' ? 'Flash Sale' : 'Khuyến mãi đặc biệt';
                return response()->json([
                    'message' => "Chỉ được có 1 {$categoryName} đang hoạt động. Vui lòng tắt hoặc chỉnh sửa '{$existingPromotion->name}' trước.",
                    'existing_promotion' => [
                        'id' => $existingPromotion->id,
                        'name' => $existingPromotion->name,
                        'code' => $existingPromotion->code,
                    ]
                ], 422);
            }
        }
        
        // ✅ Log validated data
        \Log::info('✅ [PromotionController] Validated data', [
            'is_active' => $data['is_active'] ?? 'NOT SET',
            'is_active_type' => isset($data['is_active']) ? gettype($data['is_active']) : 'N/A',
        ]);

        $promotion->fill($data)->save();

        $conflictInfo = [];
        if ($request->has('product_ids')) {
            $productIds = $request->input('product_ids', []);
            
            // ✅ Kiểm tra xung đột khuyến mãi và lấy thông tin
            $conflictInfo = $this->validatePromotionConflict($promotion, $productIds);
            
            $promotion->products()->sync($productIds);
        }

        // ✅ Broadcast event
        event(new \App\Events\PromotionUpdated($promotion));

        $response = [
            'promotion' => $promotion->load('products'),
            'message' => 'Cập nhật khuyến mãi thành công!',
        ];
        
        // ✅ Thêm thông tin xung đột nếu có
        if (!empty($conflictInfo)) {
            $response['conflicts'] = $conflictInfo;
            $response['message'] .= ' Một số sản phẩm đã được tự động loại bỏ khỏi khuyến mãi xung đột.';
        }

        return response()->json($response);
    }

    /**
     * @OA\Delete(
     *     path="/api/promotions/{id}",
     *     tags={"Promotions"},
     *     summary="Xóa chương trình khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã xóa"),
     *     @OA\Response(response=400, description="Không thể xóa khuyến mãi"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy(Request $request, $id)
    {
        $this->ensureAdmin($request);

        // ✅ Tìm promotion với filter channels cho web
        $promotion = Promotion::where('id', $id)
            ->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhereJsonContains('channels', 'web')
                    ->orWhereJsonContains('channels', 'online')
                    ->orWhereJsonContains('channels', 'website')
                    ->orWhereJsonContains('channels', 'all');
            })
            ->firstOrFail();

        // Kiểm tra các ràng buộc trước khi xóa
        $canDelete = $this->canDeletePromotion($promotion);
        
        // Log để debug
        \Log::info('Attempting to delete promotion', [
            'promotion_id' => $promotion->id,
            'can_delete' => $canDelete['can_delete'],
            'reasons' => $canDelete['reasons']
        ]);
        
        if (!$canDelete['can_delete']) {
            $response = [
                'message' => $canDelete['message'],
                'reasons' => $canDelete['reasons'],
                'suggestion' => 'Khuyến nghị: Vô hiệu hóa khuyến mãi (is_active = false) thay vì xóa. Điều này sẽ ngừng áp dụng khuyến mãi nhưng vẫn giữ lại dữ liệu lịch sử.',
                'debug' => [
                    'promotion_id' => $promotion->id,
                    'promotion_name' => $promotion->name,
                    'is_active' => $promotion->is_active,
                    'used_count' => $promotion->used_count
                ]
            ];
            
            \Log::warning('Cannot delete promotion', $response);
            
            return response()->json($response, 400);
        }

        // Xóa liên kết với sản phẩm
        $promotion->products()->detach();

        // Xóa khuyến mãi (soft delete)
        $promotion->delete();

        return response()->json(['message' => 'Đã xóa chương trình khuyến mãi thành công.']);
    }

    /**
     * Kiểm tra xem khuyến mãi có thể xóa được không
     * 
     * Điều kiện để xóa được:
     * 1. Không có đơn hàng nào đang sử dụng (hoặc chỉ có đơn đã hủy/hoàn trả)
     * 2. Không có giỏ hàng nào đang áp dụng
     * 3. Khuyến mãi đã hết hạn hoặc chưa bắt đầu
     */
    protected function canDeletePromotion(Promotion $promotion): array
    {
        $reasons = [];
        
        // 1. Kiểm tra đơn hàng đang sử dụng khuyến mãi
        $ordersCount = \DB::table('orders')
            ->where('promotion_id', $promotion->id)
            ->whereNotIn('status', ['cancelled', 'returned'])
            ->whereNull('deleted_at')
            ->count();
        
        if ($ordersCount > 0) {
            $reasons[] = "Có {$ordersCount} đơn hàng đang sử dụng khuyến mãi này";
        }

        // 2. Kiểm tra lịch sử đơn hàng (kể cả đã hoàn thành)
        $totalOrdersCount = \DB::table('orders')
            ->where('promotion_id', $promotion->id)
            ->whereNull('deleted_at')
            ->count();
        
        if ($totalOrdersCount > 0) {
            $reasons[] = "Có lịch sử {$totalOrdersCount} đơn hàng đã sử dụng khuyến mãi này";
        }

        // 3. Kiểm tra giỏ hàng đang áp dụng
        $cartsCount = \DB::table('carts')
            ->where('promotion_id', $promotion->id)
            ->where('status', 'active')
            ->count();
        
        if ($cartsCount > 0) {
            $reasons[] = "Có {$cartsCount} giỏ hàng đang áp dụng khuyến mãi này";
        }

        // 4. Kiểm tra khuyến mãi đang hoạt động
        $now = now();
        $isActive = $promotion->is_active && 
                    (!$promotion->starts_at || $promotion->starts_at->lte($now)) &&
                    (!$promotion->ends_at || $promotion->ends_at->gte($now));
        
        if ($isActive) {
            $reasons[] = "Khuyến mãi đang trong thời gian hoạt động";
        }

        // 5. Kiểm tra số lần đã sử dụng
        if ($promotion->used_count > 0) {
            $reasons[] = "Khuyến mãi đã được sử dụng {$promotion->used_count} lần";
        }

        $canDelete = empty($reasons);
        
        return [
            'can_delete' => $canDelete,
            'message' => $canDelete 
                ? 'Có thể xóa khuyến mãi' 
                : 'Không thể xóa khuyến mãi vì các lý do sau:',
            'reasons' => $reasons
        ];
    }

    /**
     * Kiểm tra xem khuyến mãi có thể xóa được không (API endpoint)
     * 
     * @OA\Get(
     *     path="/promotions/{id}/can-delete",
     *     tags={"Promotions"},
     *     summary="Kiểm tra xem khuyến mãi có thể xóa được không",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Thông tin kiểm tra"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function canDelete(Request $request, $id)
    {
        $this->ensureAdmin($request);

        // ✅ Tìm promotion với filter channels cho web
        $promotion = Promotion::where('id', $id)
            ->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhereJsonContains('channels', 'web')
                    ->orWhereJsonContains('channels', 'online')
                    ->orWhereJsonContains('channels', 'website')
                    ->orWhereJsonContains('channels', 'all');
            })
            ->firstOrFail();
        
        $result = $this->canDeletePromotion($promotion);
        
        return response()->json($result);
    }

    /**
     * @OA\Post(
     *     path="/api/promotions/validate",
     *     tags={"Promotions"},
     *     summary="Kiểm tra và áp dụng mã khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"code", "order_total"},
     *             @OA\Property(property="code", type="string", example="SUMMER10"),
     *             @OA\Property(property="order_total", type="number", example=10000000),
     *             @OA\Property(property="cart_items", type="array", @OA\Items(
     *                 @OA\Property(property="product_id", type="integer"),
     *                 @OA\Property(property="quantity", type="integer")
     *             ))
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Mã hợp lệ",
     *         @OA\JsonContent(
     *             @OA\Property(property="valid", type="boolean", example=true),
     *             @OA\Property(property="discount", type="number", example=1000000),
     *             @OA\Property(property="promotion", ref="#/components/schemas/Promotion")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Mã không hợp lệ")
     * )
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'order_total' => 'required|numeric|min:0',
            'cart_items' => 'nullable|array',
        ]);

        $code = strtoupper($request->input('code'));
        $orderTotal = $request->input('order_total');
        $cartItems = $request->input('cart_items', []);

        // Find promotion by code - chỉ chấp nhận mã loại "coupon" và áp dụng cho web
        $promotion = Promotion::where('code', $code)
            ->where('is_active', true)
            ->where(function($q) {
                $q->where('promotion_category', 'coupon')
                  ->orWhereNull('promotion_category');
            })
            // ✅ Chỉ mã dành cho website
            ->where(function ($q) {
                $q->whereNull('channels')
                    ->orWhereJsonContains('channels', 'web')
                    ->orWhereJsonContains('channels', 'online')
                    ->orWhereJsonContains('channels', 'website')
                    ->orWhereJsonContains('channels', 'all');
            })
            ->first();

        if (!$promotion) {
            return response()->json([
                'valid' => false,
                'message' => 'Mã khuyến mãi không tồn tại hoặc đã hết hạn.'
            ], 400);
        }

        // Check if promotion is active by date
        $now = now();
        if ($promotion->starts_at && $promotion->starts_at->gt($now)) {
            return response()->json([
                'valid' => false,
                'message' => 'Mã khuyến mãi chưa bắt đầu.'
            ], 400);
        }

        if ($promotion->ends_at && $promotion->ends_at->lt($now)) {
            return response()->json([
                'valid' => false,
                'message' => 'Mã khuyến mãi đã hết hạn.'
            ], 400);
        }

        // Check minimum order value
        if ($promotion->min_order_value && $orderTotal < $promotion->min_order_value) {
            return response()->json([
                'valid' => false,
                'message' => "Đơn hàng tối thiểu " . number_format($promotion->min_order_value) . "đ để sử dụng mã này."
            ], 400);
        }

        // Calculate discount
        $discount = 0;
        if ($promotion->promotion_type === 'percentage') {
            $discount = ($orderTotal * $promotion->value) / 100;
            if ($promotion->max_discount_value) {
                $discount = min($discount, $promotion->max_discount_value);
            }
        } else {
            $discount = $promotion->value;
        }

        return response()->json([
            'valid' => true,
            'discount' => $discount,
            'promotion' => $promotion,
            'message' => 'Áp dụng mã thành công! Giảm ' . number_format($discount) . 'đ'
        ]);
    }

    protected function validatePromotion(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:promotions,code,' . $id],
            'description' => ['nullable', 'string'],
            'promotion_type' => ['required', 'in:percentage,fixed'],
            'promotion_category' => ['nullable', 'in:flash_sale,special_offer,coupon'],
            'value' => ['required', 'numeric', 'min:0'],
            'max_discount_value' => ['nullable', 'numeric', 'min:0'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:0'],
            'is_stackable' => ['boolean'],
            'is_active' => ['boolean'],
            'is_flash_sale' => ['boolean'],
            'channels' => ['nullable', 'array'],
            'applies_to' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ]);
    }

    /**
     * Kiểm tra và xử lý xung đột khuyến mãi
     * Tự động loại bỏ sản phẩm khỏi khuyến mãi cũ nếu bị xung đột
     * Sản phẩm không được nằm trong cả Flash Sale và Special Offer cùng lúc
     * 
     * @return array Thông tin về các sản phẩm bị xung đột
     */
    protected function validatePromotionConflict(Promotion $promotion, array $productIds): array
    {
        $conflictInfo = [];
        
        if (empty($productIds)) {
            return $conflictInfo;
        }

        // Chỉ kiểm tra nếu là Flash Sale hoặc Special Offer
        $currentCategory = $promotion->promotion_category;
        if (!in_array($currentCategory, ['flash_sale', 'special_offer'])) {
            return $conflictInfo;
        }

        // Tìm category xung đột
        $conflictCategory = $currentCategory === 'flash_sale' ? 'special_offer' : 'flash_sale';

        // Tìm các khuyến mãi xung đột đang hoạt động
        $conflictPromotions = Promotion::where('promotion_category', $conflictCategory)
            ->where('is_active', true)
            ->where('id', '!=', $promotion->id)
            ->where(function ($q) {
                $now = now();
                $q->where(function ($q2) use ($now) {
                    $q2->whereNull('starts_at')
                        ->orWhere('starts_at', '<=', $now);
                })
                ->where(function ($q2) use ($now) {
                    $q2->whereNull('ends_at')
                        ->orWhere('ends_at', '>=', $now);
                });
            })
            ->get();

        if ($conflictPromotions->isEmpty()) {
            return $conflictInfo;
        }

        // ✅ Tự động loại bỏ các sản phẩm bị xung đột khỏi khuyến mãi cũ
        foreach ($conflictPromotions as $conflictPromotion) {
            // Lấy danh sách product_id hiện tại của khuyến mãi xung đột
            $currentProductIds = $conflictPromotion->products()->pluck('products.id')->toArray();
            
            // Tìm các sản phẩm bị xung đột
            $conflictProductIds = array_intersect($currentProductIds, $productIds);
            
            if (!empty($conflictProductIds)) {
                // Lấy tên sản phẩm để thông báo
                $conflictProducts = \App\Models\Product::whereIn('id', $conflictProductIds)
                    ->pluck('name', 'id')
                    ->toArray();
                
                // Loại bỏ các sản phẩm bị xung đột
                $conflictPromotion->products()->detach($conflictProductIds);
                
                // Lưu thông tin xung đột
                $conflictInfo[] = [
                    'promotion_name' => $conflictPromotion->name,
                    'promotion_code' => $conflictPromotion->code,
                    'category' => $conflictCategory,
                    'products' => $conflictProducts,
                ];
                
                // Log để theo dõi
                \Log::info('Removed products from conflicting promotion', [
                    'removed_from_promotion' => $conflictPromotion->name,
                    'removed_from_category' => $conflictCategory,
                    'product_ids' => $conflictProductIds,
                    'product_names' => array_values($conflictProducts),
                    'added_to_promotion' => $promotion->name,
                    'added_to_category' => $currentCategory,
                ]);
            }
        }
        
        return $conflictInfo;
    }
}
