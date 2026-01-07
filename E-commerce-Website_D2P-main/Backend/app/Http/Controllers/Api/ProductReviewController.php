<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductReviewRequest;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class ProductReviewController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/products/{product}/reviews",
     *     tags={"Product Reviews"},
     *     summary="Get all reviews for a product",
     *     @OA\Parameter(
     *         name="product",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="rating",
     *         in="query",
     *         @OA\Schema(type="integer", minimum=1, maximum=5)
     *     ),
     *     @OA\Parameter(
     *         name="sort",
     *         in="query",
     *         @OA\Schema(type="string", enum={"recent", "helpful", "rating_high", "rating_low"})
     *     ),
     *     @OA\Response(response=200, description="Success")
     * )
     */
    public function index(Request $request, Product $product)
    {
        $query = $product->approvedReviews()->with('user:id,name');

        // Filter by rating
        if ($request->has('rating')) {
            $query->where('rating', $request->rating);
        }

        // Sorting
        switch ($request->sort) {
            case 'helpful':
                $query->orderBy('helpful_count', 'desc');
                break;
            case 'rating_high':
                $query->orderBy('rating', 'desc');
                break;
            case 'rating_low':
                $query->orderBy('rating', 'asc');
                break;
            default: // recent
                $query->latest();
        }

        $reviews = $query->paginate(10);

        // Get rating summary
        $summary = [
            'average_rating' => round($product->averageRating, 1),
            'total_reviews' => $product->totalReviews,
            'rating_breakdown' => $product->ratingBreakdown,
        ];

        return response()->json([
            'success' => true,
            'data' => $reviews,
            'summary' => $summary,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/products/{product}/reviews",
     *     tags={"Product Reviews"},
     *     summary="Create a new review",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="product",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"rating","comment"},
     *             @OA\Property(property="rating", type="integer", minimum=1, maximum=5),
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="comment", type="string"),
     *             @OA\Property(property="images", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=201, description="Review created"),
     *     @OA\Response(response=400, description="Already reviewed"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function store(StoreProductReviewRequest $request, Product $product)
    {
        // Check if user already reviewed this product
        $existingReview = ProductReview::where('product_id', $product->id)
            ->where('user_id', auth()->id())
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn đã đánh giá sản phẩm này rồi',
            ], 400);
        }

        // Check if user purchased this product
        /** @var \App\Models\User $user */
        $user = auth()->user();
        $hasPurchased = $user->orders()
            ->whereHas('items', function ($query) use ($product) {
                $query->where('product_id', $product->id);
            })
            ->where('status', 'delivered')
            ->exists();

        $review = ProductReview::create([
            'product_id' => $product->id,
            'user_id' => auth()->id(),
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
            'images' => $request->images,
            'is_verified_purchase' => $hasPurchased,
            'is_approved' => true, // Auto approve, or set false for manual review
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cảm ơn bạn đã đánh giá sản phẩm',
            'data' => $review,
        ], 201);
    }

    /**
     * @OA\Put(
     *     path="/api/reviews/{review}",
     *     tags={"Product Reviews"},
     *     summary="Update a review",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="review",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="rating", type="integer", minimum=1, maximum=5),
     *             @OA\Property(property="title", type="string"),
     *             @OA\Property(property="comment", type="string"),
     *             @OA\Property(property="images", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Review updated"),
     *     @OA\Response(response=403, description="Forbidden")
     * )
     */
    public function update(StoreProductReviewRequest $request, ProductReview $review)
    {
        if ($review->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa đánh giá này',
            ], 403);
        }

        $review->update($request->only(['rating', 'title', 'comment', 'images']));

        return response()->json([
            'success' => true,
            'message' => 'Đã cập nhật đánh giá',
            'data' => $review,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/reviews/{review}",
     *     tags={"Product Reviews"},
     *     summary="Delete a review",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="review",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Review deleted"),
     *     @OA\Response(response=403, description="Forbidden")
     * )
     */
    public function destroy(ProductReview $review)
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        if ($review->user_id !== auth()->id() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xóa đánh giá này',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa đánh giá',
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/reviews/{review}/helpful",
     *     tags={"Product Reviews"},
     *     summary="Mark review as helpful",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="review",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Success")
     * )
     */
    public function markHelpful(ProductReview $review)
    {
        $review->increment('helpful_count');

        return response()->json([
            'success' => true,
            'message' => 'Cảm ơn phản hồi của bạn',
            'data' => ['helpful_count' => $review->helpful_count],
        ]);
    }
}
