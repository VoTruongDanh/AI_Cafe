<?php

namespace App\Http\Controllers\Api;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

class PaymentMethodController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    /**
     * @OA\Get(
     *     path="/payment-methods",
    *     tags={"Payment Methods"},
     *     summary="Danh sách phương thức thanh toán",
     *     @OA\Parameter(name="with_inactive", in="query", description="Bao gồm phương thức đã vô hiệu hóa", @OA\Schema(type="boolean")),
     *     @OA\Response(
     *         response=200,
     *         description="Danh sách phương thức",
     *         @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/PaymentMethod"))
     *     )
     * )
     */
    public function index(Request $request)
    {
        $methods = PaymentMethod::query()
            ->when(!$request->boolean('with_inactive'), fn ($q) => $q->where('is_active', true))
            // ✅ Sắp xếp theo created_at DESC (mới nhất lên đầu), sau đó theo name
            ->orderByDesc('created_at')
            ->orderBy('name')
            ->get();

        return response()->json($methods);
    }

    /**
     * @OA\Post(
     *     path="/payment-methods",
     *     tags={"Payment Methods"},
     *     summary="Tạo phương thức thanh toán",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/PaymentMethodStoreRequest")),
     *     @OA\Response(response=201, description="Tạo thành công", @OA\JsonContent(ref="#/components/schemas/PaymentMethod")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $this->validatePaymentMethod($request);

        $method = PaymentMethod::create($data);

        return response()->json($method, 201);
    }

    /**
     * @OA\Get(
     *     path="/payment-methods/{id}",
     *     tags={"Payment Methods"},
     *     summary="Chi tiết phương thức thanh toán",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết", @OA\JsonContent(ref="#/components/schemas/PaymentMethod")),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(PaymentMethod $paymentMethod)
    {
        return response()->json($paymentMethod);
    }

    /**
     * @OA\Put(
     *     path="/payment-methods/{id}",
     *     tags={"Payment Methods"},
     *     summary="Cập nhật phương thức thanh toán",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/PaymentMethodUpdateRequest")),
     *     @OA\Response(response=200, description="Cập nhật thành công", @OA\JsonContent(ref="#/components/schemas/PaymentMethod")),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $this->ensureAdmin($request);

        $data = $this->validatePaymentMethod($request, $paymentMethod->id);

        $paymentMethod->fill($data)->save();

        return response()->json($paymentMethod);
    }

    /**
     * @OA\Delete(
     *     path="/payment-methods/{id}",
     *     tags={"Payment Methods"},
     *     summary="Xóa phương thức thanh toán",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã xóa"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function destroy(Request $request, PaymentMethod $paymentMethod)
    {
        $this->ensureAdmin($request);

        $paymentMethod->delete();

        return response()->json(['message' => 'Đã xóa phương thức thanh toán.']);
    }

    protected function validatePaymentMethod(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:payment_methods,code,' . $id],
            'type' => ['required', 'in:online,offline'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'config' => ['nullable', 'array'],
        ]);
    }
}
