<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '✓ Xác nhận thanh toán thành công - Đơn hàng #' . $this->order->code,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmed',
            with: [
                'order' => $this->order,
                'customer_name' => $this->order->customer_name,
                'customer_email' => $this->order->customer_email,
                'order_code' => $this->order->code,
                'grand_total' => $this->order->grand_total,
                'payment_method' => $this->order->paymentMethod->name ?? 'Chuyển khoản',
                'confirmed_at' => now()->format('d/m/Y H:i'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
