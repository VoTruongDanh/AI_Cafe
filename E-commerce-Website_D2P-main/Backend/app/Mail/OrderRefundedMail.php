<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderRefundedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public ?string $refundNote;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(Order $order, ?string $refundNote = null)
    {
        $this->order = $order;
        $this->refundNote = $refundNote;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Xác nhận hoàn tiền đơn hàng #' . $this->order->code . ' - ElectroShop',
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
            view: 'emails.order-refunded',
            with: [
                'order' => $this->order,
                'refundNote' => $this->refundNote,
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
