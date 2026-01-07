<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Promotion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test Complete Order Flow
 * 
 * Kiểm tra toàn bộ quy trình đặt hàng từ đầu đến cuối
 */
class CompleteOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->seed(\Database\Seeders\CategorySeeder::class);
        $this->seed(\Database\Seeders\SupplierSeeder::class);
        $this->seed(\Database\Seeders\PaymentMethodSeeder::class);
    }

    /**
     * Test: Complete order flow - Happy path
     * 
     * @test
     */
    public function test_complete_order_flow_happy_path()
    {
        // Step 1: Tạo user và sản phẩm
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'price' => 10000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        dump('Step 1: Created user and product', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'product_quantity' => $product->quantity,
        ]);

        // Step 2: Thêm sản phẩm vào giỏ hàng
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/items', [
                'product_id' => $product->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(200);
        $cart = Cart::where('user_id', $user->id)->first();
        $this->assertNotNull($cart);
        $this->assertEquals(2, $cart->total_quantity);

        dump('Step 2: Added to cart', [
            'cart_id' => $cart->id,
            'cart_quantity' => $cart->total_quantity,
            'cart_subtotal' => $cart->subtotal,
        ]);

        // Step 3: Áp dụng mã giảm giá
        $promotion = Promotion::create([
            'name' => 'Giảm 10%',
            'code' => 'SALE10',
            'promotion_type' => 'percentage',
            'promotion_category' => 'coupon',
            'value' => 10,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'SALE10',
            ]);

        $response->assertStatus(200);
        $cart->refresh();
        $this->assertEquals($promotion->id, $cart->promotion_id);

        dump('Step 3: Applied promotion', [
            'promotion_code' => $promotion->code,
            'discount_total' => $cart->discount_total,
            'grand_total' => $cart->grand_total,
        ]);

        // Step 4: Tạo đơn hàng
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/orders', [
                'customer_name' => $user->name,
                'customer_phone' => '0987654321',
                'customer_email' => $user->email,
                'shipping_address_line' => '123 Test Street',
                'shipping_city' => 'Ho Chi Minh',
                'payment_method_id' => 1, // COD
            ]);

        $response->assertStatus(201);
        $order = $response->json();

        dump('Step 4: Created order', [
            'order_code' => $order['code'],
            'order_status' => $order['status'],
            'payment_status' => $order['payment_status'],
            'grand_total' => $order['grand_total'],
        ]);

        // Step 5: Kiểm tra stock đã giảm
        $product->refresh();
        $this->assertEquals(8, $product->quantity);
        $this->assertEquals(2, $product->sold_count);

        dump('Step 5: Stock updated', [
            'product_quantity' => $product->quantity,
            'product_sold_count' => $product->sold_count,
        ]);

        // Step 6: Kiểm tra giỏ hàng đã được xóa
        $cart->refresh();
        $this->assertEquals(0, $cart->items()->count());
        $this->assertEquals(0, $cart->total_quantity);

        dump('Step 6: Cart cleared', [
            'cart_items_count' => $cart->items()->count(),
            'cart_total_quantity' => $cart->total_quantity,
        ]);

        dump('✅ Complete Order Flow Test PASSED');
    }
}
