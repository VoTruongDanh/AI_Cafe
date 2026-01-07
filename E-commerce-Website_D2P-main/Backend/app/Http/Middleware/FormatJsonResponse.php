<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware để format consistent JSON response
 * Đảm bảo Web và WinForm nhận cùng format
 */
class FormatJsonResponse
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Chỉ xử lý JSON response
        if (!$request->expectsJson()) {
            return $response;
        }

        // Lấy original content
        $content = $response->getContent();
        $data = json_decode($content, true);

        // Nếu đã có format chuẩn, không cần xử lý
        if (isset($data['success']) || isset($data['error'])) {
            return $response;
        }

        // Format lại response
        $statusCode = $response->getStatusCode();
        $isSuccess = $statusCode >= 200 && $statusCode < 300;

        $formatted = [
            'success' => $isSuccess,
            'data' => $isSuccess ? $data : null,
            'message' => $this->getDefaultMessage($statusCode),
            'timestamp' => now()->toIso8601String(),
        ];

        if (!$isSuccess && isset($data['message'])) {
            $formatted['message'] = $data['message'];
        }

        if (!$isSuccess && isset($data['errors'])) {
            $formatted['errors'] = $data['errors'];
        }

        $response->setContent(json_encode($formatted));

        return $response;
    }

    /**
     * Get default message by status code
     */
    protected function getDefaultMessage(int $statusCode): string
    {
        return match($statusCode) {
            200 => 'Thành công',
            201 => 'Tạo mới thành công',
            204 => 'Xóa thành công',
            400 => 'Dữ liệu không hợp lệ',
            401 => 'Chưa đăng nhập',
            403 => 'Không có quyền truy cập',
            404 => 'Không tìm thấy',
            422 => 'Dữ liệu không hợp lệ',
            429 => 'Quá nhiều request',
            500 => 'Lỗi hệ thống',
            default => 'Unknown',
        };
    }
}
