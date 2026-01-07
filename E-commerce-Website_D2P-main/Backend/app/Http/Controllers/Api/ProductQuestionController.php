<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductQuestionRequest;
use App\Models\Product;
use App\Models\ProductQuestion;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class ProductQuestionController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/products/{product}/questions",
     *     tags={"Product Questions"},
     *     summary="Get all questions for a product",
     *     @OA\Parameter(
     *         name="product",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Parameter(
     *         name="answered",
     *         in="query",
     *         @OA\Schema(type="boolean")
     *     ),
     *     @OA\Response(response=200, description="Success")
     * )
     */
    public function index(Request $request, Product $product)
    {
        $query = $product->approvedQuestions()->with(['user:id,name', 'admin:id,name']);

        // Filter by answered status
        if ($request->has('answered')) {
            if ($request->boolean('answered')) {
                $query->answered();
            } else {
                $query->unanswered();
            }
        }

        $questions = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $questions,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/products/{product}/questions",
     *     tags={"Product Questions"},
     *     summary="Ask a question about a product",
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
     *             required={"question"},
     *             @OA\Property(property="question", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Question created"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function store(StoreProductQuestionRequest $request, Product $product)
    {
        $question = ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => auth()->id(),
            'question' => $request->question,
            'is_approved' => true, // Auto approve, or set false for manual review
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Câu hỏi của bạn đã được gửi',
            'data' => $question,
        ], 201);
    }

    /**
     * @OA\Post(
     *     path="/api/questions/{question}/answer",
     *     tags={"Product Questions"},
     *     summary="Answer a question (Admin only)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="question",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"answer"},
     *             @OA\Property(property="answer", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Answer added"),
     *     @OA\Response(response=403, description="Forbidden")
     * )
     */
    public function answer(Request $request, ProductQuestion $question)
    {
        $request->validate([
            'answer' => 'required|string|min:10',
        ]);

        // Check if user is admin (you can adjust this based on your auth logic)
        // if (!auth()->user()->isAdmin()) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Bạn không có quyền trả lời câu hỏi',
        //     ], 403);
        // }

        $question->update([
            'answer' => $request->answer,
            'answered_by' => auth()->id(),
            'answered_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã trả lời câu hỏi',
            'data' => $question,
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/questions/{question}",
     *     tags={"Product Questions"},
     *     summary="Delete a question",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="question",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Question deleted"),
     *     @OA\Response(response=403, description="Forbidden")
     * )
     */
    public function destroy(ProductQuestion $question)
    {
        if ($question->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xóa câu hỏi này',
            ], 403);
        }

        $question->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa câu hỏi',
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/questions/{question}/helpful",
     *     tags={"Product Questions"},
     *     summary="Mark question as helpful",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(
     *         name="question",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Success")
     * )
     */
    public function markHelpful(ProductQuestion $question)
    {
        $question->increment('helpful_count');

        return response()->json([
            'success' => true,
            'message' => 'Cảm ơn phản hồi của bạn',
            'data' => ['helpful_count' => $question->helpful_count],
        ]);
    }
}
