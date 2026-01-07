<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\MoMoTransaction;
use App\Models\BankTransaction;
use App\Models\VNPayTransaction;
use App\Services\OrderMailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Command tự động hủy các đơn hàng thanh toán QR (MoMo, Bank Transfer, VNPay) đã hết hạn
 *
 * Khi khách hàng chọn thanh toán bằng QR MoMo, chuyển khoản ngân hàng hoặc VNPay,
 * nếu sau thời gian hết hạn mà chưa nhận được thanh toán,
 * đơn hàng sẽ tự động bị hủy với lý do "Chưa thanh toán trong thời gian quy định"
 */
class CancelExpiredPaymentOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:cancel-expired-payments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động hủy các đơn hàng thanh toán QR đã hết hạn mà chưa được thanh toán';

    protected OrderMailService $mailService;

    public function __construct(OrderMailService $mailService)
    {
        parent::__construct();
        $this->mailService = $mailService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Bắt đầu kiểm tra các đơn hàng thanh toán QR hết hạn...');

        $cancelledCount = 0;

        // 1. Xử lý các giao dịch MoMo hết hạn
        $cancelledCount += $this->cancelExpiredMoMoOrders();

        // 2. Xử lý các giao dịch Bank Transfer hết hạn
        $cancelledCount += $this->cancelExpiredBankTransferOrders();

        // 3. Xử lý các giao dịch VNPay hết hạn
        $cancelledCount += $this->cancelExpiredVNPayOrders();

        $this->info("Hoàn thành! Đã hủy {$cancelledCount} đơn hàng.");

        return Command::SUCCESS;
    }

    /**
     * Hủy các đơn hàng MoMo đã hết hạn
     */
    protected function cancelExpiredMoMoOrders(): int
    {
        $cancelledCount = 0;

        // Lấy các giao dịch MoMo đang pending và đã hết hạn
        $expiredTransactions = MoMoTransaction::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->with('order')
            ->get();

        foreach ($expiredTransactions as $transaction) {
            try {
                DB::beginTransaction();

                $order = $transaction->order;

                // Kiểm tra đơn hàng còn tồn tại và chưa thanh toán
                if (!$order || $order->payment_status === 'paid' || $order->status === 'cancelled') {
                    // Chỉ cập nhật trạng thái giao dịch
                    $transaction->update(['status' => 'expired']);
                    DB::commit();
                    continue;
                }

                // Cập nhật trạng thái giao dịch MoMo
                $transaction->update(['status' => 'expired']);

                // Hủy đơn hàng
                $this->cancelOrder($order, 'MoMo');

                $cancelledCount++;

                DB::commit();

                $this->line("  - Đã hủy đơn hàng {$order->code} (MoMo hết hạn)");

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Lỗi khi hủy đơn hàng MoMo hết hạn', [
                    'transaction_id' => $transaction->id,
                    'order_id' => $transaction->order_id,
                    'error' => $e->getMessage(),
                ]);
                $this->error("  - Lỗi khi hủy đơn hàng (MoMo Transaction #{$transaction->id}): {$e->getMessage()}");
            }
        }

        $this->info("  Đã xử lý {$expiredTransactions->count()} giao dịch MoMo hết hạn.");

        return $cancelledCount;
    }

    /**
     * Hủy các đơn hàng Bank Transfer đã hết hạn
     */
    protected function cancelExpiredBankTransferOrders(): int
    {
        $cancelledCount = 0;

        // Lấy các giao dịch Bank Transfer đang pending và đã hết hạn
        $expiredTransactions = BankTransaction::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->with('order')
            ->get();

        foreach ($expiredTransactions as $transaction) {
            try {
                DB::beginTransaction();

                $order = $transaction->order;

                // Kiểm tra đơn hàng còn tồn tại và chưa thanh toán
                if (!$order || $order->payment_status === 'paid' || $order->status === 'cancelled') {
                    // Chỉ cập nhật trạng thái giao dịch
                    $transaction->update(['status' => 'expired']);
                    DB::commit();
                    continue;
                }

                // Cập nhật trạng thái giao dịch
                $transaction->update(['status' => 'expired']);

                // Hủy đơn hàng
                $this->cancelOrder($order, 'Chuyển khoản ngân hàng');

                $cancelledCount++;

                DB::commit();

                $this->line("  - Đã hủy đơn hàng {$order->code} (Bank Transfer hết hạn)");

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Lỗi khi hủy đơn hàng Bank Transfer hết hạn', [
                    'transaction_id' => $transaction->id,
                    'order_id' => $transaction->order_id,
                    'error' => $e->getMessage(),
                ]);
                $this->error("  - Lỗi khi hủy đơn hàng (Bank Transaction #{$transaction->id}): {$e->getMessage()}");
            }
        }

        $this->info("  Đã xử lý {$expiredTransactions->count()} giao dịch Bank Transfer hết hạn.");

        return $cancelledCount;
    }

    /**
     * Hủy các đơn hàng VNPay đã hết hạn
     * Logic: Dựa trên thời gian tạo giao dịch VNPay đầu tiên + expiry_minutes
     * Nếu sau thời gian quy định mà chưa thanh toán thành công (dù đã thử nhiều lần), đơn hàng sẽ bị hủy
     */
    protected function cancelExpiredVNPayOrders(): int
    {
        $cancelledCount = 0;
        $expiryMinutes = config('vnpay.expiry_minutes', 15);
        $expirySeconds = $expiryMinutes * 60;

        // Lấy các đơn hàng có giao dịch VNPay nhưng chưa thanh toán
        // và giao dịch đầu tiên đã quá thời gian cho phép
        $orders = Order::where('status', 'pending')
            ->where('payment_status', '!=', 'paid')
            ->whereHas('paymentMethod', function ($q) {
                $q->whereIn('code', ['VNPAY', 'vnpay']);
            })
            ->whereHas('vnpayTransactions')
            ->with(['vnpayTransactions' => function ($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->get();

        foreach ($orders as $order) {
            // Lấy giao dịch VNPay đầu tiên
            $firstTransaction = $order->vnpayTransactions->first();
            if (!$firstTransaction) continue;

            // Tính thời gian hết hạn = thời gian tạo giao dịch đầu tiên + expiry_seconds
            $expiresAt = $firstTransaction->created_at->addSeconds($expirySeconds);

            // Kiểm tra đã hết hạn chưa
            if ($expiresAt > now()) {
                continue; // Chưa hết hạn
            }

            // Kiểm tra xem có giao dịch thành công nào không
            $hasSuccessTransaction = $order->vnpayTransactions
                ->where('status', 'success')
                ->isNotEmpty();

            if ($hasSuccessTransaction) {
                continue; // Đã có giao dịch thành công
            }

            try {
                DB::beginTransaction();

                // Cập nhật tất cả giao dịch pending thành failed
                $order->vnpayTransactions()
                    ->where('status', 'pending')
                    ->update([
                        'status' => 'failed',
                        'vnp_response_code' => '11' // 11 = Đã hết hạn
                    ]);

                // Hủy đơn hàng
                $this->cancelOrder($order, 'VNPay');

                $cancelledCount++;

                DB::commit();

                $this->line("  - Đã hủy đơn hàng {$order->code} (VNPay hết hạn sau {$expiryMinutes} phút)");

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Lỗi khi hủy đơn hàng VNPay hết hạn', [
                    'order_id' => $order->id,
                    'order_code' => $order->code,
                    'error' => $e->getMessage(),
                ]);
                $this->error("  - Lỗi khi hủy đơn hàng {$order->code}: {$e->getMessage()}");
            }
        }

        $this->info("  Đã kiểm tra {$orders->count()} đơn hàng VNPay, hủy {$cancelledCount} đơn hết hạn.");

        return $cancelledCount;
    }

    /**
     * Hủy đơn hàng và hoàn lại số lượng sản phẩm
     */
    protected function cancelOrder(Order $order, string $paymentMethod): void
    {
        $reason = "Đơn hàng đã bị hủy do chưa thanh toán trong thời gian quy định ({$paymentMethod})";

        // Cập nhật trạng thái đơn hàng
        $order->update([
            'status' => 'cancelled',
            'notes' => ($order->notes ? $order->notes . "\n" : '') . "[Tự động hủy] {$reason}",
        ]);

        // Hoàn lại số lượng sản phẩm
        foreach ($order->items as $item) {
            if ($item->product) {
                $item->product->increment('quantity', $item->quantity);
                // Giảm số lượng đã bán (nếu đã tăng trước đó)
                if ($item->product->sold_count >= $item->quantity) {
                    $item->product->decrement('sold_count', $item->quantity);
                }
            }
        }

        // Gửi email thông báo hủy đơn hàng
        try {
            $this->mailService->sendOrderCancelled($order, $reason);
        } catch (\Exception $e) {
            Log::warning("Không thể gửi email hủy đơn hàng {$order->code}: {$e->getMessage()}");
        }

        Log::info("Đã tự động hủy đơn hàng do hết hạn thanh toán", [
            'order_id' => $order->id,
            'order_code' => $order->code,
            'payment_method' => $paymentMethod,
            'reason' => $reason,
        ]);
    }
}
