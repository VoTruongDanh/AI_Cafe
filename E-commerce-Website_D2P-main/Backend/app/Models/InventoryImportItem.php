<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="InventoryImportItem",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="product_id", type="integer", example=5),
 *     @OA\Property(property="quantity", type="integer", example=10),
 *     @OA\Property(property="unit_cost", type="number", format="float", example=150000),
 *     @OA\Property(property="line_total", type="number", format="float", example=1500000),
 *     @OA\Property(property="batch_number", type="string", nullable=true),
 *     @OA\Property(property="manufactured_at", type="string", format="date", nullable=true),
 *     @OA\Property(property="expires_at", type="string", format="date", nullable=true)
 * )
 */
class InventoryImportItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_import_id',
        'product_id',
        'quantity',
        'unit_cost',
        'line_total',
        'batch_number',
        'manufactured_at',
        'expires_at',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'integer',
    'unit_cost' => 'float',
    'line_total' => 'float',
        'manufactured_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function inventoryImport()
    {
        return $this->belongsTo(InventoryImport::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
