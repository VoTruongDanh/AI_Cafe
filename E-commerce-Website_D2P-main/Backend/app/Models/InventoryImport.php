<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="InventoryImport",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="code", type="string", example="IMP-20231001-ABC123"),
 *     @OA\Property(property="supplier_id", type="integer", nullable=true),
 *     @OA\Property(property="created_by", type="integer"),
 *     @OA\Property(property="approved_by", type="integer", nullable=true),
 *     @OA\Property(property="status", type="string", example="draft"),
 *     @OA\Property(property="reference_number", type="string", nullable=true),
 *     @OA\Property(property="expected_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="completed_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="subtotal", type="number", format="float", example=1000000),
 *     @OA\Property(property="tax_total", type="number", format="float", example=0),
 *     @OA\Property(property="discount_total", type="number", format="float", example=0),
 *     @OA\Property(property="grand_total", type="number", format="float", example=1000000),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="items", type="array", @OA\Items(ref="#/components/schemas/InventoryImportItem"))
 * )
 *
 * @OA\Schema(
 *     schema="InventoryImportItemInput",
 *     type="object",
 *     required={"product_id","quantity","unit_cost"},
 *     @OA\Property(property="product_id", type="integer", example=5),
 *     @OA\Property(property="quantity", type="integer", example=10),
 *     @OA\Property(property="unit_cost", type="number", format="float", example=150000),
 *     @OA\Property(property="batch_number", type="string", nullable=true),
 *     @OA\Property(property="manufactured_at", type="string", format="date", nullable=true),
 *     @OA\Property(property="expires_at", type="string", format="date", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="InventoryImportStoreRequest",
 *     type="object",
 *     required={"items"},
 *     @OA\Property(property="supplier_id", type="integer", nullable=true),
 *     @OA\Property(property="reference_number", type="string", nullable=true),
 *     @OA\Property(property="expected_at", type="string", format="date", nullable=true),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="items", type="array", @OA\Items(ref="#/components/schemas/InventoryImportItemInput"))
 * )
 *
 * @OA\Schema(
 *     schema="InventoryImportUpdateRequest",
 *     type="object",
 *     @OA\Property(property="supplier_id", type="integer", nullable=true),
 *     @OA\Property(property="reference_number", type="string", nullable=true),
 *     @OA\Property(property="expected_at", type="string", format="date", nullable=true),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"draft","approved","completed","cancelled"}),
 *     @OA\Property(property="items", type="array", @OA\Items(ref="#/components/schemas/InventoryImportItemInput"))
 * )
 */
class InventoryImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'supplier_id',
        'created_by',
        'approved_by',
        'status',
        'reference_number',
        'expected_at',
        'completed_at',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'notes',
    ];

    protected $casts = [
        'expected_at' => 'datetime',
        'completed_at' => 'datetime',
    'subtotal' => 'float',
    'tax_total' => 'float',
    'discount_total' => 'float',
    'grand_total' => 'float',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(InventoryImportItem::class);
    }
}
