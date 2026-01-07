<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="ReturnRequest",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="order_id", type="integer", example=10),
 *     @OA\Property(property="order_item_id", type="integer", nullable=true),
 *     @OA\Property(property="user_id", type="integer", example=5),
 *     @OA\Property(property="reason", type="string", example="Sản phẩm lỗi"),
 *     @OA\Property(property="status", type="string", example="pending"),
 *     @OA\Property(property="requested_quantity", type="integer", example=1),
 *     @OA\Property(property="approved_quantity", type="integer", nullable=true),
 *     @OA\Property(property="refund_amount", type="number", format="float", nullable=true),
 *     @OA\Property(property="resolution", type="string", nullable=true),
 *     @OA\Property(property="processed_by", type="integer", nullable=true),
 *     @OA\Property(property="requested_at", type="string", format="date-time"),
 *     @OA\Property(property="resolved_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="ReturnRequestStoreRequest",
 *     type="object",
 *     required={"order_id","reason","requested_quantity"},
 *     @OA\Property(property="order_id", type="integer"),
 *     @OA\Property(property="order_item_id", type="integer", nullable=true),
 *     @OA\Property(property="reason", type="string"),
 *     @OA\Property(property="requested_quantity", type="integer", minimum=1)
 * )
 *
 * @OA\Schema(
 *     schema="ReturnRequestUpdateRequest",
 *     type="object",
 *     @OA\Property(property="status", type="string", enum={"pending","approved","rejected","completed"}),
 *     @OA\Property(property="approved_quantity", type="integer", nullable=true),
 *     @OA\Property(property="refund_amount", type="number", format="float", nullable=true),
 *     @OA\Property(property="resolution", type="string", nullable=true),
 *     @OA\Property(property="notes", type="string", nullable=true)
 * )
 */
class ReturnRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'order_item_id',
        'user_id',
        'reason',
        'status',
        'requested_quantity',
        'approved_quantity',
        'refund_amount',
        'resolution',
        'processed_by',
        'requested_at',
        'resolved_at',
        'notes',
    ];

    protected $casts = [
        'requested_quantity' => 'integer',
        'approved_quantity' => 'integer',
    'refund_amount' => 'float',
        'requested_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
