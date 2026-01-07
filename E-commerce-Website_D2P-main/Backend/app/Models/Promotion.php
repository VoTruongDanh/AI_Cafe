<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="Promotion",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Giảm 10%"),
 *     @OA\Property(property="code", type="string", example="SALE10"),
 *     @OA\Property(property="promotion_type", type="string", example="percentage"),
 *     @OA\Property(property="value", type="number", format="float", example=10),
 *     @OA\Property(property="max_discount_value", type="number", format="float", nullable=true),
 *     @OA\Property(property="min_order_value", type="number", format="float", nullable=true),
 *     @OA\Property(property="usage_limit", type="integer", nullable=true),
 *     @OA\Property(property="used_count", type="integer", example=2),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="starts_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="ends_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="PromotionStoreRequest",
 *     type="object",
 *     required={"name","code","promotion_type","value"},
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="code", type="string"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="promotion_type", type="string", enum={"percentage","fixed"}),
 *     @OA\Property(property="value", type="number", format="float"),
 *     @OA\Property(property="max_discount_value", type="number", format="float", nullable=true),
 *     @OA\Property(property="min_order_value", type="number", format="float", nullable=true),
 *     @OA\Property(property="usage_limit", type="integer", nullable=true),
 *     @OA\Property(property="is_stackable", type="boolean", example=false),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="channels", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="applies_to", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="metadata", type="object", nullable=true),
 *     @OA\Property(property="starts_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="ends_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="product_ids", type="array", @OA\Items(type="integer"), nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="PromotionUpdateRequest",
 *     type="object",
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="code", type="string"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="promotion_type", type="string", enum={"percentage","fixed"}),
 *     @OA\Property(property="value", type="number", format="float"),
 *     @OA\Property(property="max_discount_value", type="number", format="float", nullable=true),
 *     @OA\Property(property="min_order_value", type="number", format="float", nullable=true),
 *     @OA\Property(property="usage_limit", type="integer", nullable=true),
 *     @OA\Property(property="is_stackable", type="boolean", example=false),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="channels", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="applies_to", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="metadata", type="object", nullable=true),
 *     @OA\Property(property="starts_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="ends_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="product_ids", type="array", @OA\Items(type="integer"), nullable=true)
 * )
 */
class Promotion extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'promotion_type',
        'value',
        'max_discount_value',
        'min_order_value',
        'usage_limit',
        'used_count',
        'applies_to',
        'channels',
        'metadata',
        'is_stackable',
        'is_active',
        'is_flash_sale',
        'promotion_category', // flash_sale, special_offer, coupon
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'value' => 'float',
        'max_discount_value' => 'float',
        'min_order_value' => 'float',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'applies_to' => 'array',
        'channels' => 'array',
        'metadata' => 'array',
        'is_stackable' => 'boolean',
        'is_active' => 'boolean',
        'is_flash_sale' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    // Các loại khuyến mãi
    const CATEGORY_FLASH_SALE = 'flash_sale';      // Flash Sale - Giờ vàng giá sốc
    const CATEGORY_SPECIAL_OFFER = 'special_offer'; // Khuyến mãi đặc biệt
    const CATEGORY_COUPON = 'coupon';              // Mã giảm giá checkout

    public function products()
    {
        return $this->belongsToMany(Product::class, 'promotion_product')
            ->withPivot(['priority'])
            ->withTimestamps();
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $now = now();
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) {
                $now = now();
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            });
    }

    // Scope cho Flash Sale
    public function scopeFlashSale($query)
    {
        return $query->where('promotion_category', self::CATEGORY_FLASH_SALE);
    }

    // Scope cho Khuyến mãi đặc biệt
    public function scopeSpecialOffer($query)
    {
        return $query->where('promotion_category', self::CATEGORY_SPECIAL_OFFER);
    }

    // Scope cho Mã giảm giá
    public function scopeCoupon($query)
    {
        return $query->where('promotion_category', self::CATEGORY_COUPON);
    }
}
