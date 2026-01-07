<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test Refund Flow
 * 
 * Kiểm tra toàn bộ quy trình hoàn tiền
 */
class RefundFlowTest extends TestCase
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
     * Test: Khách hàng hủy đơn đã thanh toán → Yêu cầu hoàn tiền
     * 
     * @test
     */
    public function test_customer_cancel_paid_order_requires_refund()
    {
        // Arrange
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-001',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'pending',
            'payment_status' => 'paid', // ĐÃ THANH TOÁN
            'payment_method_id' => 2, // Bank transfer
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'paid_at' => now(),
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Giảm stock
        $product->decrement('quantity', 1);
        $product->increment('sold_count', 1);

        // Act: Khách hàng hủy đơn
        $response = $this->actingAs($customer, 'sanctum')
            ->putJson("/api/orders/{$order->id}/cancel", [
                'cancel_reason' => 'Đổi ý không mua nữa',
            ]);

        // Assert
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'order',
            'refund_required',
            'refund_status',
        ]);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertTrue($order->refund_required);
        $this->assertEquals('pending', $order->refund_status);

        // Kiểm tra stock được hoàn lại
        $product->refresh();
        $this->assertEquals(10, $product->quantity);
        $this->assertEquals(0, $product->sold_count);

        dump('Cancel Paid Order Test:', [
            'order_status' => $order->status,
            'refund_required' => $order->refund_required,
            'refund_status' => $order->refund_status,
            'product_quantity_restored' => $product->quantity,
        ]);
    }

    /**
     * Test: Admin xác nhận hoàn tiền
     * 
     * @test
     */
    public function test_admin_confirm_refund()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-002',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'cancelled',
            'payment_status' => 'paid',
            'payment_method_id' => 2,
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'paid_at' => now(),
            'cancelled_at' => now(),
            'refund_required' => true,
            'refund_status' => 'pending', // CHỜ HOÀN TIỀN
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Admin xác nhận đã hoàn tiền
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/orders/{$order->id}/process-refund", [
                'action' => 'completed',
                'refund_note' => 'Đã chuyển khoản hoàn tiền',
            ]);

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Đã xác nhận hoàn tiền thành công',
        ]);

        $order->refresh();
        $this->assertEquals('completed', $order->refund_status);
        $this->assertEquals('refunded', $order->payment_status);
        $this->assertNotNull($order->refunded_at);

        dump('Admin Confirm Refund Test:', [
            'refund_status' => $order->refund_status,
            'payment_status' => $order->payment_status,
            'refunded_at' => $order->refunded_at?->toDateTimeString(),
        ]);
    }

    /**
     * Test: Admin từ chối hoàn tiền
     * 
     * @test
     */
    public function test_admin_reject_refund()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-003',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'cancelled',
            'payment_status' => 'paid',
            'payment_method_id' => 2,
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'paid_at' => now(),
            'cancelled_at' => now(),
            'refund_required' => true,
            'refund_status' => 'pending',
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Admin từ chối hoàn tiền
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/orders/{$order->id}/process-refund", [
                'action' => 'rejected',
                'refund_note' => 'Không đủ điều kiện hoàn tiền',
            ]);

        // Assert
        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Đã từ chối yêu cầu hoàn tiền',
        ]);

        $order->refresh();
        $this->assertEquals('rejected', $order->refund_status);
        $this->assertEquals('paid', $order->payment_status); // Vẫn giữ trạng thái paid

        dump('Admin Reject Refund Test:', [
            'refund_status' => $order->refund_status,
            'payment_status' => $order->payment_status,
            'refund_note' => $order->refund_note,
        ]);
    }

    /**
     * Test: Khách hàng hủy đơn chưa thanh toán → Không cần hoàn tiền
     * 
     * @test
     */
    public function test_customer_cancel_unpaid_order_no_refund()
    {
        // Arrange
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-004',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'pending',
            'payment_status' => 'unpaid', // CHƯA THANH TOÁN
            'payment_method_id' => 1, // COD
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Giảm stock
        $product->decrement('quantity', 1);
        $product->increment('sold_count', 1);

        // Act: Khách hàng hủy đơn
        $response = $this->actingAs($customer, 'sanctum')
            ->putJson("/api/orders/{$order->id}/cancel", [
                'cancel_reason' => 'Đổi ý không mua nữa',
            ]);

        // Assert
        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertFalse($order->refund_required ?? false); // Không cần hoàn tiền

        // Kiểm tra stock được hoàn lại
        $product->refresh();
        $this->assertEquals(10, $product->quantity);
        $this->assertEquals(0, $product->sold_count);

        dump('Cancel Unpaid Order Test:', [
            'order_status' => $order->status,
            'refund_required' => $order->refund_required ?? false,
            'product_quantity_restored' => $product->quantity,
        ]);
    }

    /**
     * Test: Khách yêu cầu hủy đơn đã xác nhận chuyển khoản → Chờ Admin xác nhận
     * 
     * @test
     */
    public function test_customer_cancel_after_transfer_confirmation_requires_admin_approval()
    {
        // Arrange
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-005',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'pending',
            'payment_status' => 'pending', // Đang chờ xác nhận
            'payment_method_id' => 2, // Bank transfer
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'transfer_confirmed_at' => now(), // ĐÃ XÁC NHẬN CHUYỂN KHOẢN
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Act: Khách hàng yêu cầu hủy
        $response = $this->actingAs($customer, 'sanctum')
            ->putJson("/api/orders/{$order->id}/cancel", [
                'cancel_reason' => 'Đổi ý không mua nữa',
            ]);

        // Assert: Phải chuyển sang trạng thái pending_cancel
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'pending_cancel' => true,
        ]);

        $order->refresh();
        $this->assertEquals('pending_cancel', $order->status);

        dump('Cancel After Transfer Confirmation Test:', [
            'order_status' => $order->status,
            'transfer_confirmed_at' => $order->transfer_confirmed_at?->toDateTimeString(),
            'requires_admin_approval' => true,
        ]);
    }

    /**
     * Test: Admin xác nhận hủy đơn (đã nhận tiền)
     * 
     * @test
     */
    public function test_admin_confirm_cancel_with_refund()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-006',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'pending_cancel', // CHỜ XÁC NHẬN HỦY
            'payment_status' => 'pending',
            'payment_method_id' => 2,
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'transfer_confirmed_at' => now(),
            'cancel_reason' => 'Khách đổi ý',
            'cancelled_by' => $customer->id,
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Giảm stock
        $product->decrement('quantity', 1);
        $product->increment('sold_count', 1);

        // Act: Admin xác nhận đã nhận tiền và sẽ hoàn tiền
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/orders/{$order->id}/confirm-cancel", [
                'has_received_money' => true,
                'refund_note' => 'Sẽ hoàn tiền trong 3-5 ngày',
            ]);

        // Assert
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'refund_required' => true,
        ]);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('refunded', $order->payment_status);
        $this->assertTrue($order->refund_required);
        $this->assertEquals('completed', $order->refund_status);

        // Kiểm tra stock được hoàn lại
        $product->refresh();
        $this->assertEquals(10, $product->quantity);
        $this->assertEquals(0, $product->sold_count);

        dump('Admin Confirm Cancel With Refund Test:', [
            'order_status' => $order->status,
            'payment_status' => $order->payment_status,
            'refund_required' => $order->refund_required,
            'refund_status' => $order->refund_status,
            'product_quantity_restored' => $product->quantity,
        ]);
    }

    /**
     * Test: Admin xác nhận hủy đơn (chưa nhận tiền)
     * 
     * @test
     */
    public function test_admin_confirm_cancel_without_refund()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'quantity' => 10,
            'price' => 5000000,
            'status' => 'published',
        ]);

        $order = Order::create([
            'code' => 'ORD-TEST-007',
            'user_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => '0987654321',
            'status' => 'pending_cancel',
            'payment_status' => 'pending',
            'payment_method_id' => 2,
            'subtotal' => $product->price,
            'tax_total' => 0,
            'grand_total' => $product->price,
            'transfer_confirmed_at' => now(),
            'cancel_reason' => 'Khách đổi ý',
            'cancelled_by' => $customer->id,
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        // Giảm stock
        $product->decrement('quantity', 1);
        $product->increment('sold_count', 1);

        // Act: Admin xác nhận CHƯA nhận tiền
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/orders/{$order->id}/confirm-cancel", [
                'has_received_money' => false,
            ]);

        // Assert
        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('unpaid', $order->payment_status);
        $this->assertFalse($order->refund_required);

        // Kiểm tra stock được hoàn lại
        $product->refresh();
        $this->assertEquals(10, $product->quantity);
        $this->assertEquals(0, $product->sold_count);

        dump('Admin Confirm Cancel Without Refund Test:', [
            'order_status' => $order->status,
            'payment_status' => $order->payment_status,
            'refund_required' => $order->refund_required,
            'product_quantity_restored' => $product->quantity,
        ]);
    }
}
