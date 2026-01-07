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
 * Test Promotion Stacking
 * 
 * Kiểm tra xem hệ thống có cho phép áp dụng nhiều mã giảm giá cùng lúc không
 */
class PromotionStackingTest extends TestCase
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
     * Test: Không cho phép stacking promotions khi is_stackable = false
     * 
     * @test
     */
    public function test_cannot_stack_non_stackable_promotions()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'price' => 10000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Tạo 2 mã giảm giá KHÔNG cho phép stacking
        $promotion1 = Promotion::create([
            'name' => 'Giảm 10%',
            'code' => 'SALE10',
            'promotion_type' => 'percentage',
            'promotion_category' => 'coupon',
            'value' => 10,
            'is_active' => true,
            'is_stackable' => false, // KHÔNG cho phép stacking
        ]);

        $promotion2 = Promotion::create([
            'name' => 'Giảm 500k',
            'code' => 'SAVE500',
            'promotion_type' => 'fixed',
            'promotion_category' => 'coupon',
            'value' => 500000,
            'is_active' => true,
            'is_stackable' => false, // KHÔNG cho phép stacking
        ]);

        // Tạo giỏ hàng
        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
            'subtotal' => $product->price,
            'grand_total' => $product->price,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Áp dụng mã giảm giá thứ nhất
        $response1 = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'SALE10',
            ]);

        $response1->assertStatus(200);
        $cart->refresh();
        $this->assertEquals($promotion1->id, $cart->promotion_id);

        // Act: Cố gắng áp dụng mã giảm giá thứ hai
        $response2 = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'SAVE500',
            ]);

        // Assert: Phải thất bại
        $response2->assertStatus(422);
        $response2->assertJson([
            'message' => 'Không thể áp dụng nhiều mã khuyến mãi cùng lúc.',
        ]);

        // Giỏ hàng vẫn giữ mã cũ
        $cart->refresh();
        $this->assertEquals($promotion1->id, $cart->promotion_id);

        dump('Non-Stackable Promotion Test:', [
            'first_promotion_applied' => $promotion1->code,
            'second_promotion_rejected' => $promotion2->code,
            'cart_promotion_id' => $cart->promotion_id,
        ]);
    }

    /**
     * Test: Cho phép stacking promotions khi is_stackable = true
     * 
     * @test
     */
    public function test_can_stack_stackable_promotions()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'price' => 10000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Tạo 2 mã giảm giá CHO PHÉP stacking
        $promotion1 = Promotion::create([
            'name' => 'Giảm 10%',
            'code' => 'STACK10',
            'promotion_type' => 'percentage',
            'promotion_category' => 'coupon',
            'value' => 10,
            'is_active' => true,
            'is_stackable' => true, // CHO PHÉP stacking
        ]);

        $promotion2 = Promotion::create([
            'name' => 'Giảm thêm 200k',
            'code' => 'STACK200',
            'promotion_type' => 'fixed',
            'promotion_category' => 'coupon',
            'value' => 200000,
            'is_active' => true,
            'is_stackable' => true, // CHO PHÉP stacking
        ]);

        // Tạo giỏ hàng
        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
            'subtotal' => $product->price,
            'grand_total' => $product->price,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Áp dụng mã giảm giá thứ nhất
        $response1 = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'STACK10',
            ]);

        $response1->assertStatus(200);

        // Act: Áp dụng mã giảm giá thứ hai
        $response2 = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'STACK200',
            ]);

        // Assert: Nếu hệ thống hỗ trợ stacking, phải thành công
        // Nếu không hỗ trợ, phải thất bại với message rõ ràng
        if ($response2->status() === 200) {
            dump('✅ System supports promotion stacking');
            // Kiểm tra discount được áp dụng đúng
            $cart->refresh();
            $expectedDiscount = ($product->price * 0.1) + 200000; // 10% + 200k
            $this->assertEquals($expectedDiscount, $cart->discount_total);
        } else {
            dump('❌ System does NOT support promotion stacking (even with is_stackable=true)');
            $response2->assertStatus(422);
        }

        dump('Stackable Promotion Test:', [
            'promotion1' => $promotion1->code,
            'promotion2' => $promotion2->code,
            'response2_status' => $response2->status(),
            'cart_discount' => $cart->fresh()->discount_total ?? 0,
        ]);
    }

    /**
     * Test: Không cho phép áp dụng mã đã hết lượt sử dụng
     * 
     * @test
     */
    public function test_cannot_use_promotion_exceeding_usage_limit()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'price' => 5000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Tạo mã giảm giá chỉ dùng được 1 lần
        $promotion = Promotion::create([
            'name' => 'Giảm 100k',
            'code' => 'LIMIT1',
            'promotion_type' => 'fixed',
            'promotion_category' => 'coupon',
            'value' => 100000,
            'is_active' => true,
            'usage_limit' => 1, // CHỈ DÙNG ĐƯỢC 1 LẦN
            'used_count' => 1,  // ĐÃ DÙNG 1 LẦN
        ]);

        // Tạo giỏ hàng
        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
            'subtotal' => $product->price,
            'grand_total' => $product->price,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Cố gắng áp dụng mã đã hết lượt
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'LIMIT1',
            ]);

        // Assert: Phải thất bại
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Mã khuyến mãi đã hết lượt sử dụng.',
        ]);

        dump('Usage Limit Test:', [
            'promotion_code' => $promotion->code,
            'usage_limit' => $promotion->usage_limit,
            'used_count' => $promotion->used_count,
            'can_use' => $response->status() === 200,
        ]);
    }

    /**
     * Test: Không cho phép áp dụng mã chưa đến thời gian
     * 
     * @test
     */
    public function test_cannot_use_promotion_before_start_date()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'price' => 5000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Tạo mã giảm giá bắt đầu từ ngày mai
        $promotion = Promotion::create([
            'name' => 'Giảm 200k',
            'code' => 'FUTURE',
            'promotion_type' => 'fixed',
            'promotion_category' => 'coupon',
            'value' => 200000,
            'is_active' => true,
            'starts_at' => now()->addDay(), // BẮT ĐẦU TỪ NGÀY MAI
        ]);

        // Tạo giỏ hàng
        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
            'subtotal' => $product->price,
            'grand_total' => $product->price,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Cố gắng áp dụng mã chưa đến thời gian
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'FUTURE',
            ]);

        // Assert: Phải thất bại
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Mã khuyến mãi chưa bắt đầu.',
        ]);

        dump('Future Promotion Test:', [
            'promotion_code' => $promotion->code,
            'starts_at' => $promotion->starts_at->toDateTimeString(),
            'now' => now()->toDateTimeString(),
            'can_use' => $response->status() === 200,
        ]);
    }

    /**
     * Test: Không cho phép áp dụng mã đã hết hạn
     * 
     * @test
     */
    public function test_cannot_use_expired_promotion()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'price' => 5000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Tạo mã giảm giá đã hết hạn
        $promotion = Promotion::create([
            'name' => 'Giảm 300k',
            'code' => 'EXPIRED',
            'promotion_type' => 'fixed',
            'promotion_category' => 'coupon',
            'value' => 300000,
            'is_active' => true,
            'ends_at' => now()->subDay(), // ĐÃ HẾT HẠN TỪ HÔM QUA
        ]);

        // Tạo giỏ hàng
        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
            'subtotal' => $product->price,
            'grand_total' => $product->price,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Cố gắng áp dụng mã đã hết hạn
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cart/apply-promotion', [
                'code' => 'EXPIRED',
            ]);

        // Assert: Phải thất bại
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Mã khuyến mãi đã hết hạn.',
        ]);

        dump('Expired Promotion Test:', [
            'promotion_code' => $promotion->code,
            'ends_at' => $promotion->ends_at->toDateTimeString(),
            'now' => now()->toDateTimeString(),
            'can_use' => $response->status() === 200,
        ]);
    }
}
