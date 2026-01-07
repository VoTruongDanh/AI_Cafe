<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RecentlyViewed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Annotations as OA;

class RecentlyViewedController extends Controller
{
    /**
     * @OA\Get(
     *     path="/recently-viewed",
     *     tags={"Recently Viewed"},
     *     summary="Lấy danh sách sản phẩm đã xem",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         description="Số lượng sản phẩm (mặc định 12)",
     *         @OA\Schema(type="integer", default=12)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách sản phẩm đã xem",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Product")),
     *             @OA\Property(property="total", type="integer", example=5)
     *         )
     *     ),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', 12);
        $userId = $request->user()->id;

        // Get recently viewed products with full product details
        $recentlyViewed = RecentlyViewed::where('user_id', $userId)
            ->with(['product.category', 'product.images'])
            ->orderBy('viewed_at', 'desc')
            ->limit($limit)
            ->get();

        $products = $recentlyViewed->map(function ($item) {
            $product = $item->product;
            if ($product) {
                $product->viewed_at = $item->viewed_at;
                return $product;
            }
            return null;
        })->filter();

        return response()->json([
            'data' => $products->values(),
            'total' => $products->count(),
        ]);
    }

    /**
     * @OA\Post(
     *     path="/recently-viewed",
     *     tags={"Recently Viewed"},
     *     summary="Thêm sản phẩm vào lịch sử xem",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"product_id"},
     *             @OA\Property(property="product_id", type="integer", example=5)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Đã thêm vào lịch sử xem",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Đã thêm vào lịch sử xem"),
     *             @OA\Property(property="data", ref="#/components/schemas/RecentlyViewed")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Sản phẩm không tồn tại")
     * )
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $userId = $request->user()->id;
        $productId = $data['product_id'];

        // Check if product exists and is active
        $product = Product::find($productId);
        if (!$product) {
            return response()->json([
                'message' => 'Sản phẩm không tồn tại',
            ], 404);
        }

        // Update or create recently viewed record
        $recentlyViewed = RecentlyViewed::updateOrCreate(
            [
                'user_id' => $userId,
                'product_id' => $productId,
            ],
            [
                'viewed_at' => now(),
            ]
        );

        // Keep only last 50 records per user (cleanup old records)
        $this->cleanupOldRecords($userId, 50);

        return response()->json([
            'message' => 'Đã thêm vào lịch sử xem',
            'data' => $recentlyViewed,
        ], 201);
    }

    /**
     * @OA\Post(
     *     path="/recently-viewed/sync",
     *     tags={"Recently Viewed"},
     *     summary="Đồng bộ lịch sử xem từ LocalStorage",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"product_ids"},
     *             @OA\Property(
     *                 property="product_ids",
     *                 type="array",
     *                 @OA\Items(type="integer"),
     *                 example={1, 2, 3, 4, 5}
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Đồng bộ thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Đã đồng bộ lịch sử xem"),
     *             @OA\Property(property="synced", type="integer", example=5)
     *         )
     *     )
     * )
     */
    public function sync(Request $request)
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ]);

        $userId = $request->user()->id;
        $productIds = array_reverse($data['product_ids']); // Reverse to maintain order (newest first)
        $synced = 0;

        foreach ($productIds as $index => $productId) {
            // Create viewed_at timestamp with decreasing time (newest first)
            $viewedAt = now()->subSeconds($index);

            RecentlyViewed::updateOrCreate(
                [
                    'user_id' => $userId,
                    'product_id' => $productId,
                ],
                [
                    'viewed_at' => $viewedAt,
                ]
            );

            $synced++;
        }

        // Cleanup old records
        $this->cleanupOldRecords($userId, 50);

        return response()->json([
            'message' => 'Đã đồng bộ lịch sử xem',
            'synced' => $synced,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/recently-viewed/clear",
     *     tags={"Recently Viewed"},
     *     summary="Xóa toàn bộ lịch sử xem",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Đã xóa lịch sử xem",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Đã xóa toàn bộ lịch sử xem")
     *         )
     *     )
     * )
     */
    public function clear(Request $request)
    {
        $userId = $request->user()->id;

        RecentlyViewed::where('user_id', $userId)->delete();

        return response()->json([
            'message' => 'Đã xóa toàn bộ lịch sử xem',
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/recently-viewed/{productId}",
     *     tags={"Recently Viewed"},
     *     summary="Xóa một sản phẩm khỏi lịch sử xem",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="productId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Đã xóa khỏi lịch sử xem",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Đã xóa khỏi lịch sử xem")
     *         )
     *     )
     * )
     */
    public function destroy(Request $request, $productId)
    {
        $userId = $request->user()->id;

        RecentlyViewed::where('user_id', $userId)
            ->where('product_id', $productId)
            ->delete();

        return response()->json([
            'message' => 'Đã xóa khỏi lịch sử xem',
        ]);
    }

    /**
     * Cleanup old records, keep only the most recent N records
     */
    private function cleanupOldRecords($userId, $keepCount = 50)
    {
        // Get IDs of records to delete (skip the most recent N records)
        $recordsToDelete = RecentlyViewed::where('user_id', $userId)
            ->orderBy('viewed_at', 'desc')
            ->skip($keepCount)
            ->take(1000) // Limit to prevent memory issues
            ->get()
            ->pluck('id');

        if ($recordsToDelete->isNotEmpty()) {
            RecentlyViewed::whereIn('id', $recordsToDelete)->delete();
        }
    }
}
