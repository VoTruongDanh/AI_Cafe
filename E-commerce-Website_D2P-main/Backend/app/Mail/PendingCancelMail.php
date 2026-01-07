<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PendingCancelMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $cancelReason;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(Order $order, string $cancelReason = '')
    {
        $this->order = $order;
        $this->cancelReason = $cancelReason ?: 'Khách hàng yêu cầu hủy';
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Xác nhận nhận yêu cầu hủy đơn hàng #' . $this->order->code . ' - ElectroShop',
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            view: 'emails.pending-cancel',
            with: [
                'order' => $this->order,
                'items' => $this->order->items,
                'customer_name' => $this->order->customer_name,
                'customer_phone' => $this->order->customer_phone,
                'grand_total' => $this->order->grand_total,
                'payment_method' => $this->order->paymentMethod->name ?? 'Chuyển khoản',
                'order_date' => $this->order->created_at->format('d/m/Y H:i'),
                'cancel_reason' => $this->cancelReason,
                'request_date' => now()->format('d/m/Y H:i'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array
     */
    public function attachments()
    {
        return [];
    }
}
