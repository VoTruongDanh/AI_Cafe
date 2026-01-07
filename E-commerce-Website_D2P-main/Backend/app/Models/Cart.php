<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;
/**
 * @OA\Schema(
 *     schema="Cart",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=5),
 *     @OA\Property(property="status", type="string", example="active"),
 *     @OA\Property(property="total_quantity", type="integer", example=3),
 *     @OA\Property(property="subtotal", type="number", format="float", example=1500000),
 *     @OA\Property(property="discount_total", type="number", format="float", example=100000),
 *     @OA\Property(property="grand_total", type="number", format="float", example=1400000),
 *     @OA\Property(property="promotion_id", type="integer", nullable=true),
 *     @OA\Property(property="expires_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(
 *         property="items",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/CartItem")
 *     ),
 *     @OA\Property(property="promotion", ref="#/components/schemas/Promotion", nullable=true)
 * )
 */
class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'total_quantity',
        'subtotal',
        'discount_total',
        'grand_total',
        'promotion_id',
        'expires_at',
    ];

    protected $casts = [
        'total_quantity' => 'integer',
        'subtotal' => 'float',
        'discount_total' => 'float',
        'grand_total' => 'float',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
