<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CancelExpiredOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:cancel-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tự động hủy các đơn hàng chưa thanh toán quá hạn';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🔍 Đang kiểm tra đơn hàng hết hạn...');

        // Tìm các đơn hàng:
        // - Trạng thái pending
        // - Có payment_expires_at
        // - Đã quá thời gian hết hạn
        $expiredOrders = Order::where('status', 'pending')
            ->whereNotNull('payment_expires_at')
            ->where('payment_expires_at', '<', now())
            ->get();

        if ($expiredOrders->isEmpty()) {
            $this->info('✅ Không có đơn hàng nào hết hạn');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($expiredOrders as $order) {
            DB::beginTransaction();
            try {
                // Hoàn trả stock cho các sản phẩm
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->increment('stock_quantity', $item->quantity);
                    }
                }

                // Cập nhật trạng thái đơn hàng
                $order->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'Hết thời gian chờ thanh toán',
                    'cancelled_at' => now(),
                ]);

                DB::commit();
                $count++;
                
                $this->line("  ❌ Đã hủy đơn #{$order->order_number} - Hết hạn lúc {$order->payment_expires_at}");
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("  ⚠️  Lỗi khi hủy đơn #{$order->order_number}: {$e->getMessage()}");
            }
        }

        $this->info("✅ Đã hủy {$count}/{$expiredOrders->count()} đơn hàng hết hạn");
        return Command::SUCCESS;
    }
}
