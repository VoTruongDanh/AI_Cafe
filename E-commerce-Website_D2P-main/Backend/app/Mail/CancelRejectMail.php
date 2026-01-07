<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CancelRejectMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $rejectReason;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(Order $order, string $rejectReason = '')
    {
        $this->order = $order;
        $this->rejectReason = $rejectReason ?: 'Không có lý do cụ thể';
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Yêu cầu hủy đơn hàng #' . $this->order->code . ' đã bị từ chối - ElectroShop',
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
            view: 'emails.cancel-rejected',
            with: [
                'order' => $this->order,
                'items' => $this->order->items,
                'customer_name' => $this->order->customer_name,
                'customer_phone' => $this->order->customer_phone,
                'grand_total' => $this->order->grand_total,
                'payment_method' => $this->order->paymentMethod->name ?? 'COD',
                'order_date' => $this->order->created_at->format('d/m/Y H:i'),
                'reject_reason' => $this->rejectReason,
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
