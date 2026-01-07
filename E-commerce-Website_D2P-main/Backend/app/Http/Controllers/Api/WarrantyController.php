<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\Warranty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Annotations as OA;

class WarrantyController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/warranties",
     *     tags={"Warranties"},
     *     summary="Danh sách phiếu bảo hành",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="order_id", in="query", description="Lọc theo đơn hàng", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="user_id", in="query", description="Lọc theo khách hàng", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="status", in="query", description="Lọc theo trạng thái", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Danh sách phiếu bảo hành"),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function index(Request $request)
    {
        $query = Warranty::with(['order', 'user', 'processor', 'supplier', 'product']);

        if ($request->user()->role === 'customer') {
            $query->where('user_id', $request->user()->id);
        } else {
            if ($request->filled('order_id')) {
                $query->where('order_id', $request->input('order_id'));
            }
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
        }

        $warranties = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

        return response()->json($warranties);
    }

    /**
     * @OA\Post(
     *     path="/warranties",
     *     tags={"Warranties"},
     *     summary="Tạo phiếu bảo hành",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"order_id"},
     *             @OA\Property(property="order_id", type="integer", example=1),
     *             @OA\Property(property="supplier_id", type="integer", nullable=true),
     *             @OA\Property(property="notes", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Phiếu bảo hành đã được tạo"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy đơn hàng")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $order = Order::with('items.product')->findOrFail($data['order_id']);

        return DB::transaction(function () use ($order, $request, $data) {
            $warranty = Warranty::create([
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'processed_by' => $request->user()->id,
                'supplier_id' => $data['supplier_id'] ?? null,
                'code' => Warranty::generateCode(),
                'status' => 'pending', // Mặc định: Mới tiếp nhận
                'issued_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            // Tạo bảo hành cho sản phẩm đầu tiên (hoặc tất cả nếu cần)
            $firstItem = $order->items->first();
            if ($firstItem) {
                $warrantyMonths = $firstItem->product->warranty_months ?? 12;
                $startDate = now();
                
                $warranty->update([
                    'order_item_id' => $firstItem->id,
                    'product_id' => $firstItem->product_id,
                    'start_date' => $startDate,
                    'warranty_months' => $warrantyMonths,
                    'end_date' => $startDate->copy()->addMonths($warrantyMonths),
                    'expires_at' => $startDate->copy()->addMonths($warrantyMonths),
                ]);
            }

            return response()->json($warranty->load(['order', 'user', 'processor', 'supplier', 'product']), 201);
        });
    }

    /**
     * @OA\Get(
     *     path="/warranties/{id}",
     *     tags={"Warranties"},
     *     summary="Chi tiết phiếu bảo hành",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết phiếu bảo hành"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Request $request, Warranty $warranty)
    {
        if ($request->user()->role === 'customer' && $warranty->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bạn không có quyền truy cập phiếu bảo hành này.'], 403);
        }

        return response()->json($warranty->load(['order', 'user', 'processor', 'supplier', 'product', 'orderItem']));
    }

    /**
     * @OA\Put(
     *     path="/warranties/{id}",
     *     tags={"Warranties"},
     *     summary="Cập nhật phiếu bảo hành",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="active"),
     *             @OA\Property(property="supplier_id", type="integer", nullable=true),
     *             @OA\Property(property="notes", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Phiếu bảo hành đã được cập nhật"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function update(Request $request, Warranty $warranty)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,processing,repaired,waiting_for_customer,completed,denied,returned,cancelled'],
            'result_notes' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
        ]);

        $warranty->fill($data);
        $warranty->save();

        return response()->json($warranty->refresh()->load(['order', 'user', 'processor', 'supplier', 'product']));
    }

    /**
     * @OA\Put(
     *     path="/warranties/{warrantyId}/items/{itemId}",
     *     tags={"Warranties"},
     *     summary="Cập nhật chi tiết bảo hành",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="warrantyId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="itemId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string", example="used"),
     *             @OA\Property(property="result", type="string", example="repaired"),
     *             @OA\Property(property="notes", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Chi tiết bảo hành đã được cập nhật"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function updateItem(Request $request, Warranty $warranty, $itemId)
    {
        $this->ensureAdmin($request);

        // Cập nhật trực tiếp warranty (không còn warranty_items)
        $data = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,processing,repaired,waiting_for_customer,completed,denied,returned,cancelled'],
            'result_notes' => ['nullable', 'string'],
        ]);

        $warranty->fill($data);
        $warranty->save();

        return response()->json($warranty->load(['order', 'product', 'orderItem']));
    }

    /**
     * @OA\Get(
     *     path="/orders/{orderId}/warranties",
     *     tags={"Warranties"},
     *     summary="Lấy danh sách bảo hành của đơn hàng",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="orderId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Danh sách bảo hành"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy đơn hàng")
     * )
     */
    public function getByOrder(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);

        if ($request->user()->role === 'customer' && $order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bạn không có quyền truy cập đơn hàng này.'], 403);
        }

        $warranties = Warranty::where('order_id', $orderId)
            ->with(['user', 'processor', 'supplier', 'product'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($warranties);
    }

    /**
     * @OA\Delete(
     *     path="/api/admin/warranties/{id}",
     *     tags={"Warranties"},
     *     summary="Xóa phiếu bảo hành",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Xóa thành công"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy(Request $request, Warranty $warranty)
    {
        $this->ensureAdmin($request);

        $warranty->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa phiếu bảo hành thành công!'
        ]);
    }
}

