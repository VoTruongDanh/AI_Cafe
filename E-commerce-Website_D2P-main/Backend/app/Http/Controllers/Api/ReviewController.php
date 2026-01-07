<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Annotations as OA;

class ReviewController extends Controller
{
    /**
     * @OA\Get(
     *     path="/products/{productId}/reviews",
     *     tags={"Reviews"},
     *     summary="Lấy danh sách đánh giá sản phẩm",
     *     @OA\Parameter(name="productId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách đánh giá",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Review")),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     )
     * )
     */
    public function index(Request $request, $productId)
    {
        $perPage = $request->get('per_page', 10);
        
        $reviews = Review::where('product_id', $productId)
            ->where('status', 'approved')
            ->with(['user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($reviews);
    }

    /**
     * @OA\Post(
     *     path="/reviews",
     *     tags={"Reviews"},
     *     summary="Tạo đánh giá mới",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"product_id","rating"},
     *             @OA\Property(property="product_id", type="integer"),
     *             @OA\Property(property="order_id", type="integer", nullable=true),
     *             @OA\Property(property="rating", type="integer", minimum=1, maximum=5),
     *             @OA\Property(property="comment", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Tạo đánh giá thành công"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id' => 'nullable|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = Auth::user();

        // Kiểm tra xem user đã review sản phẩm này chưa
        $existingReview = Review::where('product_id', $data['product_id'])
            ->where('user_id', $user->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Bạn đã đánh giá sản phẩm này rồi.'
            ], 422);
        }

        // Kiểm tra xem user có mua sản phẩm này không (nếu có order_id)
        if (isset($data['order_id'])) {
            $order = Order::where('id', $data['order_id'])
                ->where('user_id', $user->id)
                ->where('payment_status', 'paid')
                ->first();

            if (!$order) {
                return response()->json([
                    'message' => 'Bạn chỉ có thể đánh giá sản phẩm đã mua.'
                ], 422);
            }
        }

        $review = Review::create([
            'product_id' => $data['product_id'],
            'user_id' => $user->id,
            'order_id' => $data['order_id'] ?? null,
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
            'status' => 'approved', // Tự động approve, có thể thay đổi thành 'pending' nếu cần
        ]);

        return response()->json($review->load('user'), 201);
    }

    /**
     * @OA\Put(
     *     path="/reviews/{reviewId}",
     *     tags={"Reviews"},
     *     summary="Cập nhật đánh giá",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="reviewId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="rating", type="integer", minimum=1, maximum=5),
     *             @OA\Property(property="comment", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cập nhật thành công"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function update(Request $request, $reviewId)
    {
        $review = Review::findOrFail($reviewId);

        // Chỉ cho phép user sở hữu review mới được update
        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Bạn không có quyền cập nhật đánh giá này.'
            ], 403);
        }

        $data = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($data);

        return response()->json($review->load('user'));
    }

    /**
     * @OA\Delete(
     *     path="/reviews/{reviewId}",
     *     tags={"Reviews"},
     *     summary="Xóa đánh giá",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="reviewId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Xóa thành công"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy($reviewId)
    {
        $review = Review::findOrFail($reviewId);

        // Chỉ cho phép user sở hữu review hoặc admin mới được xóa
        if ($review->user_id !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json([
                'message' => 'Bạn không có quyền xóa đánh giá này.'
            ], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Đánh giá đã được xóa.']);
    }
}

