<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Middleware để track source của request (web hoặc winform)
 * Giúp phân tích và monitor riêng biệt
 */
class TrackRequestSource
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Detect source từ User-Agent hoặc custom header
        $source = $this->detectSource($request);

        // Gắn vào request để sử dụng trong controller
        $request->merge(['_source' => $source]);

        // Log request nếu cần
        if (config('app.log_api_requests')) {
            Log::channel('api')->info('API Request', [
                'source' => $source,
                'method' => $request->method(),
                'path' => $request->path(),
                'user_id' => auth('sanctum')->id(),
                'ip' => $request->ip(),
                'timestamp' => now()->toDateTimeString(),
            ]);
        }

        return $next($request);
    }

    /**
     * Detect request source
     */
    protected function detectSource(Request $request): string
    {
        // 1. Kiểm tra custom header
        if ($request->hasHeader('X-Client-Type')) {
            return strtolower($request->header('X-Client-Type'));
        }

        // 2. Kiểm tra từ route prefix
        if ($request->is('api/winform/*')) {
            return 'winform';
        }

        if ($request->is('api/admin/*')) {
            return 'web-admin';
        }

        // 3. Kiểm tra User-Agent
        $userAgent = $request->userAgent();

        if (str_contains(strtolower($userAgent), 'electroshop-winform')) {
            return 'winform';
        }

        if (str_contains(strtolower($userAgent), 'mozilla') ||
            str_contains(strtolower($userAgent), 'chrome')) {
            return 'web';
        }

        // 4. Default
        return 'unknown';
    }
}
