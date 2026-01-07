<?php

namespace App\Http\Controllers\Api;

use App\Models\InventoryImport;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use OpenApi\Annotations as OA;

class InventoryImportController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/inventory-imports",
     *     tags={"Inventory Imports"},
     *     summary="Danh sách phiếu nhập kho",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="supplier_id", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách phiếu",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/InventoryImport")),
     *             @OA\Property(property="links", type="object"),
     *             @OA\Property(property="meta", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền")
     * )
     */
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $imports = InventoryImport::query()
            ->with(['supplier', 'items.product'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('supplier_id'), fn ($q) => $q->where('supplier_id', $request->input('supplier_id')))
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json($imports);
    }

    /**
     * @OA\Post(
     *     path="/inventory-imports",
     *     tags={"Inventory Imports"},
     *     summary="Tạo phiếu nhập kho",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/InventoryImportStoreRequest")),
     *     @OA\Response(response=201, description="Tạo thành công", @OA\JsonContent(ref="#/components/schemas/InventoryImport")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $this->validateImport($request);

        // ✅ BUG FIX: Validate số lượng và giá không âm
        foreach ($data['items'] as $item) {
            if ($item['quantity'] <= 0) {
                return response()->json([
                    'message' => 'Số lượng nhập phải lớn hơn 0.'
                ], 422);
            }
            if ($item['unit_cost'] < 0) {
                return response()->json([
                    'message' => 'Giá nhập không được âm.'
                ], 422);
            }
        }

        return DB::transaction(function () use ($request, $data) {
            $import = InventoryImport::create(array_merge($data, [
                'code' => 'IMP-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6)),
                'created_by' => $request->user()->id,
                'status' => 'draft',
            ]));

            $this->syncItems($import, $request->input('items', []));

            $this->recalculateTotals($import);
            $import->save(); // Lưu lại sau khi tính toán

            // ✅ Broadcast event
            event(new \App\Events\InventoryImportCreated($import));

            return response()->json($import->load('items.product'), 201);
        });
    }

    /**
     * @OA\Get(
     *     path="/inventory-imports/{id}",
     *     tags={"Inventory Imports"},
     *     summary="Chi tiết phiếu nhập kho",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết", @OA\JsonContent(ref="#/components/schemas/InventoryImport")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Request $request, InventoryImport $inventoryImport)
    {
        $this->ensureAdmin($request);

        return response()->json($inventoryImport->load('supplier', 'items.product', 'creator', 'approver'));
    }

    /**
     * @OA\Put(
     *     path="/inventory-imports/{id}",
     *     tags={"Inventory Imports"},
     *     summary="Cập nhật phiếu nhập kho",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/InventoryImportUpdateRequest")),
     *     @OA\Response(response=200, description="Cập nhật thành công", @OA\JsonContent(ref="#/components/schemas/InventoryImport")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function update(Request $request, InventoryImport $inventoryImport)
    {
        $this->ensureAdmin($request);

        // ❌ KHÔNG CHO SỬA khi đã hoàn thành
        if ($inventoryImport->status === 'completed') {
            return response()->json([
                'message' => 'Không thể sửa phiếu nhập đã hoàn thành. Phiếu đã cập nhật số lượng tồn kho.'
            ], 422);
        }

        $data = $this->validateImport($request, $inventoryImport->id);

        return DB::transaction(function () use ($request, $inventoryImport, $data) {
            $previousStatus = $inventoryImport->status;

            $inventoryImport->fill($data);

            if ($request->filled('status')) {
                $inventoryImport->status = $request->input('status');
            }

            if ($request->input('status') === 'approved') {
                $inventoryImport->approved_by = $request->user()->id;
            }

            if ($request->has('items')) {
                $this->syncItems($inventoryImport, $request->input('items', []));
            }

            $this->recalculateTotals($inventoryImport);

            // Chỉ cộng quantity khi chuyển sang completed
            if ($previousStatus !== 'completed' && $inventoryImport->status === 'completed') {
                foreach ($inventoryImport->items as $item) {
                    $item->product->increment('quantity', $item->quantity);

                    // Tự động chuyển trạng thái sản phẩm sang "published" nếu số lượng > 0 và đang ở trạng thái "draft"
                    if ($item->product->quantity > 0 && $item->product->status === 'draft') {
                        $item->product->update(['status' => 'published']);
                    }
                }
                $inventoryImport->completed_at = now();
            }

            $inventoryImport->save();

            return response()->json($inventoryImport->load('items.product'));
        });
    }

    /**
     * @OA\Delete(
     *     path="/inventory-imports/{id}",
     *     tags={"Inventory Imports"},
     *     summary="Xóa phiếu nhập kho",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã xóa"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Không thể xóa")
     * )
     */
    public function destroy(Request $request, InventoryImport $inventoryImport)
    {
        $this->ensureAdmin($request);

        // ❌ KHÔNG CHO XÓA khi đã hoàn thành
        if ($inventoryImport->status === 'completed') {
            return response()->json([
                'message' => 'Không thể xóa phiếu nhập đã hoàn thành. Phiếu đã cập nhật số lượng tồn kho.'
            ], 422);
        }

        // Chỉ cho xóa draft và approved
        if (!in_array($inventoryImport->status, ['draft', 'approved'])) {
            return response()->json([
                'message' => 'Chỉ có thể xóa phiếu nhập ở trạng thái nháp hoặc đã duyệt.'
            ], 422);
        }

        $inventoryImport->delete();

        return response()->json(['message' => 'Đã xóa phiếu nhập kho.']);
    }

    /**
     * @OA\Put(
     *     path="/inventory-imports/{id}/status",
     *     tags={"Inventory Imports"},
     *     summary="Cập nhật trạng thái phiếu nhập kho",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="status", type="string", enum={"draft", "approved", "completed", "cancelled"})
     *     )),
     *     @OA\Response(response=200, description="Cập nhật thành công"),
     *     @OA\Response(response=422, description="Không thể cập nhật")
     * )
     */
    public function updateStatus(Request $request, InventoryImport $inventoryImport)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'status' => ['required', 'in:draft,approved,completed,cancelled'],
        ]);

        $newStatus = $data['status'];
        $previousStatus = $inventoryImport->status;

        // Không cho thay đổi nếu đã hoàn thành
        if ($previousStatus === 'completed') {
            return response()->json([
                'message' => 'Không thể thay đổi trạng thái phiếu nhập đã hoàn thành.'
            ], 422);
        }

        // Không cho chuyển từ cancelled sang trạng thái khác
        if ($previousStatus === 'cancelled' && $newStatus !== 'cancelled') {
            return response()->json([
                'message' => 'Không thể khôi phục phiếu nhập đã hủy.'
            ], 422);
        }

        // ✅ BUG FIX: Sử dụng transaction với lock để tránh concurrent stock update
        return DB::transaction(function () use ($request, $inventoryImport, $newStatus, $previousStatus) {
            $inventoryImport->status = $newStatus;

            // Ghi nhận người duyệt
            if ($newStatus === 'approved') {
                $inventoryImport->approved_by = $request->user()->id;
            }

            // ✅ BUG FIX: Khi chuyển sang completed: lock products và cộng số lượng
            if ($previousStatus !== 'completed' && $newStatus === 'completed') {
                // Lock tất cả products trong phiếu nhập
                $productIds = $inventoryImport->items->pluck('product_id')->toArray();
                $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

                foreach ($inventoryImport->items as $item) {
                    $product = $products->get($item->product_id);
                    if (!$product) {
                        throw new \Exception("Sản phẩm ID {$item->product_id} không tồn tại.");
                    }

                    // ✅ BUG FIX: Validate số lượng không âm trước khi cộng
                    if ($item->quantity <= 0) {
                        throw new \Exception("Số lượng nhập phải lớn hơn 0.");
                    }

                    // Cộng số lượng vào tồn kho
                    $product->increment('quantity', $item->quantity);

                    // Tự động publish sản phẩm nếu đang draft và có hàng
                    if ($product->quantity > 0 && $product->status === 'draft') {
                        $product->update(['status' => 'published']);
                    }
                }
                $inventoryImport->completed_at = now();
            }

            $inventoryImport->save();

            // ✅ Broadcast event
            event(new \App\Events\InventoryImportStatusUpdated($inventoryImport, $previousStatus, $newStatus));

            return response()->json([
                'message' => $this->getStatusMessage($newStatus),
                'import' => $inventoryImport->load('items.product', 'supplier', 'creator', 'approver')
            ]);
        });
    }

    protected function getStatusMessage(string $status): string
    {
        return match ($status) {
            'approved' => 'Đã duyệt phiếu nhập kho thành công.',
            'completed' => 'Đã hoàn thành phiếu nhập kho. Số lượng tồn kho đã được cập nhật.',
            'cancelled' => 'Đã hủy phiếu nhập kho.',
            default => 'Cập nhật trạng thái thành công.',
        };
    }

    protected function validateImport(Request $request, ?int $id = null): array
    {
        $rules = [
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'expected_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,approved,completed,cancelled'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'tax_total' => ['nullable', 'numeric', 'min:0'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'grand_total' => ['nullable', 'numeric', 'min:0'],
            'shipping_fee' => ['nullable', 'numeric', 'min:0'],
            'items' => [Rule::requiredIf(!$id), 'array', 'min:1'],
            'items.*.product_id' => ['required_with:items', 'exists:products,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:1000000'], // ✅ BUG FIX: Thêm max để tránh overflow
            'items.*.unit_cost' => ['required_with:items', 'numeric', 'min:0'], // ✅ BUG FIX: Không cho giá âm
            'items.*.line_total' => ['nullable', 'numeric', 'min:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:100'],
            'items.*.manufactured_at' => ['nullable', 'date'],
            'items.*.expires_at' => ['nullable', 'date', 'after:manufactured_at'], // ✅ BUG FIX: Ngày hết hạn phải sau ngày sản xuất
        ];

        return $request->validate($rules);
    }

    protected function syncItems(InventoryImport $import, array $items): void
    {
        $import->items()->delete();

        foreach ($items as $item) {
            // Ưu tiên line_total từ client, nếu không có thì tự tính
            $lineTotal = $item['line_total'] ?? ($item['unit_cost'] * $item['quantity']);

            $import->items()->create([
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'line_total' => $lineTotal,
                'batch_number' => $item['batch_number'] ?? null,
                'manufactured_at' => $item['manufactured_at'] ?? null,
                'expires_at' => $item['expires_at'] ?? null,
            ]);
        }

        $import->load('items');
    }

    protected function recalculateTotals(InventoryImport $import): void
    {
        $subtotal = $import->items->sum('line_total');
        $import->subtotal = $subtotal;

        // Nếu client không gửi, tự động tính grand_total
        if ($import->grand_total === null) {
            $taxTotal = $import->tax_total ?? 0;
            $discountTotal = $import->discount_total ?? 0;
            $shippingFee = $import->shipping_fee ?? 0;
            $import->grand_total = $subtotal + $taxTotal - $discountTotal + $shippingFee;
        }
    }
}
