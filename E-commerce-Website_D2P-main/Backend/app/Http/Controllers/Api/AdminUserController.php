<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Annotations as OA;

class AdminUserController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;



    /**
     * @OA\Get(
     *     path="/admin/users",
     *     tags={"Admin"},
     *     summary="Danh sách người dùng (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Danh sách người dùng"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền")
     * )
     */
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $perPage = $request->input('per_page', 15);
        $users = User::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->input('role')))
            ->orderByDesc('created_at') // ✅ Người dùng mới nhất lên trên
            ->paginate($perPage);

        return response()->json($users);
    }

    /**
     * @OA\Get(
     *     path="/admin/users/{id}",
     *     tags={"Admin"},
     *     summary="Chi tiết người dùng (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Chi tiết người dùng"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function show(Request $request, User $user)
    {
        $this->ensureAdmin($request);
        return response()->json($user);
    }

    /**
     * @OA\Post(
     *     path="/admin/users",
     *     tags={"Admin"},
     *     summary="Tạo người dùng mới (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/User")),
     *     @OA\Response(response=201, description="Tạo thành công"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:customer,admin,staff'],
            'phone' => ['nullable', 'string'],
            'address_line' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ], [
            'email.unique' => 'Email đã tồn tại trong hệ thống.',
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        // ✅ Broadcast event
        event(new \App\Events\UserCreated($user));

        return response()->json($user, 201);
    }

    /**
     * @OA\Put(
     *     path="/admin/users/{id}",
     *     tags={"Admin"},
     *     summary="Cập nhật người dùng (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/User")),
     *     @OA\Response(response=200, description="Cập nhật thành công"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function update(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'password' => ['sometimes', 'string', 'min:8'],
            'role' => ['sometimes', 'in:customer,admin,staff'],
            'phone' => ['nullable', 'string'],
            'address_line' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        // ✅ Broadcast event
        event(new \App\Events\UserUpdated($user));

        return response()->json($user);
    }

    /**
     * @OA\Delete(
     *     path="/admin/users/{id}",
     *     tags={"Admin"},
     *     summary="Xóa người dùng (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Xóa thành công"),
     *     @OA\Response(response=400, description="Không thể xóa người dùng"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function destroy(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        // Không cho phép xóa chính mình
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Không thể xóa tài khoản của chính bạn.'
            ], 400);
        }

        // Kiểm tra các ràng buộc trước khi xóa
        $canDelete = $this->canDeleteUser($user);
        
        if (!$canDelete['can_delete']) {
            return response()->json([
                'message' => $canDelete['message'],
                'reasons' => $canDelete['reasons'],
                'suggestion' => 'Khuyến nghị: Vô hiệu hóa tài khoản (is_active = false) thay vì xóa. Điều này sẽ ngăn người dùng đăng nhập nhưng vẫn giữ lại dữ liệu lịch sử.'
            ], 400);
        }

        // Xóa người dùng (soft delete)
        $user->delete();

        return response()->json(['message' => 'Đã xóa người dùng thành công.']);
    }

    /**
     * Kiểm tra xem người dùng có thể xóa được không
     * 
     * Điều kiện để xóa được:
     * 1. Không có đơn hàng nào (hoặc chỉ có đơn đã hủy/hoàn trả)
     * 2. Không có đánh giá sản phẩm
     * 3. Không có yêu cầu bảo hành đang xử lý
     * 4. Không có yêu cầu trả hàng đang xử lý
     */
    protected function canDeleteUser(User $user): array
    {
        $reasons = [];
        
        // 1. Kiểm tra đơn hàng
        $ordersCount = \DB::table('orders')
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['cancelled', 'returned'])
            ->whereNull('deleted_at')
            ->count();
        
        if ($ordersCount > 0) {
            $reasons[] = "Người dùng có {$ordersCount} đơn hàng chưa hoàn thành";
        }

        // 2. Kiểm tra tổng số đơn hàng (kể cả đã hoàn thành)
        $totalOrdersCount = \DB::table('orders')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->count();
        
        if ($totalOrdersCount > 0) {
            $reasons[] = "Người dùng có lịch sử {$totalOrdersCount} đơn hàng (bao gồm đã hoàn thành)";
        }

        // 3. Kiểm tra đánh giá sản phẩm
        if (\Schema::hasTable('product_reviews')) {
            $reviewsCount = \DB::table('product_reviews')
                ->where('user_id', $user->id)
                ->count();
            
            if ($reviewsCount > 0) {
                $reasons[] = "Người dùng có {$reviewsCount} đánh giá sản phẩm";
            }
        }

        // 4. Kiểm tra bảo hành
        if (\Schema::hasTable('warranties')) {
            $activeWarrantiesCount = \DB::table('warranties')
                ->where('user_id', $user->id)
                ->whereIn('status', ['active', 'pending'])
                ->count();
            
            if ($activeWarrantiesCount > 0) {
                $reasons[] = "Người dùng có {$activeWarrantiesCount} yêu cầu bảo hành đang xử lý";
            }
        }

        // 5. Kiểm tra yêu cầu trả hàng
        if (\Schema::hasTable('return_requests')) {
            $activeReturnRequestsCount = \DB::table('return_requests')
                ->where('user_id', $user->id)
                ->whereIn('status', ['pending', 'approved', 'processing'])
                ->count();
            
            if ($activeReturnRequestsCount > 0) {
                $reasons[] = "Người dùng có {$activeReturnRequestsCount} yêu cầu trả hàng đang xử lý";
            }
        }

        // 6. Kiểm tra giỏ hàng
        $cartItemsCount = \DB::table('carts')
            ->join('cart_items', 'carts.id', '=', 'cart_items.cart_id')
            ->where('carts.user_id', $user->id)
            ->where('carts.status', 'active')
            ->count();
        
        if ($cartItemsCount > 0) {
            $reasons[] = "Người dùng có {$cartItemsCount} sản phẩm trong giỏ hàng";
        }

        $canDelete = empty($reasons);
        
        return [
            'can_delete' => $canDelete,
            'message' => $canDelete 
                ? 'Có thể xóa người dùng' 
                : 'Không thể xóa người dùng vì các lý do sau:',
            'reasons' => $reasons
        ];
    }

    /**
     * Kiểm tra xem người dùng có thể xóa được không (API endpoint)
     * 
     * @OA\Get(
     *     path="/admin/users/{id}/can-delete",
     *     tags={"Admin"},
     *     summary="Kiểm tra xem người dùng có thể xóa được không",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Thông tin kiểm tra"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function canDelete(Request $request, User $user)
    {
        $this->ensureAdmin($request);
        
        // Không cho phép xóa chính mình
        if ($user->id === $request->user()->id) {
            return response()->json([
                'can_delete' => false,
                'message' => 'Không thể xóa tài khoản của chính bạn.',
                'reasons' => ['Đây là tài khoản đang đăng nhập']
            ]);
        }
        
        $result = $this->canDeleteUser($user);
        
        return response()->json($result);
    }

    /**
     * Vô hiệu hóa tài khoản người dùng
     * 
     * @OA\Post(
     *     path="/admin/users/{id}/deactivate",
     *     tags={"Admin"},
     *     summary="Vô hiệu hóa tài khoản người dùng",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã vô hiệu hóa tài khoản"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function deactivate(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        // Không cho phép vô hiệu hóa chính mình
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Không thể vô hiệu hóa tài khoản của chính bạn.'
            ], 400);
        }

        $user->is_active = false;
        $user->save();

        return response()->json([
            'message' => 'Đã vô hiệu hóa tài khoản. Người dùng sẽ không thể đăng nhập nhưng dữ liệu lịch sử vẫn được giữ.',
            'user' => $user
        ]);
    }

    /**
     * Kích hoạt lại tài khoản người dùng
     * 
     * @OA\Post(
     *     path="/admin/users/{id}/activate",
     *     tags={"Admin"},
     *     summary="Kích hoạt lại tài khoản người dùng",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Đã kích hoạt tài khoản"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy")
     * )
     */
    public function activate(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $user->is_active = true;
        $user->save();

        return response()->json([
            'message' => 'Đã kích hoạt lại tài khoản. Người dùng có thể đăng nhập trở lại.',
            'user' => $user
        ]);
    }

    /**
     * @OA\Put(
     *     path="/admin/users/{id}/reset-password",
     *     tags={"Admin"},
     *     summary="Reset mật khẩu người dùng (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="password", type="string", description="Mật khẩu mới")
     *     )),
     *     @OA\Response(response=200, description="Reset mật khẩu thành công"),
     *     @OA\Response(response=404, description="Không tìm thấy người dùng"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function resetPassword(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user->update([
            'password' => Hash::make($data['password'])
        ]);

        return response()->json([
            'message' => 'Reset mật khẩu thành công.',
            'user' => $user
        ]);
    }
}
