<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Tự động hủy các đơn hàng thanh toán QR (MoMo, Bank Transfer) đã hết hạn
        // Chạy mỗi phút để đảm bảo đơn hàng được hủy ngay khi hết hạn
        $schedule->command('orders:cancel-expired-payments')
            ->everyMinute()
            ->withoutOverlapping()
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/cancel-expired-payments.log'));

        // ✅ Tự động hủy đơn hàng chưa thanh toán quá hạn (15 phút)
        $schedule->command('orders:cancel-expired')
            ->everyMinute()
            ->withoutOverlapping()
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/cancel-expired-orders.log'));
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
