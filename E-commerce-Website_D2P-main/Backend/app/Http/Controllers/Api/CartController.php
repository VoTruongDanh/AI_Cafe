<?php

namespace App\Http\Controllers\Api;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use OpenApi\Annotations as OA;

class CartController extends \App\Http\Controllers\Controller
{
    /**
     * @OA\Get(
     *     path="/cart",
     *     tags={"Cart"},
     *     summary="Lấy giỏ hàng hiện tại",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Giỏ hàng", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function show(Request $request)
    {
        $cart = $this->getActiveCart($request);

        // Remove items with NULL product_id (product was force deleted)
        $cart->items()->whereNull('product_id')->delete();

        // Remove items with deleted products (soft deleted)
        $cart->items()->whereHas('product', function ($query) {
            $query->onlyTrashed();
        })->delete();

        // Recalculate cart after removing deleted items
        $this->recalculateCart($cart);

        return response()->json($cart->refresh()->load('items.product.images', 'promotion'));
    }

    /**
     * @OA\Post(
     *     path="/cart/items",
     *     tags={"Cart"},
     *     summary="Thêm sản phẩm vào giỏ",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"product_id","quantity"},
     *             @OA\Property(property="product_id", type="integer", example=1),
     *             @OA\Property(property="quantity", type="integer", example=2)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Giỏ hàng cập nhật", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=422, description="Không đủ hàng")
     * )
     */
    public function addItem(Request $request)
    {
        $cart = $this->getActiveCart($request);

        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        // ✅ BUG FIX: Validate số lượng không quá lớn (tránh integer overflow)
        if ($data['quantity'] > 10000) {
            return response()->json(['message' => 'Số lượng không hợp lệ.'], 422);
        }

        $product = Product::findOrFail($data['product_id']);

        // Check if product is soft deleted
        if ($product->trashed()) {
            return response()->json(['message' => 'Sản phẩm này không còn tồn tại.'], 404);
        }

        if ($product->status !== 'published') {
            return response()->json(['message' => 'Sản phẩm không khả dụng.'], 422);
        }

        // ✅ BUG FIX: Sử dụng effective_price từ database (không tin giá từ client)
        $unitPrice = $product->effective_price ?? $product->price;

        // ✅ BUG FIX: Validate giá phải lớn hơn 0 (tránh free items)
        if ($unitPrice <= 0) {
            return response()->json(['message' => 'Sản phẩm không có giá hợp lệ.'], 422);
        }

        // ✅ BUG FIX: Sử dụng transaction với lock để tránh race condition
        return DB::transaction(function () use ($cart, $product, $data, $unitPrice) {
            $item = $cart->items()->where('product_id', $product->id)->lockForUpdate()->first();

            if ($item) {
                // Kiểm tra tổng số lượng sau khi cộng dồn
                $newQuantity = $item->quantity + $data['quantity'];
                if ($newQuantity > $product->quantity) {
                    return response()->json([
                        'message' => "Chỉ còn {$product->quantity} sản phẩm trong kho. Bạn đã có {$item->quantity} sản phẩm trong giỏ hàng."
                    ], 422);
                }
                $item->quantity = $newQuantity;
                $item->unit_price = $unitPrice;
            } else {
                // Kiểm tra số lượng khi thêm mới
                if ($data['quantity'] > $product->quantity) {
                    return response()->json([
                        'message' => "Chỉ còn {$product->quantity} sản phẩm trong kho."
                    ], 422);
                }
                $item = $cart->items()->make([
                    'product_id' => $product->id,
                    'quantity' => $data['quantity'],
                    'unit_price' => $unitPrice,
                ]);
            }

            $item->discount_amount = $this->calculateItemDiscount($cart, $product);
            $item->line_total = ((float) $item->unit_price - (float) $item->discount_amount) * $item->quantity;
            $item->save();

            $this->recalculateCart($cart);

            return response()->json($cart->refresh()->load('items.product.images', 'promotion'));
        });
    }

    /**
     * @OA\Patch(
     *     path="/cart/items/{id}",
     *     tags={"Cart"},
     *     summary="Cập nhật số lượng sản phẩm trong giỏ",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(@OA\Property(property="quantity", type="integer", example=2))),
     *     @OA\Response(response=200, description="Giỏ hàng cập nhật", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Không đủ hàng")
     * )
     */
    public function updateItem(Request $request, CartItem $cartItem)
    {
        $cart = $this->getActiveCart($request);

        if ($cartItem->cart_id !== $cart->id) {
            abort(404);
        }

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = $cartItem->product;

        // Check if product is soft deleted
        if (!$product || $product->trashed()) {
            return response()->json(['message' => 'Sản phẩm này không còn tồn tại.'], 404);
        }

        if ($product->quantity < $data['quantity']) {
            return response()->json(['message' => 'Sản phẩm không đủ hàng.'], 422);
        }

        // Cập nhật giá theo effective_price mới nhất (phòng trường hợp khuyến mãi thay đổi)
        $cartItem->unit_price = $product->effective_price ?? $product->price;
        $cartItem->quantity = $data['quantity'];
    $cartItem->discount_amount = $this->calculateItemDiscount($cart, $product);
    $cartItem->line_total = ((float) $cartItem->unit_price - (float) $cartItem->discount_amount) * $cartItem->quantity;
        $cartItem->save();

        $this->recalculateCart($cart);

    return response()->json($cart->refresh()->load('items.product.images', 'promotion'));
    }

    /**
     * @OA\Delete(
     *     path="/cart/items/{id}",
     *     tags={"Cart"},
     *     summary="Xóa sản phẩm khỏi giỏ",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Giỏ hàng cập nhật", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function removeItem(Request $request, CartItem $cartItem)
    {
        try {
            $cart = $this->getActiveCart($request);

            // Check if cart item belongs to this user's cart
            if ($cartItem->cart_id !== $cart->id) {
                return response()->json(['message' => 'Không tìm thấy sản phẩm trong giỏ hàng.'], 404);
            }

            $cartItem->delete();

            $this->recalculateCart($cart);

            return response()->json($cart->refresh()->load('items.product.images', 'promotion'));
        } catch (\Exception $e) {
            Log::error('Error removing cart item: ' . $e->getMessage());
            return response()->json(['message' => 'Có lỗi xảy ra khi xóa sản phẩm.'], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/cart/apply-promotion",
     *     tags={"Cart"},
     *     summary="Áp mã khuyến mãi",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(@OA\Property(property="code", type="string", example="SALE10"))),
     *     @OA\Response(response=200, description="Giỏ hàng cập nhật", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=422, description="Không hợp lệ")
     * )
     */
    public function applyPromotion(Request $request)
    {
        $cart = $this->getActiveCart($request);

        $data = $request->validate([
            'code' => ['required', 'string'],
        ]);

        // ✅ BUG FIX: Chỉ cho phép áp dụng mã loại "coupon", không phải flash_sale hay special_offer
        $promotion = Promotion::where('code', $data['code'])
            ->where('is_active', true)
            ->where(function($q) {
                $q->where('promotion_category', 'coupon')
                  ->orWhereNull('promotion_category');
            })
            ->first();

        if (!$promotion) {
            return response()->json(['message' => 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.'], 422);
        }

        // ✅ BUG FIX: Kiểm tra thời gian hiệu lực
        $now = now();
        if ($promotion->starts_at && $promotion->starts_at->gt($now)) {
            return response()->json(['message' => 'Mã khuyến mãi chưa bắt đầu.'], 422);
        }
        if ($promotion->ends_at && $promotion->ends_at->lt($now)) {
            return response()->json(['message' => 'Mã khuyến mãi đã hết hạn.'], 422);
        }

        // ✅ BUG FIX: Kiểm tra usage_limit (tránh coupon reuse)
        if ($promotion->usage_limit && $promotion->used_count >= $promotion->usage_limit) {
            return response()->json(['message' => 'Mã khuyến mãi đã hết lượt sử dụng.'], 422);
        }

        // ✅ BUG FIX: Kiểm tra user đã dùng mã này chưa (nếu có giới hạn 1 lần/user)
        if ($promotion->usage_limit === 1) {
            $usedByUser = \DB::table('orders')
                ->where('user_id', $request->user()->id)
                ->where('promotion_id', $promotion->id)
                ->whereNotIn('status', ['cancelled', 'returned'])
                ->exists();
            
            if ($usedByUser) {
                return response()->json(['message' => 'Bạn đã sử dụng mã khuyến mãi này rồi.'], 422);
            }
        }

        if ($promotion->min_order_value && $cart->subtotal < $promotion->min_order_value) {
            return response()->json(['message' => 'Giá trị đơn hàng không đủ điều kiện.'], 422);
        }

        // ✅ BUG FIX: Không cho phép stacking promotions (nếu is_stackable = false)
        if (!$promotion->is_stackable && $cart->promotion_id) {
            return response()->json(['message' => 'Không thể áp dụng nhiều mã khuyến mãi cùng lúc.'], 422);
        }

        $cart->promotion()->associate($promotion);
        $cart->save();

        $this->recalculateCart($cart);

        return response()->json($cart->refresh()->load('items.product.images', 'promotion'));
    }

    /**
     * @OA\Post(
     *     path="/cart/remove-promotion",
     *     tags={"Cart"},
     *     summary="Xóa mã khuyến mãi khỏi giỏ hàng",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Đã xóa mã khuyến mãi", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function removePromotion(Request $request)
    {
        $cart = $this->getActiveCart($request);

        $cart->promotion()->dissociate();
        $cart->discount_total = 0;
        $cart->save();

        $this->recalculateCart($cart);

        return response()->json($cart->refresh()->load('items.product.images', 'promotion'));
    }

    /**
     * @OA\Post(
     *     path="/cart/validate-stock",
     *     tags={"Cart"},
     *     summary="Kiểm tra tồn kho trước khi checkout",
     *     description="Validate tất cả sản phẩm trong giỏ hàng có đủ stock không",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200, 
     *         description="Tất cả sản phẩm có đủ stock",
     *         @OA\JsonContent(
     *             @OA\Property(property="valid", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Tất cả sản phẩm có sẵn"),
     *             @OA\Property(property="items", type="array", @OA\Items(
     *                 @OA\Property(property="product_id", type="integer"),
     *                 @OA\Property(property="product_name", type="string"),
     *                 @OA\Property(property="requested", type="integer"),
     *                 @OA\Property(property="available", type="integer"),
     *                 @OA\Property(property="valid", type="boolean")
     *             ))
     *         )
     *     ),
     *     @OA\Response(response=422, description="Một số sản phẩm không đủ stock"),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function validateStock(Request $request)
    {
        $cart = $this->getActiveCart($request);
        
        if ($cart->items->isEmpty()) {
            return response()->json([
                'valid' => false,
                'message' => 'Giỏ hàng trống',
                'items' => []
            ], 422);
        }

        $validationResults = [];
        $allValid = true;
        $outOfStockItems = [];

        foreach ($cart->items as $item) {
            $product = Product::find($item->product_id);
            
            // Kiểm tra sản phẩm còn tồn tại và active
            if (!$product || $product->trashed() || $product->status !== 'published') {
                $allValid = false;
                $validationResults[] = [
                    'product_id' => $item->product_id,
                    'product_name' => $product ? $product->name : 'Sản phẩm không tồn tại',
                    'requested' => $item->quantity,
                    'available' => 0,
                    'valid' => false,
                    'reason' => 'Sản phẩm không còn kinh doanh'
                ];
                $outOfStockItems[] = $product ? $product->name : 'Sản phẩm không tồn tại';
                continue;
            }

            // Kiểm tra stock
            $isValid = $product->quantity >= $item->quantity;
            
            if (!$isValid) {
                $allValid = false;
                $outOfStockItems[] = $product->name;
            }

            $validationResults[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'requested' => $item->quantity,
                'available' => $product->quantity,
                'valid' => $isValid,
                'reason' => $isValid ? null : 'Không đủ hàng'
            ];
        }

        if ($allValid) {
            return response()->json([
                'valid' => true,
                'message' => 'Tất cả sản phẩm có sẵn',
                'items' => $validationResults
            ]);
        }

        return response()->json([
            'valid' => false,
            'message' => 'Một số sản phẩm không đủ hàng: ' . implode(', ', $outOfStockItems),
            'items' => $validationResults
        ], 422);
    }

    /**
     * @OA\Post(
     *     path="/cart/clear",
     *     tags={"Cart"},
     *     summary="Xóa toàn bộ giỏ hàng",
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Giỏ hàng trống", @OA\JsonContent(ref="#/components/schemas/Cart")),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function clear(Request $request)
    {
        $cart = $this->getActiveCart($request);
        $cart->items()->delete();
    $cart->promotion()->dissociate();
    $cart->discount_total = 0;
    $cart->subtotal = 0;
    $cart->grand_total = 0;
    $cart->total_quantity = 0;
        $cart->save();

        return response()->json($cart->refresh()->load('items.product.images'));
    }

    protected function getActiveCart(Request $request): Cart
    {
        $cart = Cart::firstOrCreate(
            ['user_id' => $request->user()->id, 'status' => 'active'],
            [
                'total_quantity' => 0,
                'subtotal' => 0,
                'discount_total' => 0,
                'grand_total' => 0,
            ]
        );

        if ($cart->expires_at && $cart->expires_at->isPast()) {
            $cart->update(['expires_at' => now()->addDays(3)]);
        }

        return $cart;
    }

    protected function recalculateCart(Cart $cart): void
    {
    $cart->loadMissing('items', 'promotion');

        $subtotal = $cart->items->sum(function ($item) {
            return (float) $item->line_total;
        });
        $cart->subtotal = $subtotal;
        $cart->total_quantity = $cart->items->sum('quantity');

        $discount = 0;

        if ($cart->promotion) {
            $discount = $this->calculatePromotionDiscount($cart, $cart->promotion);
        }

    $cart->discount_total = $discount;
    $cart->grand_total = max(0, $subtotal - $discount);
        $cart->save();
    }

    protected function calculatePromotionDiscount(Cart $cart, Promotion $promotion): float
    {
        $discount = 0;

        if ($promotion->promotion_type === 'percentage') {
            $discount = $cart->subtotal * ($promotion->value / 100);
        } else {
            $discount = $promotion->value;
        }

        if ($promotion->max_discount_value) {
            $discount = min($discount, $promotion->max_discount_value);
        }

        return min($discount, (float) $cart->subtotal);
    }

    protected function calculateItemDiscount(Cart $cart, Product $product): float
    {
        if (!$cart->promotion || !$product->promotions()->whereKey($cart->promotion_id)->exists()) {
            return 0;
        }

        $promotion = $cart->promotion;

        if ($promotion->promotion_type === 'percentage') {
            return $product->price * ($promotion->value / 100);
        }

        return min($promotion->value, $product->price);
    }
}
