<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class ReturnRequestController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/return-requests",
     *     tags={"Return Requests"},
     *     summary="Danh sách yêu cầu trả hàng",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="status", in="query", description="Lọc theo trạng thái", @OA\Schema(type="string")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/ReturnRequest")),
     *             @OA\Property(property="links", type="object"),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function index(Request $request)
    {
        $query = ReturnRequest::query()->with(['order', 'orderItem', 'requester']);

        if ($request->user()->role === 'customer') {
            $query->where('user_id', $request->user()->id);
        } else {
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
        }

        $returns = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($returns);
    }

    /**
     * @OA\Post(
     *     path="/return-requests",
     *     tags={"Return Requests"},
     *     summary="Tạo yêu cầu trả hàng",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/ReturnRequestStoreRequest")),
     *     @OA\Response(response=201, description="Tạo thành công", @OA\JsonContent(ref="#/components/schemas/ReturnRequest")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy đơn hàng"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'order_item_id' => ['nullable', 'exists:order_items,id'],
            'reason' => ['required', 'string'],
            'requested_quantity' => ['required', 'integer', 'min:1'],
        ]);

        $order = Order::where('id', $data['order_id'])->where('user_id', $request->user()->id)->first();

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng.'], 404);
        }

        if (isset($data['order_item_id'])) {
            $orderItem = OrderItem::where('id', $data['order_item_id'])->where('order_id', $order->id)->first();
            if (!$orderItem) {
                return response()->json(['message' => 'Sản phẩm không thuộc đơn hàng.'], 422);
            }
            if ($data['requested_quantity'] > $orderItem->quantity) {
                return response()->json(['message' => 'Số lượng yêu cầu vượt quá số lượng đã mua.'], 422);
            }
        }

        $returnRequest = ReturnRequest::create([
            'order_id' => $order->id,
            'order_item_id' => $data['order_item_id'] ?? null,
            'user_id' => $request->user()->id,
            'reason' => $data['reason'],
            'requested_quantity' => $data['requested_quantity'],
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        return response()->json($returnRequest->load('order', 'orderItem'), 201);
    }

    /**
     * @OA\Put(
     *     path="/return-requests/{id}",
     *     tags={"Return Requests"},
     *     summary="Cập nhật yêu cầu trả hàng",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/ReturnRequestUpdateRequest")),
     *     @OA\Response(response=200, description="Cập nhật thành công", @OA\JsonContent(ref="#/components/schemas/ReturnRequest")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function update(Request $request, ReturnRequest $returnRequest)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected,completed'],
            'approved_quantity' => ['nullable', 'integer', 'min:0'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'resolution' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $returnRequest->fill($data);
        $returnRequest->processed_by = $request->user()->id;

        if (in_array($data['status'], ['approved', 'completed'], true)) {
            $returnRequest->resolved_at = now();
        }

        $returnRequest->save();

        return response()->json($returnRequest->refresh()->load('order', 'orderItem'));
    }
}
