<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OpenApi\Annotations as OA;
/**
 * @OA\Schema(
 *     schema="Order",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1001),
 *     @OA\Property(property="code", type="string", example="ORD-20251008-ABC123"),
 *     @OA\Property(property="user_id", type="integer", example=5),
 *     @OA\Property(property="customer_name", type="string", example="Nguyễn Văn A"),
 *     @OA\Property(property="customer_phone", type="string", example="0987654321"),
 *     @OA\Property(property="customer_email", type="string", format="email", nullable=true),
 *     @OA\Property(property="shipping_address_line", type="string", nullable=true),
 *     @OA\Property(property="shipping_city", type="string", nullable=true),
 *     @OA\Property(property="shipping_ward", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", example="pending", description="pending, confirmed, processing, shipped, delivered, completed, returned, cancelled"),
 *     @OA\Property(property="payment_status", type="string", example="unpaid", description="unpaid, pending, paid, refunded"),
 *     @OA\Property(property="subtotal", type="number", format="float", example=1500000),
 *     @OA\Property(property="discount_total", type="number", format="float", example=100000),
 *     @OA\Property(property="tax_total", type="number", format="float", example=0),
 *     @OA\Property(property="grand_total", type="number", format="float", example=1400000),
 *     @OA\Property(property="promotion_id", type="integer", nullable=true),
 *     @OA\Property(property="payment_method_id", type="integer", nullable=true),
 *     @OA\Property(property="placed_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="paid_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(
 *         property="items",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/OrderItem")
 *     ),
 *     @OA\Property(property="promotion", ref="#/components/schemas/Promotion", nullable=true)
 * )
 */
class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'user_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'shipping_address_line',
        'shipping_city',
        'shipping_ward',
        'status',
        'payment_status',
        'payment_method_id',
        'payment_expires_at', // ✅ Thêm field mới
        'promotion_id',
        'processed_by',
        'subtotal',
        'discount_total',
        'tax_total',
        'grand_total',
        'channel',
        'placed_at',
        'paid_at',
        'notes',
        'qr_code_url',
        'transfer_content',
        'transfer_confirmed_at',
        'transfer_note',
        'momo_qr_url',
        'momo_transfer_content',
        'cancel_reason',
        'cancel_reject_reason',
        'cancelled_at',
        'cancelled_by',
        'refund_required',
        'refund_status',
        'refunded_at',
        'refund_note',
        'payment_reject_reason',
        'payment_rejected_at',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount_total' => 'float',
        'tax_total' => 'float',
        'grand_total' => 'float',
        'placed_at' => 'datetime',
        'paid_at' => 'datetime',
        'payment_expires_at' => 'datetime', // ✅ Thêm cast
        'cancelled_at' => 'datetime',
        'refunded_at' => 'datetime',
        'transfer_confirmed_at' => 'datetime',
        'payment_rejected_at' => 'datetime',
        'refund_required' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cancelledByUser()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function returnRequests()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function bankTransaction()
    {
        return $this->hasOne(BankTransaction::class);
    }

    public function momoTransactions()
    {
        return $this->hasMany(MoMoTransaction::class);
    }

    public function vnpayTransactions()
    {
        return $this->hasMany(VNPayTransaction::class);
    }

    /**
     * Lấy giao dịch VNPay pending gần nhất
     */
    public function latestPendingVNPayTransaction()
    {
        return $this->hasOne(VNPayTransaction::class)
            ->where('status', 'pending')
            ->latest();
    }

    /**
     * Lấy giao dịch VNPay đầu tiên (để tính thời gian bắt đầu thanh toán)
     */
    public function firstVNPayTransaction()
    {
        return $this->hasOne(VNPayTransaction::class)
            ->oldest();
    }

    /**
     * Lấy giao dịch VNPay gần nhất (bất kể status)
     */
    public function latestVNPayTransaction()
    {
        return $this->hasOne(VNPayTransaction::class)
            ->latest();
    }

    public function warranties()
    {
        return $this->hasMany(Warranty::class);
    }
}
