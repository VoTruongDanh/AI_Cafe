<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'transaction_code',
        'bank_name',
        'account_name',
        'account_number',
        'amount',
        'content',
        'qr_code_data',
        'qr_code_image_path',
        'status',
        'paid_at',
        'expires_at',
        'bank_transaction_reference',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function markAsPaid(?string $bankReference = null)
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'bank_transaction_reference' => $bankReference,
        ]);

        // Update order payment status
        $this->order->update([
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        // Gửi email xác nhận thanh toán thành công
        $this->sendPaymentConfirmedEmail();
    }

    /**
     * Gửi email xác nhận thanh toán thành công
     */
    protected function sendPaymentConfirmedEmail(): void
    {
        try {
            $order = $this->order->fresh(['paymentMethod']);
            $email = $order->customer_email;
            
            if ($email) {
                \Illuminate\Support\Facades\Mail::to($email)
                    ->send(new \App\Mail\PaymentConfirmedMail($order));
                    
                \Illuminate\Support\Facades\Log::info("Payment confirmed email sent for order {$order->code} to {$email}");
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send payment confirmed email: " . $e->getMessage());
        }
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }
}

