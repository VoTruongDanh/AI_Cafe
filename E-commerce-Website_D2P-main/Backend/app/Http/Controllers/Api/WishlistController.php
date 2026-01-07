<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    /**
     * Get user's wishlist
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Remove wishlist items with NULL product_id (product was force deleted)
        Wishlist::where('user_id', $request->user()->id)
            ->whereNull('product_id')
            ->delete();

        $wishlists = Wishlist::where('user_id', $request->user()->id)
            ->with(['product' => function ($query) {
                $query->with(['images', 'category', 'promotions' => function ($q) {
                    $q->active();
                }]);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Thêm thông tin giá hiệu lực cho từng sản phẩm
        $wishlists->transform(function ($wishlist) {
            if ($wishlist->product) {
                $wishlist->product->effective_price = $wishlist->product->effective_price;
                $wishlist->product->has_active_promotion = $wishlist->product->has_active_promotion;
            }
            return $wishlist;
        });

        return response()->json([
            'data' => $wishlists,
            'total' => $wishlists->count(),
        ]);
    }

    /**
     * Add product to wishlist
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $userId = $request->user()->id;
        $productId = $request->product_id;

        // Kiểm tra sản phẩm có tồn tại và không bị xóa
        $product = Product::find($productId);
        if (!$product) {
            return response()->json([
                'message' => 'Sản phẩm không tồn tại',
            ], 404);
        }

        // Kiểm tra đã có trong wishlist chưa
        $exists = Wishlist::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Sản phẩm đã có trong danh sách yêu thích',
                'already_exists' => true,
            ], 200);
        }

        // Thêm vào wishlist
        $wishlist = Wishlist::create([
            'user_id' => $userId,
            'product_id' => $productId,
        ]);

        // Load product info
        $wishlist->load(['product' => function ($query) {
            $query->with(['images', 'category', 'promotions' => function ($q) {
                $q->active();
            }]);
        }]);

        return response()->json([
            'message' => 'Đã thêm vào danh sách yêu thích',
            'data' => $wishlist,
        ], 201);
    }

    /**
     * Remove product from wishlist
     * 
     * @param int $productId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $productId)
    {
        $deleted = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Sản phẩm không có trong danh sách yêu thích',
            ], 404);
        }

        return response()->json([
            'message' => 'Đã xóa khỏi danh sách yêu thích',
        ]);
    }

    /**
     * Clear all wishlist items
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function clear(Request $request)
    {
        $count = Wishlist::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Đã xóa tất cả sản phẩm yêu thích',
            'deleted_count' => $count,
        ]);
    }

    /**
     * Check if product is in wishlist
     * 
     * @param int $productId
     * @return \Illuminate\Http\JsonResponse
     */
    public function check(Request $request, $productId)
    {
        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->exists();

        return response()->json([
            'in_wishlist' => $exists,
        ]);
    }

    /**
     * Get wishlist count
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function count(Request $request)
    {
        $count = Wishlist::where('user_id', $request->user()->id)->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Sync wishlist from local storage
     * Dùng để đồng bộ wishlist từ LocalStorage lên server khi user đăng nhập
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sync(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $userId = $request->user()->id;
        $productIds = $request->product_ids;

        DB::beginTransaction();
        try {
            $added = 0;
            $skipped = 0;

            foreach ($productIds as $productId) {
                // Kiểm tra đã có chưa
                $exists = Wishlist::where('user_id', $userId)
                    ->where('product_id', $productId)
                    ->exists();

                if (!$exists) {
                    Wishlist::create([
                        'user_id' => $userId,
                        'product_id' => $productId,
                    ]);
                    $added++;
                } else {
                    $skipped++;
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Đồng bộ thành công',
                'added' => $added,
                'skipped' => $skipped,
                'total' => $added + $skipped,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi đồng bộ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
