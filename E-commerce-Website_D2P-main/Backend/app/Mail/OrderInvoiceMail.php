<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Hóa đơn đặt hàng #' . $this->order->code . ' - ElectroShop',
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        $subtotal = $this->order->subtotal;
        $discount = $this->order->discount_total ?? 0;
        $afterDiscount = $subtotal - $discount;
        $tax = $afterDiscount * 0.08;
        $grandTotal = $afterDiscount + $tax;
        
        return new Content(
            view: 'emails.order-invoice',
            with: [
                'order' => $this->order,
                'items' => $this->order->items,
                'customer_name' => $this->order->customer_name,
                'customer_email' => $this->order->customer_email,
                'customer_phone' => $this->order->customer_phone,
                'shipping_address' => $this->getFullAddress(),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'grand_total' => $grandTotal,
                'payment_method' => $this->getPaymentMethodDisplay(),
                'payment_method_code' => $this->order->paymentMethod->code ?? 'COD',
                'order_source' => $this->order->source ?? 'web',
                'order_date' => $this->order->created_at->format('d/m/Y H:i'),
                'is_paid' => $this->order->payment_status === 'paid',
            ],
        );
    }

    /**
     * Get full shipping address
     */
    protected function getFullAddress(): string
    {
        $parts = array_filter([
            $this->order->shipping_address_line,
            $this->order->shipping_city,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get payment method display name based on order source
     * - Winform + COD = "Tiền mặt tại cửa hàng"
     * - Web + COD = "Thanh toán khi nhận hàng (COD)"
     * - Bank Transfer = "Chuyển khoản ngân hàng"
     */
    protected function getPaymentMethodDisplay(): string
    {
        $paymentMethodCode = $this->order->paymentMethod->code ?? 'COD';
        $source = $this->order->source ?? 'web';
        
        // Nếu là COD và đơn từ Winform (cửa hàng) → hiển thị "Tiền mặt tại cửa hàng"
        if ($paymentMethodCode === 'COD' && $source === 'winform') {
            return 'Tiền mặt tại cửa hàng';
        }
        
        // Các trường hợp khác → dùng tên gốc từ database
        return $this->order->paymentMethod->name ?? 'COD';
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
