<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // Luôn trả null cho API routes để trả JSON response thay vì redirect
        $path = $request->path();
        if ($request->expectsJson() || $request->is('api/*') || strpos($path, 'api/') === 0) {
            return null;
        }
        
        // For web requests, return null (không có route login)
        return null;
    }
}
