<?php

namespace App\Constants;

/**
 * Định nghĩa tất cả các roles trong hệ thống
 * Chỉ có 3 roles: customer, admin, staff
 */
class UserRoles
{
    /**
     * Khách hàng (mặc định khi đăng ký)
     */
    const CUSTOMER = 'customer';

    /**
     * Quản trị viên (quyền cao nhất)
     */
    const ADMIN = 'admin';

    /**
     * Nhân viên
     */
    const STAFF = 'staff';

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Lấy danh sách tất cả roles
     */
    public static function getAllRoles(): array
    {
        return [
            self::CUSTOMER,
            self::ADMIN,
            self::STAFF,
        ];
    }

    /**
     * Lấy danh sách roles có quyền quản trị
     */
    public static function getAdminRoles(): array
    {
        return [
            self::ADMIN,
            self::STAFF,
        ];
    }

    /**
     * Kiểm tra role có phải là customer không
     */
    public static function isCustomer(string $role): bool
    {
        return $role === self::CUSTOMER;
    }

    /**
     * Kiểm tra role có phải là admin không
     */
    public static function isAdmin(string $role): bool
    {
        return $role === self::ADMIN;
    }

    /**
     * Kiểm tra role có phải là staff không
     */
    public static function isStaff(string $role): bool
    {
        return $role === self::STAFF;
    }

    /**
     * Kiểm tra role có phải là employee (admin hoặc staff) không
     */
    public static function isEmployeeRole(string $role): bool
    {
        return in_array($role, self::getAdminRoles(), true);
    }

    /**
     * Kiểm tra role có quyền admin web không (admin hoặc staff)
     */
    public static function isWebAdmin(string $role): bool
    {
        return in_array($role, self::getAdminRoles(), true);
    }

    /**
     * Kiểm tra role có thể truy cập trang quản trị không
     */
    public static function canAccessAdmin(string $role): bool
    {
        return self::isWebAdmin($role);
    }
}

