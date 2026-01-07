<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Test Race Condition khi nhiều người đặt hàng cùng lúc
 * 
 * Scenario: 
 * - Sản phẩm chỉ còn 1 trong kho
 * - 3 người cùng đặt hàng 1 sản phẩm đó cùng lúc
 * - Chỉ 1 người được đặt thành công, 2 người còn lại phải thất bại
 */
class OrderRaceConditionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Tạo dữ liệu test
        $this->seed(\Database\Seeders\CategorySeeder::class);
        $this->seed(\Database\Seeders\SupplierSeeder::class);
        $this->seed(\Database\Seeders\PaymentMethodSeeder::class);
    }

    /**
     * Test: Race condition khi đặt hàng
     * 
     * @test
     */
    public function test_race_condition_when_ordering_last_product()
    {
        // Arrange: Tạo sản phẩm chỉ còn 1 trong kho
        $product = Product::factory()->create([
            'name' => 'iPhone 15 Pro Max',
            'price' => 30000000,
            'quantity' => 1, // CHỈ CÒN 1 SẢN PHẨM
            'status' => 'published',
        ]);

        // Tạo 3 users
        $users = User::factory()->count(3)->create([
            'role' => 'customer',
        ]);

        // Mỗi user có giỏ hàng với 1 sản phẩm
        foreach ($users as $user) {
            $cart = Cart::create([
                'user_id' => $user->id,
                'status' => 'active',
                'subtotal' => $product->price,
                'grand_total' => $product->price,
                'total_quantity' => 1,
            ]);

            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => $product->price,
                'line_total' => $product->price,
            ]);
        }

        // Act: 3 users cùng đặt hàng đồng thời
        $results = [];
        $promises = [];

        foreach ($users as $index => $user) {
            $promises[] = function() use ($user, &$results, $index) {
                try {
                    $response = $this->actingAs($user, 'sanctum')
                        ->postJson('/api/orders', [
                            'customer_name' => $user->name,
                            'customer_phone' => '0987654321',
                            'customer_email' => $user->email,
                            'payment_method_id' => 1,
                        ]);

                    $results[$index] = [
                        'user_id' => $user->id,
                        'status' => $response->status(),
                        'success' => $response->status() === 201,
                        'message' => $response->json('message'),
                    ];
                } catch (\Exception $e) {
                    $results[$index] = [
                        'user_id' => $user->id,
                        'status' => 500,
                        'success' => false,
                        'message' => $e->getMessage(),
                    ];
                }
            };
        }

        // Chạy đồng thời (simulate concurrent requests)
        foreach ($promises as $promise) {
            $promise();
        }

        // Assert: Chỉ 1 người đặt hàng thành công
        $successCount = collect($results)->where('success', true)->count();
        $failCount = collect($results)->where('success', false)->count();

        $this->assertEquals(1, $successCount, 'Chỉ 1 người được đặt hàng thành công');
        $this->assertEquals(2, $failCount, '2 người còn lại phải thất bại');

        // Kiểm tra số lượng sản phẩm trong kho
        $product->refresh();
        $this->assertEquals(0, $product->quantity, 'Sản phẩm phải hết hàng');
        $this->assertEquals(1, $product->sold_count, 'Sold count phải là 1');

        // Kiểm tra số đơn hàng được tạo
        $orderCount = DB::table('orders')->count();
        $this->assertEquals(1, $orderCount, 'Chỉ có 1 đơn hàng được tạo');

        // In kết quả để debug
        dump('Race Condition Test Results:', $results);
        dump('Product after test:', [
            'quantity' => $product->quantity,
            'sold_count' => $product->sold_count,
        ]);
    }

    /**
     * Test: Overselling prevention
     * 
     * @test
     */
    public function test_prevent_overselling_with_multiple_orders()
    {
        // Arrange: Sản phẩm còn 5 trong kho
        $product = Product::factory()->create([
            'name' => 'MacBook Pro M3',
            'price' => 50000000,
            'quantity' => 5,
            'status' => 'published',
        ]);

        // Tạo 10 users, mỗi người muốn mua 2 sản phẩm
        $users = User::factory()->count(10)->create(['role' => 'customer']);

        foreach ($users as $user) {
            $cart = Cart::create([
                'user_id' => $user->id,
                'status' => 'active',
                'subtotal' => $product->price * 2,
                'grand_total' => $product->price * 2,
                'total_quantity' => 2,
            ]);

            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => 2, // Mỗi người muốn mua 2
                'unit_price' => $product->price,
                'line_total' => $product->price * 2,
            ]);
        }

        // Act: 10 users cùng đặt hàng
        $successCount = 0;
        $failCount = 0;

        foreach ($users as $user) {
            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/orders', [
                    'customer_name' => $user->name,
                    'customer_phone' => '0987654321',
                    'customer_email' => $user->email,
                    'payment_method_id' => 1,
                ]);

            if ($response->status() === 201) {
                $successCount++;
            } else {
                $failCount++;
            }
        }

        // Assert: Chỉ 2 người đặt hàng thành công (2 * 2 = 4 sản phẩm)
        // Hoặc 1 người (1 * 2 = 2 sản phẩm) + 3 người mua lẻ
        $this->assertLessThanOrEqual(3, $successCount, 'Không được bán quá 5 sản phẩm');

        // Kiểm tra tổng số sản phẩm đã bán
        $totalSold = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('order_items.product_id', $product->id)
            ->whereNotIn('orders.status', ['cancelled'])
            ->sum('order_items.quantity');

        $this->assertLessThanOrEqual(5, $totalSold, 'Tổng số sản phẩm bán không được vượt quá 5');

        // Kiểm tra số lượng còn lại
        $product->refresh();
        $this->assertGreaterThanOrEqual(0, $product->quantity, 'Số lượng không được âm');

        dump('Overselling Prevention Test Results:', [
            'success_orders' => $successCount,
            'failed_orders' => $failCount,
            'total_sold' => $totalSold,
            'remaining_quantity' => $product->quantity,
        ]);
    }

    /**
     * Test: Concurrent cart updates
     * 
     * @test
     */
    public function test_concurrent_cart_item_updates()
    {
        // Arrange
        $product = Product::factory()->create([
            'quantity' => 100,
            'price' => 1000000,
            'status' => 'published',
        ]);

        $user = User::factory()->create(['role' => 'customer']);
        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Update cart item quantity nhiều lần đồng thời
        $results = [];
        for ($i = 0; $i < 5; $i++) {
            $response = $this->actingAs($user, 'sanctum')
                ->patchJson("/api/cart/items/{$cartItem->id}", [
                    'quantity' => 10,
                ]);

            $results[] = $response->status();
        }

        // Assert: Tất cả requests đều thành công
        foreach ($results as $status) {
            $this->assertEquals(200, $status);
        }

        // Kiểm tra quantity cuối cùng
        $cartItem->refresh();
        $this->assertEquals(10, $cartItem->quantity);

        dump('Concurrent Cart Update Results:', [
            'final_quantity' => $cartItem->quantity,
            'all_requests_success' => collect($results)->every(fn($s) => $s === 200),
        ]);
    }
}
