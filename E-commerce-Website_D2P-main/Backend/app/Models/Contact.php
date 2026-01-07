<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="Contact",
 *     type="object",
 *     title="Contact",
 *     description="Contact form submission model",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Nguyen Van A"),
 *     @OA\Property(property="email", type="string", format="email", example="user@example.com"),
 *     @OA\Property(property="phone", type="string", nullable=true, example="0987654321"),
 *     @OA\Property(property="subject", type="string", example="Hỏi về sản phẩm"),
 *     @OA\Property(property="message", type="string", example="Tôi muốn hỏi về..."),
 *     @OA\Property(property="status", type="string", enum={"pending", "processing", "resolved"}, example="pending"),
 *     @OA\Property(property="admin_note", type="string", nullable=true),
 *     @OA\Property(property="ip_address", type="string", nullable=true),
 *     @OA\Property(property="user_agent", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'status',
        'admin_note',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_RESOLVED = 'resolved';

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', self::STATUS_RESOLVED);
    }
}
