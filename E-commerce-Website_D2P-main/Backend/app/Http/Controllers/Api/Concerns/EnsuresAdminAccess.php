<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Constants\UserRoles;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Trait để kiểm tra quyền admin
 */
trait EnsuresAdminAccess
{
    /**
     * Kiểm tra user có phải là admin hoặc staff không
     */
    protected function ensureAdmin(Request $request): void
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, [UserRoles::ADMIN, UserRoles::STAFF])) {
            throw new AccessDeniedHttpException('Bạn không có quyền thực hiện thao tác này.');
        }
    }
}
