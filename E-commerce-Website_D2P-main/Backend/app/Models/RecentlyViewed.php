<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="RecentlyViewed",
 *     type="object",
 *     title="Recently Viewed",
 *     description="Recently viewed products model",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="user_id", type="integer", example=1),
 *     @OA\Property(property="product_id", type="integer", example=5),
 *     @OA\Property(property="viewed_at", type="string", format="date-time"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */
class RecentlyViewed extends Model
{
    use HasFactory;

    protected $table = 'recently_viewed';

    protected $fillable = [
        'user_id',
        'product_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that viewed the product
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the product that was viewed
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
