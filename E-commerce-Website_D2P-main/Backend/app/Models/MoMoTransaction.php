<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * MoMo Transaction Model
 *
 * Lưu trữ thông tin giao dịch MoMo
 */
class MoMoTransaction extends Model
{
    use HasFactory;

    protected $table = 'momo_transactions';

    protected $fillable = [
        'order_id',
        'momo_order_id',
        'request_id',
        'amount',
        'order_info',
        'pay_url',
        'qr_code_url',
        'deep_link',
        'trans_id',
        'pay_type',
        'status',
        'result_code',
        'response_data',
        'expires_at',
        'paid_at',
        'refund_trans_id',
        'refunded_at',
        'refund_response',
    ];

    protected $casts = [
        'amount' => 'integer',
        'result_code' => 'integer',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Quan hệ với Order
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Kiểm tra giao dịch đã thanh toán chưa
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Kiểm tra giao dịch đã hết hạn chưa
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Kiểm tra giao dịch đang chờ thanh toán
     */
    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    /**
     * Scope lọc các giao dịch đang chờ
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending')
            ->where('expires_at', '>', now());
    }

    /**
     * Scope lọc các giao dịch đã thanh toán
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope lọc các giao dịch đã hết hạn
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'pending')
            ->where('expires_at', '<=', now());
    }
}
