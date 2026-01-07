<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;
/**
 * @OA\Schema(
 *     schema="OrderItem",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=10),
 *     @OA\Property(property="order_id", type="integer", example=1),
 *     @OA\Property(property="product_id", type="integer", nullable=true),
 *     @OA\Property(property="product_name", type="string", example="iPhone 15"),
 *     @OA\Property(property="sku", type="string", example="SKU-001"),
 *     @OA\Property(property="quantity", type="integer", example=2),
 *     @OA\Property(property="unit_price", type="number", format="float", example=750000),
 *     @OA\Property(property="discount_amount", type="number", format="float", example=50000),
 *     @OA\Property(property="line_total", type="number", format="float", example=1400000),
 *     @OA\Property(property="metadata", type="object", nullable=true)
 * )
 */
class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'sku',
        'quantity',
        'unit_price',
        'discount_amount',
        'line_total',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'integer',
    'unit_price' => 'float',
    'discount_amount' => 'float',
    'line_total' => 'float',
        'metadata' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    public function warrantyItems()
    {
        return $this->hasMany(WarrantyItem::class);
    }
}
