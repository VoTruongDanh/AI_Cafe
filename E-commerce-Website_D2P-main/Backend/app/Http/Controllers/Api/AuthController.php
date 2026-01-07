<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use OpenApi\Annotations as OA;

class AuthController extends Controller
{
    /**
     * @OA\Post(
     *     path="/auth/register",
     *     tags={"Auth"},
     *     summary="Đăng ký tài khoản mới",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password"},
     *             @OA\Property(property="name", type="string", example="Nguyen Van A"),
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="secret123"),
     *             @OA\Property(property="phone", type="string", nullable=true, example="0987654321"),
     *             @OA\Property(property="address_line", type="string", nullable=true, example="123 Đường ABC"),
     *             @OA\Property(property="city", type="string", nullable=true, example="Hà Nội"),
     *             @OA\Property(property="district", type="string", nullable=true, example="Ba Đình")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Đăng ký thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="user", ref="#/components/schemas/User"),
     *             @OA\Property(property="token", type="string")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'ward' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'customer',
            'phone' => $data['phone'] ?? null,
            'address_line' => $data['address_line'] ?? null,
            'city' => $data['city'] ?? null,
            'ward' => $data['ward'] ?? null,
            'is_active' => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        Cart::firstOrCreate(['user_id' => $user->id, 'status' => 'active']);

        // Send welcome email
        try {
            \Mail::to($user->email)->send(new \App\Mail\WelcomeEmail($user));
        } catch (\Exception $e) {
            \Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * @OA\Post(
     *     path="/auth/login",
     *     tags={"Auth"},
     *     summary="Đăng nhập",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="secret123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Đăng nhập thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="user", ref="#/components/schemas/User"),
     *             @OA\Property(property="token", type="string")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Sai thông tin đăng nhập"),
     *     @OA\Response(response=403, description="Tài khoản bị khóa")
     * )
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Thông tin đăng nhập không chính xác.'], 422);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Tài khoản đã bị vô hiệu hóa.'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $token = $user->createToken('auth_token_' . Str::random(8))->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * @OA\Get(
     *     path="/auth/me",
     *     tags={"Auth"},
     *     summary="Thông tin người dùng hiện tại",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Thông tin người dùng",
     *         @OA\JsonContent(ref="#/components/schemas/User")
     *     ),
     *     @OA\Response(response=401, description="Chưa xác thực")
     * )
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['carts.items.product', 'orders.items']);

        return response()->json($user);
    }

    /**
     * @OA\Put(
     *     path="/auth/profile",
     *     tags={"Auth"},
     *     summary="Cập nhật hồ sơ",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", example="Nguyen Van B"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone", type="string", nullable=true),
     *             @OA\Property(property="address_line", type="string", nullable=true),
     *             @OA\Property(property="city", type="string", nullable=true),
     *             @OA\Property(property="district", type="string", nullable=true),
     *             @OA\Property(property="password", type="string", format="password", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cập nhật thành công"),
     *     @OA\Response(response=401, description="Chưa xác thực"),
     *     @OA\Response(response=422, description="Dữ liệu không hợp lệ")
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->fill($data);
        $user->save();

        return response()->json($user->fresh());
    }

    /**
     * @OA\Post(
     *     path="/auth/logout",
     *     tags={"Auth"},
     *     summary="Đăng xuất",
    *     security={{"sanctum":{}}},
    *     @OA\Response(response=200, description="Đăng xuất thành công"),
    *     @OA\Response(response=401, description="Chưa xác thực")
    * )
    */
    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        } else {
            $request->user()->tokens()->delete();
        }

        return response()->json(['message' => 'Đăng xuất thành công.']);
    }

    /**
     * @OA\Post(
     *     path="/auth/forgot-password",
     *     tags={"Auth"},
     *     summary="Gửi email đặt lại mật khẩu",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Email đã được gửi thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Chúng tôi đã gửi email đặt lại mật khẩu đến địa chỉ email của bạn.")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Email không hợp lệ")
     * )
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'Email không tồn tại trong hệ thống.',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Chúng tôi đã gửi email đặt lại mật khẩu đến địa chỉ email của bạn.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.'],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/auth/reset-password",
     *     tags={"Auth"},
     *     summary="Đặt lại mật khẩu",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"token","email","password","password_confirmation"},
     *             @OA\Property(property="token", type="string", example="reset-token"),
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="newpassword123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="newpassword123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Mật khẩu đã được đặt lại thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Mật khẩu đã được đặt lại thành công.")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Token không hợp lệ hoặc đã hết hạn")
     * )
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Mật khẩu đã được đặt lại thành công.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Token không hợp lệ hoặc đã hết hạn.'],
        ]);
    }
}
