<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="PaymentMethod",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Chuyển khoản ngân hàng"),
 *     @OA\Property(property="code", type="string", example="BANK_TRANSFER"),
 *     @OA\Property(property="type", type="string", example="online"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="config", type="object", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="PaymentMethodStoreRequest",
 *     type="object",
 *     required={"name","code","type"},
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="code", type="string"),
 *     @OA\Property(property="type", type="string", enum={"online","offline"}),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="config", type="object", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="PaymentMethodUpdateRequest",
 *     type="object",
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="code", type="string"),
 *     @OA\Property(property="type", type="string", enum={"online","offline"}),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="config", type="object", nullable=true)
 * )
 */
class PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'description',
        'is_active',
        'config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
