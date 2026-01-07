<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddCacheHeaders
{
    /**
     * Handle an incoming request.
     * Thêm Cache-Control headers để browser cache API responses
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $maxAge = 300)
    {
        $response = $next($request);

        // ❌ CACHE DISABLED - Không cache để F5 luôn refresh
        // Thêm no-cache headers
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');

        return $response;
    }
}
