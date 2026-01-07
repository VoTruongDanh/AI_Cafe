<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Constants\UserRoles;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Trait để kiểm tra quyền truy cập cho Web Admin
 *
 * Cho phép: admin, staff
 */
trait EnsuresWebAdminAccess
{
    /**
     * Kiểm tra user có phải là admin web không
     * Cho phép: admin, staff
     */
    protected function ensureWebAdmin(Request $request): void
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, [UserRoles::ADMIN, UserRoles::STAFF])) {
            throw new AccessDeniedHttpException('Bạn không có quyền quản trị. Chỉ admin và staff mới có quyền này.');
        }
    }
}

