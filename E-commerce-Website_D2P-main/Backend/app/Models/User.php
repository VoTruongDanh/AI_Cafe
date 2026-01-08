<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Constants\UserRoles;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use OpenApi\Annotations as OA;
/**
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Nguyễn Văn A"),
 *     @OA\Property(property="email", type="string", format="email", example="user@example.com"),
 *     @OA\Property(property="role", type="string", example="customer"),
 *     @OA\Property(property="phone", type="string", nullable=true, example="0987654321"),
 *     @OA\Property(property="address_line", type="string", nullable=true, example="123 Đường ABC"),
 *     @OA\Property(property="ward", type="string", nullable=true, example="Phường Bến Nghé"),
 *     @OA\Property(property="city", type="string", nullable=true, example="Hồ Chí Minh"),
 *     @OA\Property(property="postal_code", type="string", nullable=true, example="70000"),
 *     @OA\Property(property="loyalty_tier", type="string", example="bronze"),
 *     @OA\Property(property="loyalty_points", type="integer", example=0),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="last_login_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @method \Illuminate\Database\Eloquent\Relations\HasMany orders()
 * @method bool isAdmin()
 * @method bool isCustomer()
 * @method bool isEmployee()
 * @method bool isStaff()
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
        'role',
        'phone',
        'address_line',
        'ward',
        'city',
        'postal_code',
        'loyalty_tier',
        'loyalty_points',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function createdInventoryImports()
    {
        return $this->hasMany(InventoryImport::class, 'created_by');
    }

    public function approvedInventoryImports()
    {
        return $this->hasMany(InventoryImport::class, 'approved_by');
    }

    public function processedOrders()
    {
        return $this->hasMany(Order::class, 'processed_by');
    }

    public function processedReturnRequests()
    {
        return $this->hasMany(ReturnRequest::class, 'processed_by');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ==========================================
    // ROLE CHECK METHODS
    // ==========================================

    /**
     * Kiểm tra user có phải là customer không
     */
    public function isCustomer(): bool
    {
        return $this->role === UserRoles::CUSTOMER;
    }

    /**
     * Kiểm tra user có phải là admin không
     */
    public function isAdmin(): bool
    {
        return $this->role === UserRoles::ADMIN;
    }

    /**
     * Kiểm tra user có phải là admin web không (admin hoặc staff)
     */
    public function isWebAdmin(): bool
    {
        return in_array($this->role, [UserRoles::ADMIN, UserRoles::STAFF]);
    }

    /**
     * Kiểm tra user có phải là nhân viên (staff) không
     */
    public function isStaff(): bool
    {
        return $this->role === UserRoles::STAFF;
    }

    /**
     * Kiểm tra user có phải là employee (admin hoặc staff) không
     */
    public function isEmployee(): bool
    {
        return in_array($this->role, [UserRoles::ADMIN, UserRoles::STAFF]);
    }

    /**
     * Kiểm tra user có thể truy cập trang quản trị không
     */
    public function canAccessAdmin(): bool
    {
        return $this->isWebAdmin();
    }

    /**
     * Scope: Lấy users có quyền quản trị
     */
    public function scopeAdmins($query)
    {
        return $query->whereIn('role', [UserRoles::ADMIN, UserRoles::STAFF]);
    }

    /**
     * Scope: Lấy customers
     */
    public function scopeCustomers($query)
    {
        return $query->where('role', UserRoles::CUSTOMER);
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token, $this->email));
    }
}
