<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Custom Rate Limiter cho API
 * Giới hạn số request để tránh abuse và đảm bảo stability
 */
class ApiRateLimiter
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $maxAttempts = '60', string $decayMinutes = '1'): Response
    {
        // Tạo key dựa trên user hoặc IP
        $key = $this->resolveRequestSignature($request);

        // Kiểm tra rate limit
        if (RateLimiter::tooManyAttempts($key, (int) $maxAttempts)) {
            return response()->json([
                'success' => false,
                'message' => 'Quá nhiều request. Vui lòng thử lại sau ' . $decayMinutes . ' phút.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }

        // Tăng số lần thử
        RateLimiter::hit($key, (int) $decayMinutes * 60);

        $response = $next($request);

        // Thêm headers về rate limit
        return $this->addHeaders(
            $response,
            $maxAttempts,
            $this->calculateRemainingAttempts($key, (int) $maxAttempts)
        );
    }

    /**
     * Resolve request signature
     */
    protected function resolveRequestSignature(Request $request): string
    {
        if ($user = $request->user('sanctum')) {
            return 'api:' . $user->id;
        }

        return 'api:' . $request->ip();
    }

    /**
     * Calculate remaining attempts
     */
    protected function calculateRemainingAttempts(string $key, int $maxAttempts): int
    {
        return max(0, $maxAttempts - RateLimiter::attempts($key));
    }

    /**
     * Add rate limit headers
     */
    protected function addHeaders(Response $response, int $maxAttempts, int $remainingAttempts): Response
    {
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remainingAttempts,
        ]);

        return $response;
    }
}
