<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWebAdminRole
{
    /**
     * Handle an incoming request.
     *
     * Allows web admin AND employee users to access.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Check if user is web admin OR employee
        if (!$user->isWebAdmin() && !$user->isEmployee()) {
            return response()->json([
                'message' => 'Chỉ dành cho quản trị viên và nhân viên. Bạn không có quyền truy cập.',
                'error' => 'Unauthorized'
            ], 403);
        }

        return $next($request);
    }
}
