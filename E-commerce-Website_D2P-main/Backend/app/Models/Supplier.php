<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="Supplier",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Công ty ABC"),
 *     @OA\Property(property="contact_person", type="string", nullable=true, example="Nguyễn Văn B"),
 *     @OA\Property(property="email", type="string", format="email", nullable=true),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="address_line", type="string", nullable=true),
 *     @OA\Property(property="city", type="string", nullable=true),
 *     @OA\Property(property="district", type="string", nullable=true),
 *     @OA\Property(property="tax_code", type="string", nullable=true),
 *     @OA\Property(property="bank_account", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="SupplierStoreRequest",
 *     type="object",
 *     required={"name"},
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="contact_person", type="string", nullable=true),
 *     @OA\Property(property="email", type="string", format="email", nullable=true),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="address_line", type="string", nullable=true),
 *     @OA\Property(property="city", type="string", nullable=true),
 *     @OA\Property(property="district", type="string", nullable=true),
 *     @OA\Property(property="tax_code", type="string", nullable=true),
 *     @OA\Property(property="bank_account", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="SupplierUpdateRequest",
 *     type="object",
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="contact_person", type="string", nullable=true),
 *     @OA\Property(property="email", type="string", format="email", nullable=true),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="address_line", type="string", nullable=true),
 *     @OA\Property(property="city", type="string", nullable=true),
 *     @OA\Property(property="district", type="string", nullable=true),
 *     @OA\Property(property="tax_code", type="string", nullable=true),
 *     @OA\Property(property="bank_account", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 */
class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address_line',
        'city',
        'district',
        'tax_code',
        'bank_account',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function inventoryImports()
    {
        return $this->hasMany(InventoryImport::class);
    }
}
