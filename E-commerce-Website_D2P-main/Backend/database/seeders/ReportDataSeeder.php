<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ReportDataSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        if ($customers->count() < 20) {
            User::factory()->count(20 - $customers->count())->create(['role' => 'customer', 'is_active' => true]);
            $customers = User::where('role', 'customer')->get();
        }

        $admin = User::where('role', 'admin')->first();
        $paymentMethods = PaymentMethod::all();
        $products = Product::all();

        if ($products->isEmpty()) {
            $this->command->error('Không có sản phẩm! Chạy ProductSeeder trước.');
            return;
        }

        // Tạo đơn hàng cho 12 tháng gần nhất (từ 11 tháng trước đến tháng hiện tại)
        $now = Carbon::now();
        $orderCount = 0;

        for ($monthIndex = 0; $monthIndex < 12; $monthIndex++) {
            $month = $now->copy()->subMonths(11 - $monthIndex); // 11 tháng trước -> tháng hiện tại
            $startOfMonth = $month->copy()->startOfMonth();
            $daysInMonth = $month->daysInMonth;
            $ordersInMonth = rand(15, 35); // 15-35 đơn/tháng

            for ($i = 0; $i < $ordersInMonth; $i++) {
                $orderCount++;
                $customer = $customers->random();
                $paymentMethod = $paymentMethods->random();

                // Ngày đặt hàng ngẫu nhiên trong tháng
                $orderDate = $startOfMonth->copy()->addDays(rand(0, $daysInMonth - 1))
                    ->setTime(rand(8, 20), rand(0, 59));

                // Số lượng sản phẩm trong đơn: 1-4 sản phẩm
                $itemCount = rand(1, 4);
                $orderProducts = $products->random($itemCount);

                $subtotal = 0;
                $items = [];

                foreach ($orderProducts as $product) {
                    $quantity = rand(1, 3);
                    $unitPrice = $product->price;
                    $discountAmount = rand(0, 1) ? $unitPrice * 0.05 * $quantity : 0; // 5% discount ngẫu nhiên
                    $lineTotal = ($unitPrice * $quantity) - $discountAmount;

                    $subtotal += $lineTotal;
                    $items[] = [
                        'product' => $product,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'discount_amount' => $discountAmount,
                        'line_total' => $lineTotal
                    ];
                }

                $shippingFee = $subtotal > 5000000 ? 0 : rand(20000, 50000);
                $discountTotal = collect($items)->sum('discount_amount');
                $grandTotal = $subtotal;

                // 90% đơn hoàn thành, 10% các trạng thái khác
                $statusRand = rand(1, 100);
                if ($statusRand <= 90) {
                    $status = rand(0, 1) ? 'completed' : 'delivered';
                    $paymentStatus = 'paid';
                } else {
                    $statuses = ['pending', 'confirmed', 'cancelled'];
                    $status = $statuses[array_rand($statuses)];
                    $paymentStatus = $status === 'cancelled' ? 'unpaid' : ($status === 'pending' ? 'unpaid' : 'paid');
                }

                $order = Order::create([
                    'code' => 'ORD-' . $orderDate->format('Ymd') . '-' . str_pad($orderCount, 4, '0', STR_PAD_LEFT),
                    'user_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'customer_phone' => $customer->phone ?? '0' . rand(900000000, 999999999),
                    'customer_email' => $customer->email,
                    'shipping_address_line' => rand(1, 999) . ' Đường ' . ['Nguyễn Văn Linh', 'Lê Văn Việt', 'Võ Văn Ngân', 'Trần Hưng Đạo'][rand(0, 3)],
                    'shipping_city' => ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'][rand(0, 3)],
                    'status' => $status,
                    'payment_status' => $paymentStatus,
                    'payment_method_id' => $paymentMethod->id,
                    'processed_by' => $admin?->id,
                    'subtotal' => $subtotal,
                    'discount_total' => $discountTotal,
                    'tax_total' => 0,
                    'grand_total' => $grandTotal,
                    'channel' => rand(0, 1) ? 'online' : 'pos',
                    'placed_at' => $orderDate,
                    'paid_at' => $paymentStatus === 'paid' ? $orderDate->copy()->addHours(rand(1, 4)) : null,
                    'notes' => rand(0, 1) ? 'Giao hàng giờ hành chính' : null,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);

                foreach ($items as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product']->id,
                        'product_name' => $item['product']->name,
                        'sku' => $item['product']->sku,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => $item['discount_amount'],
                        'line_total' => $item['line_total'],
                    ]);

                    // Trừ quantity khi đơn hàng completed hoặc delivered
                    // Chỉ trừ nếu còn đủ số lượng
                    if (in_array($status, ['completed', 'delivered'])) {
                        $product = $item['product']->fresh();
                        if ($product && $product->quantity >= $item['quantity']) {
                            $product->decrement('quantity', $item['quantity']);
                        }
                    }
                }
            }

            $this->command->info("✓ Tạo {$ordersInMonth} đơn hàng cho tháng " . $month->format('m/Y'));
        }

        $this->command->info("✓ Tổng cộng: {$orderCount} đơn hàng");
    }
}
