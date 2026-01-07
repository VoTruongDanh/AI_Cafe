<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\User;
use App\Models\Warranty;
use Illuminate\Database\Seeder;

class WarrantySeeder extends Seeder
{
    /**
     * Tạo dữ liệu mẫu cho bảo hành
     */
    public function run(): void
    {
        // Lấy đơn hàng bất kỳ (ưu tiên completed, delivered)
        $completedOrders = Order::whereIn('status', ['completed', 'delivered', 'processing'])
            ->with('items.product')
            ->limit(10)
            ->get();

        if ($completedOrders->isEmpty()) {
            $this->command->warn('⚠️  Không có đơn hàng nào. Chạy OrderSeeder trước.');
            return;
        }

        // Lấy admin để làm người xử lý
        $admin = User::where('role', 'admin')->first();

        if (!$admin) {
            $this->command->warn('⚠️  Không có admin. Chạy UserSeeder trước.');
            return;
        }

        $count = 0;
        $statuses = ['pending', 'processing', 'repaired', 'waiting_for_customer', 'completed'];
        $results = ['repaired', 'replaced', 'refunded'];

        foreach ($completedOrders as $order) {
            // Tạo phiếu bảo hành cho từng sản phẩm trong đơn
            foreach ($order->items as $item) {
                $warrantyMonths = $item->product->warranty_months ?? 12;
                $issuedAt = now()->subDays(rand(1, 30));
                $startDate = $issuedAt;
                $endDate = $startDate->copy()->addMonths($warrantyMonths);
                
                // Random trạng thái
                $status = $statuses[array_rand($statuses)];
                $result = null;
                
                // Nếu trạng thái là completed, thêm kết quả
                if ($status === 'completed') {
                    $result = $results[array_rand($results)];
                }

                Warranty::create([
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'user_id' => $order->user_id,
                    'processed_by' => $admin->id,
                    'supplier_id' => $item->product->supplier_id ?? null,
                    'code' => Warranty::generateCode(),
                    'status' => $status,
                    'result' => $result,
                    'issued_at' => $issuedAt,
                    'expires_at' => $endDate,
                    'start_date' => $startDate,
                    'warranty_months' => $warrantyMonths,
                    'end_date' => $endDate,
                    'notes' => 'Phiếu bảo hành cho ' . $item->product->name,
                ]);

                $count++;
            }
        }

        $this->command->info("✅ Đã tạo {$count} phiếu bảo hành mẫu!");
    }
}
