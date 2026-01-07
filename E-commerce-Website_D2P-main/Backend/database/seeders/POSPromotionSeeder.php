<?php

namespace Database\Seeders;

use App\Models\Promotion;
use Illuminate\Database\Seeder;

class POSPromotionSeeder extends Seeder
{
    /**
     * Tạo các mã khuyến mãi mẫu cho bán hàng offline tại cửa hàng
     */
    public function run(): void
    {
        $promotions = [
            [
                'name' => 'Giảm 5% đơn tại cửa hàng',
                'code' => 'POS5',
                'description' => 'Giảm 5% cho tất cả đơn hàng mua trực tiếp tại cửa hàng',
                'promotion_type' => 'percentage',
                'value' => 5,
                'max_discount_value' => 500000, // Tối đa 500k
                'min_order_value' => 1000000, // Đơn tối thiểu 1 triệu
                'usage_limit' => null, // Không giới hạn
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline'],
                'starts_at' => now(),
                'ends_at' => now()->addMonths(6),
            ],
            [
                'name' => 'Giảm 10% đơn từ 5 triệu',
                'code' => 'POS10',
                'description' => 'Giảm 10% cho đơn hàng từ 5 triệu trở lên tại cửa hàng',
                'promotion_type' => 'percentage',
                'value' => 10,
                'max_discount_value' => 1000000, // Tối đa 1 triệu
                'min_order_value' => 5000000, // Đơn tối thiểu 5 triệu
                'usage_limit' => null,
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline'],
                'starts_at' => now(),
                'ends_at' => now()->addMonths(6),
            ],
            [
                'name' => 'Giảm 15% đơn từ 10 triệu',
                'code' => 'POS15',
                'description' => 'Giảm 15% cho đơn hàng từ 10 triệu trở lên tại cửa hàng',
                'promotion_type' => 'percentage',
                'value' => 15,
                'max_discount_value' => 2000000, // Tối đa 2 triệu
                'min_order_value' => 10000000, // Đơn tối thiểu 10 triệu
                'usage_limit' => null,
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline'],
                'starts_at' => now(),
                'ends_at' => now()->addMonths(6),
            ],
            [
                'name' => 'Giảm 200k đơn từ 3 triệu',
                'code' => 'CUAHANG200K',
                'description' => 'Giảm trực tiếp 200.000đ cho đơn từ 3 triệu tại cửa hàng',
                'promotion_type' => 'fixed',
                'value' => 200000,
                'max_discount_value' => null,
                'min_order_value' => 3000000,
                'usage_limit' => 100, // Giới hạn 100 lượt
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline'],
                'starts_at' => now(),
                'ends_at' => now()->addMonths(3),
            ],
            [
                'name' => 'Giảm 500k đơn từ 8 triệu',
                'code' => 'CUAHANG500K',
                'description' => 'Giảm trực tiếp 500.000đ cho đơn từ 8 triệu tại cửa hàng',
                'promotion_type' => 'fixed',
                'value' => 500000,
                'max_discount_value' => null,
                'min_order_value' => 8000000,
                'usage_limit' => 50, // Giới hạn 50 lượt
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline'],
                'starts_at' => now(),
                'ends_at' => now()->addMonths(3),
            ],
            [
                'name' => 'Khách VIP - Giảm 20%',
                'code' => 'VIP20',
                'description' => 'Mã dành riêng cho khách VIP, giảm 20% không giới hạn',
                'promotion_type' => 'percentage',
                'value' => 20,
                'max_discount_value' => 5000000, // Tối đa 5 triệu
                'min_order_value' => null, // Không yêu cầu
                'usage_limit' => null,
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline', 'online', 'all'],
                'starts_at' => now(),
                'ends_at' => now()->addYear(),
            ],
            [
                'name' => 'Nhân viên - Giảm 30%',
                'code' => 'STAFF30',
                'description' => 'Mã giảm giá dành cho nhân viên công ty',
                'promotion_type' => 'percentage',
                'value' => 30,
                'max_discount_value' => 3000000,
                'min_order_value' => null,
                'usage_limit' => null,
                'is_active' => true,
                'is_stackable' => false,
                'channels' => ['pos', 'offline'],
                'starts_at' => now(),
                'ends_at' => now()->addYear(),
            ],
        ];

        foreach ($promotions as $data) {
            Promotion::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }

        $this->command->info('✅ Đã tạo ' . count($promotions) . ' mã khuyến mãi POS mẫu!');
    }
}
