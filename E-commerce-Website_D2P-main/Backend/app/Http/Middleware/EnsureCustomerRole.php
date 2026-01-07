<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerRole
{
    /**
     * Handle an incoming request.
     *
     * Only allows customer users to access.
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

        // Check if user is customer
        if (!$user->isCustomer()) {
            return response()->json([
                'message' => 'Chỉ dành cho khách hàng. Tài khoản của bạn không thể thực hiện hành động này.',
                'error' => 'Unauthorized'
            ], 403);
        }

        return $next($request);
    }
}
