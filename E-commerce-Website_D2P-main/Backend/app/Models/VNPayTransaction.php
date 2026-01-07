<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * VNPay Transaction Model
 *
 * Lưu trữ thông tin giao dịch VNPay
 */
class VNPayTransaction extends Model
{
    use HasFactory;

    protected $table = 'vnpay_transactions';

    protected $fillable = [
        'order_id',
        'txn_ref',
        'amount',
        'order_info',
        'vnp_transaction_no',
        'vnp_response_code',
        'bank_code',
        'bank_tran_no',
        'card_type',
        'pay_date',
        'status',
        'expires_at',
        'response_data',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'response_data' => 'array',
        'expires_at' => 'datetime',
    ];

    /**
     * Quan hệ với Order
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Kiểm tra giao dịch thành công
     */
    public function isSuccess(): bool
    {
        return $this->status === 'success' && $this->vnp_response_code === '00';
    }

    /**
     * Kiểm tra giao dịch đang chờ xử lý
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Kiểm tra giao dịch thất bại
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Lấy thông điệp lỗi từ response code
     */
    public function getErrorMessage(): ?string
    {
        if ($this->vnp_response_code === '00') {
            return null;
        }

        $messages = [
            '07' => 'Giao dịch bị nghi ngờ gian lận',
            '09' => 'Thẻ/Tài khoản chưa đăng ký Internet Banking',
            '10' => 'Xác thực không đúng quá 3 lần',
            '11' => 'Đã hết hạn thanh toán',
            '12' => 'Thẻ/Tài khoản bị khóa',
            '13' => 'Sai mật khẩu OTP',
            '24' => 'Khách hàng hủy giao dịch',
            '51' => 'Không đủ số dư',
            '65' => 'Vượt hạn mức giao dịch trong ngày',
            '75' => 'Ngân hàng đang bảo trì',
            '79' => 'Sai mật khẩu thanh toán quá số lần quy định',
            '99' => 'Lỗi không xác định',
        ];

        return $messages[$this->vnp_response_code] ?? 'Lỗi không xác định';
    }

    /**
     * Scope lọc theo trạng thái
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope lọc giao dịch thành công
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success')
                     ->where('vnp_response_code', '00');
    }

    /**
     * Scope lọc giao dịch đang chờ
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
