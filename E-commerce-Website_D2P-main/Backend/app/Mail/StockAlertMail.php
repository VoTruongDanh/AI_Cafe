<?php

namespace App\Mail;

use App\Models\Product;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StockAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $product;
    public $user;

    public function __construct(Product $product, User $user)
    {
        $this->product = $product;
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🎉 Sản phẩm đã có hàng: ' . $this->product->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.stock-alert',
            with: [
                'product' => $this->product,
                'user' => $this->user,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
