<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\ProductQuestion;
use App\Models\ReturnRequest;
use App\Models\Warranty;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CompleteDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->createProductReviews();
        $this->createProductQuestions();
        $this->createReturnRequests();
        $this->createWarranties();
    }

    private function createProductReviews()
    {
        $products = Product::all();
        $customers = User::where('role', 'customer')->get();
        $reviewCount = 0;

        // Tạo 50-100 đánh giá
        foreach ($products->random(min(30, $products->count())) as $product) {
            $reviewsForProduct = rand(1, 5);

            for ($i = 0; $i < $reviewsForProduct; $i++) {
                $customer = $customers->random();
                $rating = rand(3, 5); // Chủ yếu đánh giá tốt
                $createdAt = Carbon::now()->subDays(rand(1, 180));

                ProductReview::create([
                    'product_id' => $product->id,
                    'user_id' => $customer->id,
                    'rating' => $rating,
                    'title' => $this->getReviewTitle($rating),
                    'comment' => $this->getReviewComment($rating),
                    'is_verified_purchase' => rand(0, 1),
                    'is_approved' => true,
                    'helpful_count' => rand(0, 20),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
                $reviewCount++;
            }
        }

        $this->command->info("✓ Tạo {$reviewCount} đánh giá sản phẩm");
    }

    private function createProductQuestions()
    {
        $products = Product::all();
        $customers = User::where('role', 'customer')->get();
        $admin = User::where('role', 'admin')->first();
        $questionCount = 0;

        // Tạo 30-50 câu hỏi
        foreach ($products->random(min(20, $products->count())) as $product) {
            $questionsForProduct = rand(1, 3);

            for ($i = 0; $i < $questionsForProduct; $i++) {
                $customer = $customers->random();
                $createdAt = Carbon::now()->subDays(rand(1, 90));
                $hasAnswer = rand(0, 1);

                ProductQuestion::create([
                    'product_id' => $product->id,
                    'user_id' => $customer->id,
                    'question' => $this->getQuestion(),
                    'answer' => $hasAnswer ? $this->getAnswer() : null,
                    'answered_by' => $hasAnswer ? $admin->id : null,
                    'answered_at' => $hasAnswer ? $createdAt->copy()->addDays(rand(1, 3)) : null,
                    'is_approved' => true,
                    'helpful_count' => rand(0, 10),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
                $questionCount++;
            }
        }

        $this->command->info("✓ Tạo {$questionCount} câu hỏi sản phẩm");
    }

    private function createReturnRequests()
    {
        $orders = Order::whereIn('status', ['completed', 'delivered'])
            ->with('items')
            ->get();
        $returnCount = 0;

        // 5% đơn hàng có yêu cầu trả hàng
        foreach ($orders->random(min(15, $orders->count())) as $order) {
            $item = $order->items->random();
            $createdAt = $order->created_at->copy()->addDays(rand(3, 15));

            $statuses = ['pending', 'approved', 'rejected', 'completed'];
            $status = $statuses[array_rand($statuses)];

            ReturnRequest::create([
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'user_id' => $order->user_id,
                'reason' => $this->getReturnReason(),
                'status' => $status,
                'requested_quantity' => $item->quantity,
                'approved_quantity' => in_array($status, ['approved', 'completed']) ? $item->quantity : null,
                'refund_amount' => in_array($status, ['approved', 'completed']) ? $item->line_total : null,
                'resolution' => in_array($status, ['approved', 'completed', 'rejected']) ? $this->getResolution($status) : null,
                'processed_by' => in_array($status, ['approved', 'completed', 'rejected']) ? 1 : null,
                'requested_at' => $createdAt,
                'resolved_at' => in_array($status, ['approved', 'completed', 'rejected']) ? $createdAt->copy()->addDays(rand(1, 5)) : null,
                'notes' => 'Yêu cầu trả hàng #' . ($returnCount + 1),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $returnCount++;
        }

        $this->command->info("✓ Tạo {$returnCount} yêu cầu trả hàng");
    }

    private function createWarranties()
    {
        $faker = \Faker\Factory::create('vi_VN');
        $orders = Order::whereIn('status', ['completed', 'delivered'])
            ->with('items.product')
            ->get();
        $warrantyCount = 0;

        // 30% đơn hàng có phiếu bảo hành
        foreach ($orders->random(min(90, $orders->count())) as $order) {
            // Chỉ tạo warranty cho sản phẩm có warranty_months > 0
            $itemsToWarranty = $order->items->filter(function ($item) {
                return $item->product && $item->product->warranty_months > 0;
            });

            if ($itemsToWarranty->isEmpty()) {
                continue;
            }

            foreach ($itemsToWarranty as $item) {
                $createdAt = $order->created_at->copy()->addDays(rand(1, 7));
                $startDate = $createdAt;
                $endDate = $startDate->copy()->addMonths($item->product->warranty_months);

                // Random status cho dữ liệu mẫu
                $statuses = ['pending', 'processing', 'repaired', 'waiting_for_customer', 'completed', 'denied', 'returned'];
                $status = $faker->randomElement($statuses);
                $result = in_array($status, ['completed', 'returned']) ? $faker->randomElement(['repaired', 'replaced', 'refunded']) : null;

                Warranty::create([
                    'code' => 'WRT-' . $createdAt->format('Ymd') . '-' . str_pad($warrantyCount + 1, 4, '0', STR_PAD_LEFT),
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'start_date' => $startDate,
                    'warranty_months' => $item->product->warranty_months,
                    'end_date' => $endDate,
                    'status' => $status,
                    'result' => $result,
                    'notes' => 'Bảo hành ' . $item->product->warranty_months . ' tháng cho ' . $item->product->name,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $warrantyCount++;
            }
        }

        $this->command->info("✓ Tạo {$warrantyCount} phiếu bảo hành");
    }

    private function getReviewTitle($rating)
    {
        $titles = [
            5 => ['Sản phẩm tuyệt vời!', 'Rất hài lòng', 'Chất lượng xuất sắc', 'Đáng đồng tiền'],
            4 => ['Sản phẩm tốt', 'Khá ổn', 'Đáng mua', 'Chất lượng tốt'],
            3 => ['Tạm được', 'Bình thường', 'Cũng ổn', 'Chấp nhận được'],
        ];
        return $titles[$rating][array_rand($titles[$rating])];
    }

    private function getReviewComment($rating)
    {
        $comments = [
            5 => 'Sản phẩm rất tốt, đúng như mô tả. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop lâu dài.',
            4 => 'Sản phẩm tốt, chất lượng ổn. Có một vài điểm nhỏ cần cải thiện nhưng nhìn chung hài lòng.',
            3 => 'Sản phẩm tạm được, giá hơi cao so với chất lượng. Giao hàng đúng hẹn.',
        ];
        return $comments[$rating];
    }

    private function getQuestion()
    {
        $questions = [
            'Sản phẩm này còn hàng không ạ?',
            'Bảo hành như thế nào?',
            'Có ship COD không?',
            'Sản phẩm có màu nào khác không?',
            'Thời gian giao hàng bao lâu?',
        ];
        return $questions[array_rand($questions)];
    }

    private function getAnswer()
    {
        $answers = [
            'Dạ sản phẩm còn hàng ạ. Quý khách đặt hàng ngay để được giao sớm nhất.',
            'Sản phẩm được bảo hành chính hãng theo quy định của nhà sản xuất.',
            'Dạ shop có hỗ trợ COD ạ.',
            'Hiện tại sản phẩm có các màu như trong mô tả ạ.',
            'Thời gian giao hàng từ 2-5 ngày tùy khu vực ạ.',
        ];
        return $answers[array_rand($answers)];
    }

    private function getReturnReason()
    {
        $reasons = [
            'Sản phẩm bị lỗi',
            'Không đúng mô tả',
            'Muốn đổi sang sản phẩm khác',
            'Giao nhầm sản phẩm',
            'Sản phẩm bị hư hỏng trong quá trình vận chuyển',
        ];
        return $reasons[array_rand($reasons)];
    }

    private function getResolution($status)
    {
        if ($status === 'rejected') {
            return 'Sản phẩm không đủ điều kiện trả hàng';
        }
        return 'Đã xử lý và hoàn tiền cho khách hàng';
    }
}
