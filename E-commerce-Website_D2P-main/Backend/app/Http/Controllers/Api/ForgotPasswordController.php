<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Password Reset",
 *     description="API endpoints for password reset functionality"
 * )
 */
class ForgotPasswordController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/password/forgot",
     *     tags={"Password Reset"},
     *     summary="Request password reset email",
     *     description="Send password reset link to user's email",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Success response (same message whether email exists or not)",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (hoặc spam).")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Invalid input")
     * )
     */
    public function sendResetLinkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Vui lòng nhập email hợp lệ.',
                'errors' => $validator->errors()
            ], 400);
        }

        $email = $request->email;

        // Tạo token ngẫu nhiên
        $token = Str::random(64);
        $tokenHash = hash('sha256', $token);
        $expiresAt = Carbon::now()->addHour(); // Token có hiệu lực 1 giờ

        // Kiểm tra user tồn tại (không tiết lộ trong response)
        $user = User::where('email', $email)->first();

        if ($user) {
            // Xóa các token reset cũ của email này
            DB::table('password_resets')->where('email', $email)->delete();

            // Lưu token mới
            DB::table('password_resets')->insert([
                'email' => $email,
                'token_hash' => $tokenHash,
                'expires_at' => $expiresAt,
                'used' => false,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);

            // Tự động lấy URL frontend từ request header (Origin hoặc Referer)
            $frontendUrl = $this->getFrontendUrl($request);
            $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($email);

            // Gửi email
            try {
                Mail::send('emails.reset-password', ['resetUrl' => $resetUrl, 'user' => $user], function ($message) use ($email) {
                    $message->to($email);
                    $message->subject('Đặt lại mật khẩu - ElectroShop');
                });
            } catch (\Exception $e) {
                Log::error('Failed to send reset email: ' . $e->getMessage());
                // Vẫn trả về message chung để không lộ thông tin
            }
        }

        // Luôn trả về message chung để tránh user enumeration
        return response()->json([
            'message' => 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (hoặc spam).'
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/password/verify-token",
     *     tags={"Password Reset"},
     *     summary="Verify reset token validity",
     *     description="Check if reset token is valid and not expired",
     *     @OA\Parameter(
     *         name="token",
     *         in="query",
     *         required=true,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="email",
     *         in="query",
     *         required=true,
     *         @OA\Schema(type="string", format="email")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Token validation result",
     *         @OA\JsonContent(
     *             @OA\Property(property="valid", type="boolean"),
     *             @OA\Property(property="reason", type="string", example="expired")
     *         )
     *     )
     * )
     */
    public function verifyToken(Request $request)
    {
        $token = $request->query('token');
        $email = $request->query('email');

        if (!$token || !$email) {
            return response()->json(['valid' => false, 'reason' => 'missing_params']);
        }

        $tokenHash = hash('sha256', $token);

        $resetRecord = DB::table('password_resets')
            ->where('email', $email)
            ->where('token_hash', $tokenHash)
            ->where('used', false)
            ->first();

        if (!$resetRecord) {
            return response()->json(['valid' => false, 'reason' => 'invalid_token']);
        }

        // Kiểm tra hết hạn
        $expiresAt = Carbon::parse($resetRecord->expires_at);
        if (Carbon::now()->gt($expiresAt)) {
            // Xóa token hết hạn
            DB::table('password_resets')->where('id', $resetRecord->id)->delete();
            return response()->json(['valid' => false, 'reason' => 'expired']);
        }

        return response()->json(['valid' => true]);
    }

    /**
     * @OA\Post(
     *     path="/api/password/reset",
     *     tags={"Password Reset"},
     *     summary="Reset password",
     *     description="Reset user password with valid token",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","token","password","password_confirmation"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com"),
     *             @OA\Property(property="token", type="string", example="abcd1234..."),
     *             @OA\Property(property="password", type="string", format="password", example="NewPassword123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="NewPassword123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Password reset successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Invalid token or validation error")
     * )
     */
    public function reset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Dữ liệu không hợp lệ.',
                'errors' => $validator->errors()
            ], 400);
        }

        $email = $request->email;
        $token = $request->token;
        $password = $request->password;

        $tokenHash = hash('sha256', $token);

        // Tìm token reset
        $resetRecord = DB::table('password_resets')
            ->where('email', $email)
            ->where('token_hash', $tokenHash)
            ->where('used', false)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Token không hợp lệ hoặc đã được sử dụng.'
            ], 400);
        }

        // Kiểm tra hết hạn
        $expiresAt = Carbon::parse($resetRecord->expires_at);
        if (Carbon::now()->gt($expiresAt)) {
            DB::table('password_resets')->where('id', $resetRecord->id)->delete();
            return response()->json([
                'message' => 'Token đã hết hạn. Vui lòng yêu cầu gửi lại.'
            ], 400);
        }

        // Cập nhật mật khẩu
        DB::beginTransaction();
        try {
            $user = User::where('email', $email)->first();

            if (!$user) {
                DB::rollBack();
                return response()->json(['message' => 'Người dùng không tồn tại.'], 400);
            }

            $user->password = Hash::make($password);
            $user->save();

            // Đánh dấu token đã sử dụng
            DB::table('password_resets')
                ->where('id', $resetRecord->id)
                ->update(['used' => true, 'updated_at' => Carbon::now()]);

            DB::commit();

            return response()->json([
                'message' => 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Password reset error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Có lỗi xảy ra. Vui lòng thử lại.'
            ], 500);
        }
    }

    /**
     * Lấy URL frontend từ request header
     */
    private function getFrontendUrl(Request $request): string
    {
        // Ưu tiên lấy từ Origin header (khi frontend gửi request AJAX)
        $origin = $request->header('Origin');
        if ($origin) {
            return rtrim($origin, '/');
        }

        // Nếu không có Origin, thử lấy từ Referer
        $referer = $request->header('Referer');
        if ($referer) {
            $parsed = parse_url($referer);
            if (isset($parsed['scheme']) && isset($parsed['host'])) {
                $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
                return $parsed['scheme'] . '://' . $parsed['host'] . $port;
            }
        }

        // Fallback về config nếu không có header
        return config('app.frontend_url', 'http://localhost:5173');
    }
}
