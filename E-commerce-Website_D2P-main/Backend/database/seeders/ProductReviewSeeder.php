<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'customer')->limit(10)->get();
        $products = Product::limit(20)->get();

        if ($users->isEmpty() || $products->isEmpty()) {
            $this->command->warn('Cần có users và products trước khi seed reviews');
            return;
        }

        $reviews = [
            [
                'rating' => 5,
                'title' => 'Sản phẩm tuyệt vời!',
                'comment' => 'Máy chạy rất mượt, thiết kế đẹp, đóng gói cẩn thận. Rất hài lòng với sản phẩm này.',
                'is_verified_purchase' => true,
                'helpful_count' => 15,
            ],
            [
                'rating' => 5,
                'title' => 'Chất lượng tốt, giá hợp lý',
                'comment' => 'Đã dùng được 1 tuần, sản phẩm hoạt động ổn định. Shipper giao hàng nhanh, nhiệt tình.',
                'is_verified_purchase' => true,
                'helpful_count' => 8,
            ],
            [
                'rating' => 5,
                'title' => 'Tuyệt vời, quá hài lòng',
                'comment' => 'Sản phẩm rất tốt, hoạt động mượt mà. Thiết kế đẹp, chất lượng cao cấp.',
                'is_verified_purchase' => true,
                'helpful_count' => 5,
            ],
            [
                'rating' => 5,
                'title' => 'Rất đáng mua',
                'comment' => 'Mình đã so sánh nhiều nơi và quyết định mua ở đây. Không hối hận! Sản phẩm chính hãng, giá tốt.',
                'is_verified_purchase' => true,
                'helpful_count' => 12,
            ],
            [
                'rating' => 5,
                'title' => 'Xuất sắc, vượt mong đợi',
                'comment' => 'Sản phẩm vượt xa mong đợi. Chất lượng tuyệt vời, đáng từng đồng bỏ ra.',
                'is_verified_purchase' => true,
                'helpful_count' => 2,
            ],
            [
                'rating' => 5,
                'title' => 'Cực kỳ hài lòng',
                'comment' => 'Lần đầu mua hàng online mà được phục vụ tốt như vậy. Sản phẩm đúng mô tả, ship nhanh.',
                'is_verified_purchase' => true,
                'helpful_count' => 20,
            ],
            [
                'rating' => 5,
                'title' => 'Sản phẩm hoàn hảo',
                'comment' => 'Dùng thử cảm giác rất tuyệt vời, chất lượng cao cấp. Rất đáng tiền!',
                'is_verified_purchase' => true,
                'helpful_count' => 6,
            ],
            [
                'rating' => 5,
                'title' => 'Xuất sắc!',
                'comment' => 'Không có gì để chê. Sản phẩm hoàn hảo từ chất lượng đến dịch vụ.',
                'is_verified_purchase' => true,
                'helpful_count' => 18,
            ],
            [
                'rating' => 5,
                'title' => 'Đáng giá tiền',
                'comment' => 'Với mức giá này thì sản phẩm quá ok. Mình rất recommend cho các bạn.',
                'is_verified_purchase' => true,
                'helpful_count' => 10,
            ],
            [
                'rating' => 5,
                'title' => 'Sẽ quay lại mua tiếp',
                'comment' => 'Dùng rất hài lòng, sẽ giới thiệu cho bạn bè và gia đình. Shop phục vụ nhiệt tình.',
                'is_verified_purchase' => true,
                'helpful_count' => 14,
            ],
            [
                'rating' => 5,
                'title' => 'Chính hãng 100%',
                'comment' => 'Sản phẩm chính hãng, đóng gói đẹp, giao hàng nhanh. Rất uy tín!',
                'is_verified_purchase' => true,
                'helpful_count' => 9,
            ],
            [
                'rating' => 5,
                'title' => 'Quá tuyệt vời',
                'comment' => 'Chất lượng vượt trội, hiệu năng mạnh mẽ. Đáng đồng tiền bát gạo!',
                'is_verified_purchase' => true,
                'helpful_count' => 11,
            ],
        ];

        foreach ($products as $product) {
            // Random 3-7 reviews per product
            $numReviews = rand(3, 7);
            
            for ($i = 0; $i < $numReviews; $i++) {
                $reviewData = $reviews[array_rand($reviews)];
                $user = $users->random();

                // Check if user already reviewed this product
                $exists = ProductReview::where('product_id', $product->id)
                    ->where('user_id', $user->id)
                    ->exists();

                if (!$exists) {
                    ProductReview::create([
                        'product_id' => $product->id,
                        'user_id' => $user->id,
                        'rating' => $reviewData['rating'],
                        'title' => $reviewData['title'],
                        'comment' => $reviewData['comment'],
                        'is_verified_purchase' => $reviewData['is_verified_purchase'],
                        'helpful_count' => $reviewData['helpful_count'],
                        'is_approved' => true,
                        'approved_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Product reviews seeded successfully!');
    }
}
