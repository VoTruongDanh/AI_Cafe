<?php

namespace App\Http\Controllers\Api;

use App\Models\Supplier;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class SupplierController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/suppliers",
     *     tags={"Suppliers"},
     *     summary="Danh sách nhà cung cấp",
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="with_inactive", in="query", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer", default=15)),
     *     @OA\Response(response=200, description="Danh sách nhà cung cấp", @OA\JsonContent(
     *         @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/Supplier")),
     *         @OA\Property(property="meta", type="object"),
     *         @OA\Property(property="links", type="object")
     *     ))
     * )
     */
    public function index(Request $request)
    {
        $suppliers = Supplier::query()
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = $request->input('search');
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                        ->orWhere('contact_person', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
            })
            ->when(!$request->boolean('with_inactive'), fn ($q) => $q->where('is_active', true))
            // ✅ Sắp xếp theo created_at DESC (mới nhất lên đầu), sau đó theo name
            ->orderByDesc('created_at')
            ->orderBy('name')
            ->paginate($request->input('per_page', 15));

        return response()->json($suppliers);
    }

    /**
     * @OA\Post(
     *     path="/suppliers",
     *     tags={"Suppliers"},
     *     summary="Tạo nhà cung cấp",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/SupplierStoreRequest")),
     *     @OA\Response(response=201, description="Tạo thành công", @OA\JsonContent(ref="#/components/schemas/Supplier")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $this->validateSupplier($request);

        $supplier = Supplier::create($data);

        return response()->json($supplier, 201);
    }

    /**
     * @OA\Get(
     *     path="/suppliers/{id}",
     *     tags={"Suppliers"},
     *     summary="Chi tiết nhà cung cấp",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Nhà cung cấp", @OA\JsonContent(ref="#/components/schemas/Supplier")),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Supplier $supplier)
    {
        $supplier->load('products');

        return response()->json($supplier);
    }

    /**
     * @OA\Put(
     *     path="/suppliers/{id}",
     *     tags={"Suppliers"},
     *     summary="Cập nhật nhà cung cấp",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/SupplierUpdateRequest")),
     *     @OA\Response(response=200, description="Nhà cung cấp cập nhật", @OA\JsonContent(ref="#/components/schemas/Supplier")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function update(Request $request, Supplier $supplier)
    {
        $this->ensureAdmin($request);

        $data = $this->validateSupplier($request, $supplier->id);

        $supplier->fill($data)->save();

        return response()->json($supplier);
    }

    /**
     * @OA\Delete(
     *     path="/suppliers/{id}",
     *     tags={"Suppliers"},
     *     summary="Xóa nhà cung cấp",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã xóa nhà cung cấp"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=422, description="Không thể xóa do còn sản phẩm")
     * )
     */
    public function destroy(Request $request, Supplier $supplier)
    {
        $this->ensureAdmin($request);

        if ($supplier->products()->exists()) {
            return response()->json([
                'message' => 'Không thể xóa nhà cung cấp đang liên kết với sản phẩm.',
            ], 422);
        }

        $supplier->delete();

        return response()->json(['message' => 'Đã xóa nhà cung cấp.']);
    }

    protected function validateSupplier(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:suppliers,email,' . $id],
            'phone' => ['nullable', 'string', 'max:50'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'tax_code' => ['nullable', 'string', 'max:100'],
            'bank_account' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
