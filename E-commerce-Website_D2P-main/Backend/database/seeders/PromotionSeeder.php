<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PromotionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $promotions = [
            // Khuyến mãi cho Website
            [
                'name' => 'FLASH SALE - GIỜ VÀNG GIÁ SỐC',
                'code' => 'FLASHSALE',
                'description' => 'Giảm giá sốc trong giờ vàng - Số lượng có hạn!',
                'promotion_type' => 'percentage',
                'promotion_category' => 'flash_sale',
                'value' => 30,
                'max_discount_value' => 5000000,
                'min_order_value' => 0,
                'usage_limit' => 100,
                'applies_to' => ['type' => 'flash_sale'],
                'channels' => ['web', 'online'],
                'metadata' => ['badge' => 'FLASH SALE', 'display_color' => '#FF0000', 'countdown_hours' => 2],
                'is_stackable' => false,
                'is_flash_sale' => true,
                'is_active' => true,
                'starts_at' => Carbon::now(),
                'ends_at' => Carbon::now()->addDays(1),
            ],
            [
                'name' => 'Giảm 10% mùa hè',
                'code' => 'SUMMER10',
                'description' => 'Giảm 10% cho các sản phẩm TV và Laptop trong tháng này.',
                'promotion_type' => 'percentage',
                'promotion_category' => 'special_offer',
                'value' => 10,
                'max_discount_value' => 2000000,
                'min_order_value' => 5000000,
                'usage_limit' => 500,
                'applies_to' => ['type' => 'category', 'slugs' => ['tv', 'laptop']],
                'channels' => ['web', 'online'],
                'metadata' => ['badge' => 'HOT', 'display_color' => '#FF6B6B'],
                'is_stackable' => false,
                'is_active' => true,
                'starts_at' => Carbon::now()->subDays(7),
                'ends_at' => Carbon::now()->addDays(30),
            ],
            [
                'name' => 'Voucher 500K đơn từ 12 triệu',
                'code' => 'SAVE500',
                'description' => 'Giảm 500.000đ cho đơn hàng từ 12.000.000đ trở lên.',
                'promotion_type' => 'fixed',
                'promotion_category' => 'coupon',
                'value' => 500000,
                'max_discount_value' => 500000,
                'min_order_value' => 12000000,
                'usage_limit' => 300,
                'applies_to' => ['type' => 'order_total'],
                'channels' => ['web', 'online'],
                'metadata' => ['badge' => 'Voucher', 'display_color' => '#2F80ED'],
                'is_stackable' => true,
                'is_active' => true,
                'starts_at' => Carbon::now()->subDays(3),
                'ends_at' => Carbon::now()->addDays(45),
            ],
        ];

        $promotionInstances = collect();

        foreach ($promotions as $data) {
            $promotion = Promotion::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
            $promotionInstances->put($promotion->code, $promotion);
        }

        $promotionProductMapping = [
            'FLASHSALE' => [
                ['sku' => 'TV-SAM-55AU7700', 'priority' => 1],
                ['sku' => 'REF-SAM-RF68A9140B1', 'priority' => 2],
                ['sku' => 'LAP-ASU-A1505VA', 'priority' => 3],
                ['sku' => 'WM-SAM-WW12TP44', 'priority' => 4],
            ],
            'SUMMER10' => [
                // ✅ Loại bỏ TV-SAM-55AU7700 và LAP-ASU-A1505VA vì đã có trong FLASHSALE
                ['sku' => 'TV-LG-50UR7550', 'priority' => 1],
                ['sku' => 'TV-SON-43X75K', 'priority' => 2],
                ['sku' => 'LAP-DEL-3530', 'priority' => 3],
            ],
            'SAVE500' => [
                ['sku' => 'REF-SAM-RF68A9140B1', 'priority' => 1],
                ['sku' => 'REF-PAN-NRDZ601', 'priority' => 2],
                ['sku' => 'WM-SAM-WW12TP44', 'priority' => 3],
            ],
        ];

        foreach ($promotionProductMapping as $code => $items) {
            $promotion = $promotionInstances->get($code);

            if (!$promotion) {
                continue;
            }

            foreach ($items as $item) {
                $product = Product::where('sku', $item['sku'])->first();

                if (!$product) {
                    continue;
                }

                $promotion->products()->syncWithoutDetaching([
                    $product->id => ['priority' => $item['priority']],
                ]);
            }
        }
    }
}
