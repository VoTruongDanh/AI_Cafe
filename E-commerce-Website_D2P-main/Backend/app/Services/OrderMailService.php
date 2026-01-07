<?php

namespace App\Services;

use App\Mail\OrderInvoiceMail;
use App\Mail\OrderCancelledMail;
use App\Mail\OrderRefundedMail;
use App\Mail\CancelRejectMail;
use App\Mail\PaymentRejectMail;
use App\Mail\PendingCancelMail;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OrderMailService
{
    /**
     * Send invoice email to customer
     */
    public function sendInvoice(Order $order): bool
    {
        try {
            // Load relationships
            $order->load(['items.product', 'paymentMethod', 'user']);

            // Get customer email
            $email = $order->customer_email ?? $order->user?->email;

            // ✅ BUG FIX: Validate email format
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Cannot send invoice for order {$order->code}: Invalid email address: " . ($email ?? 'null'));
                return false;
            }

            Mail::to($email)->send(new OrderInvoiceMail($order));

            Log::info("Invoice sent successfully for order {$order->code} to {$email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send invoice for order {$order->code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send order confirmation email
     */
    public function sendOrderConfirmation(Order $order): bool
    {
        return $this->sendInvoice($order);
    }

    /**
     * Send order cancelled email to customer
     */
    public function sendOrderCancelled(Order $order, string $reason = 'Không có lý do cụ thể'): bool
    {
        try {
            // Load relationships
            $order->load(['items.product', 'paymentMethod', 'user']);

            // Get customer email
            $email = $order->customer_email ?? $order->user?->email;

            // ✅ BUG FIX: Validate email format
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Cannot send cancellation email for order {$order->code}: Invalid email address: " . ($email ?? 'null'));
                return false;
            }

            Mail::to($email)->send(new OrderCancelledMail($order, $reason));

            Log::info("Cancellation email sent successfully for order {$order->code} to {$email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send cancellation email for order {$order->code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send order refunded email to customer
     */
    public function sendOrderRefunded(Order $order, ?string $refundNote = null): bool
    {
        try {
            // Load relationships
            $order->load(['items.product', 'paymentMethod', 'user']);

            // Get customer email
            $email = $order->customer_email ?? $order->user?->email;

            // ✅ BUG FIX: Validate email format
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Cannot send refund email for order {$order->code}: Invalid email address: " . ($email ?? 'null'));
                return false;
            }

            Mail::to($email)->send(new OrderRefundedMail($order, $refundNote));

            Log::info("Refund email sent successfully for order {$order->code} to {$email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send refund email for order {$order->code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send cancel rejected email to customer (when admin rejects cancel request)
     */
    public function sendCancelRejected(Order $order, string $rejectReason = 'Không có lý do cụ thể'): bool
    {
        try {
            // Load relationships
            $order->load(['items.product', 'paymentMethod', 'user']);

            // Get customer email
            $email = $order->customer_email ?? $order->user?->email;

            // ✅ BUG FIX: Validate email format
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Cannot send cancel rejected email for order {$order->code}: Invalid email address: " . ($email ?? 'null'));
                return false;
            }

            Mail::to($email)->send(new CancelRejectMail($order, $rejectReason));

            Log::info("Cancel rejected email sent successfully for order {$order->code} to {$email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send cancel rejected email for order {$order->code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send payment rejected email to customer (when admin rejects payment confirmation)
     */
    public function sendPaymentRejected(Order $order, string $rejectReason = 'Không tìm thấy giao dịch thanh toán'): bool
    {
        try {
            // Load relationships
            $order->load(['items.product', 'paymentMethod', 'user']);

            // Get customer email
            $email = $order->customer_email ?? $order->user?->email;

            // ✅ BUG FIX: Validate email format
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Cannot send payment rejected email for order {$order->code}: Invalid email address: " . ($email ?? 'null'));
                return false;
            }

            Mail::to($email)->send(new PaymentRejectMail($order, $rejectReason));

            Log::info("Payment rejected email sent successfully for order {$order->code} to {$email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send payment rejected email for order {$order->code}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send pending cancel email to customer (when customer requests cancel and waiting for admin approval)
     */
    public function sendPendingCancel(Order $order, string $cancelReason = 'Khách hàng yêu cầu hủy'): bool
    {
        try {
            // Load relationships
            $order->load(['items.product', 'paymentMethod', 'user']);

            // Get customer email
            $email = $order->customer_email ?? $order->user?->email;

            // ✅ BUG FIX: Validate email format
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning("Cannot send pending cancel email for order {$order->code}: Invalid email address: " . ($email ?? 'null'));
                return false;
            }

            Mail::to($email)->send(new PendingCancelMail($order, $cancelReason));

            Log::info("Pending cancel email sent successfully for order {$order->code} to {$email}");
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send pending cancel email for order {$order->code}: " . $e->getMessage());
            return false;
        }
    }
}
