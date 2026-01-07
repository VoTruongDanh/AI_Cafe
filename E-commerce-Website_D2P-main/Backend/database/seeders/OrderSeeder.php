<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\ReturnRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $customers = User::where('role', 'customer')->take(3)->get();

        if ($customers->isEmpty()) {
            $customers = collect([
                User::factory()->create(['role' => 'customer', 'is_active' => true]),
            ]);
        }

        $paymentCod = PaymentMethod::where('code', 'COD')->first();
        $paymentVnpay = PaymentMethod::where('code', 'VNPAY')->first();
        $summerPromotion = Promotion::where('code', 'SUMMER10')->first();
        $shippingPromotion = Promotion::where('code', 'FREESHIP')->first();

        $orders = [
            [
                'code' => 'ORD-20251008-0001',
                'customer' => $customers[0] ?? $customers->first(),
                'payment_method' => $paymentVnpay,
                'promotion' => $summerPromotion,
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'shipping_city' => 'Hồ Chí Minh',
                'shipping_address_line' => '789 Nguyễn Văn Linh',
                'tax_total' => 0,
                'items' => [
                    [
                        'sku' => 'TV-SAM-55AU7700',
                        'quantity' => 1,
                        'unit_price' => 11990000,
                        'discount_amount' => 1199000,
                    ],
                    [
                        'sku' => 'LAP-ASU-A1505VA',
                        'quantity' => 1,
                        'unit_price' => 17990000,
                        'discount_amount' => 1799000,
                    ],
                ],
                'notes' => 'Giao buổi sáng, hỗ trợ lắp đặt TV.',
                'placed_days_ago' => 6,
                'paid_days_ago' => 5,
            ],
            [
                'code' => 'ORD-20250930-0002',
                'customer' => $customers[1] ?? $customers->first(),
                'payment_method' => $paymentCod,
                'promotion' => $shippingPromotion,
                'status' => 'delivered',
                'payment_status' => 'paid',
                'shipping_city' => 'Hà Nội',
                'shipping_address_line' => '12 Trần Thái Tông',
                'tax_total' => 0,
                'items' => [
                    [
                        'sku' => 'REF-PAN-NRDZ601',
                        'quantity' => 1,
                        'unit_price' => 19990000,
                        'discount_amount' => 0,
                    ],
                    [
                        'sku' => 'WM-LG-FV1411S4P',
                        'quantity' => 1,
                        'unit_price' => 11490000,
                        'discount_amount' => 0,
                    ],
                ],
                'notes' => 'Liên hệ trước 30 phút khi giao hàng.',
                'placed_days_ago' => 9,
                'paid_days_ago' => 8,
            ],
        ];

        foreach ($orders as $orderData) {
            /** @var \App\Models\User|null $customer */
            $customer = $orderData['customer'];

            $items = collect($orderData['items']);
            $subtotal = $items->sum(fn ($item) => $item['unit_price'] * $item['quantity']);
            $discountTotal = $items->sum(fn ($item) => $item['discount_amount']);
            $taxTotal = $orderData['tax_total'];
            $grandTotal = $subtotal - $discountTotal + $taxTotal;

            $order = Order::updateOrCreate(
                ['code' => $orderData['code']],
                [
                    'user_id' => $customer?->id,
                    'customer_name' => $customer?->name ?? 'Khách lẻ',
                    'customer_phone' => $customer?->phone ?? '0905 678 910',
                    'customer_email' => $customer?->email,
                    'shipping_address_line' => $orderData['shipping_address_line'],
                    'shipping_city' => $orderData['shipping_city'],
                    'status' => $orderData['status'],
                    'payment_status' => $orderData['payment_status'],
                    'payment_method_id' => $orderData['payment_method']?->id,
                    'promotion_id' => $orderData['promotion']?->id,
                    'processed_by' => $admin?->id,
                    'subtotal' => $subtotal,
                    'discount_total' => $discountTotal,
                    'tax_total' => $taxTotal,
                    'grand_total' => $grandTotal,
                    'channel' => 'online',
                    'placed_at' => Carbon::now()->subDays($orderData['placed_days_ago'])->setTime(9, 30),
                    'paid_at' => Carbon::now()->subDays($orderData['paid_days_ago'])->setTime(10, 45),
                    'notes' => $orderData['notes'],
                ]
            );

            $items->each(function (array $item, int $index) use ($order) {
                $product = Product::where('sku', $item['sku'])->first();
                $lineTotal = $item['unit_price'] * $item['quantity'] - $item['discount_amount'];

                OrderItem::updateOrCreate(
                    [
                        'order_id' => $order->id,
                        'sku' => $item['sku'],
                    ],
                    [
                        'product_id' => $product?->id,
                        'product_name' => $product?->name ?? $item['sku'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => $item['discount_amount'],
                        'line_total' => $lineTotal,
                        'metadata' => [
                            'line_index' => $index + 1,
                        ],
                    ]
                );
            });

            if ($order->code === 'ORD-20250930-0002') {
                $firstItem = $order->items()->first();

                if ($firstItem) {
                    ReturnRequest::updateOrCreate(
                        [
                            'order_id' => $order->id,
                            'order_item_id' => $firstItem->id,
                        ],
                        [
                            'user_id' => $customer?->id,
                            'reason' => 'Khách muốn đổi sang mẫu dung tích lớn hơn.',
                            'status' => 'pending',
                            'requested_quantity' => 1,
                            'approved_quantity' => null,
                            'refund_amount' => $firstItem->unit_price,
                            'resolution' => null,
                            'processed_by' => $admin?->id,
                            'requested_at' => Carbon::now()->subDays(5),
                            'resolved_at' => null,
                            'notes' => 'Chờ xác nhận kho về tình trạng sản phẩm.',
                        ]
                    );
                }
            }
        }
    }
}
