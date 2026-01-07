<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Constants\UserRoles;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Trait để kiểm tra quyền truy cập cho Employee (admin hoặc staff)
 *
 * Sử dụng trong các Controller API
 */
trait EnsuresEmployeeAccess
{
    /**
     * Kiểm tra user có phải là employee (admin hoặc staff) không
     */
    protected function ensureEmployee(Request $request): void
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, [UserRoles::ADMIN, UserRoles::STAFF])) {
            throw new AccessDeniedHttpException('Bạn không có quyền truy cập. Chỉ admin và staff mới có quyền.');
        }
    }

    /**
     * Kiểm tra user có phải là admin không
     */
    protected function ensureAdminOnly(Request $request): void
    {
        $user = $request->user();

        if (!$user || $user->role !== UserRoles::ADMIN) {
            throw new AccessDeniedHttpException('Bạn không có quyền. Chỉ admin mới có quyền này.');
        }
    }
}

