<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryImport;
use App\Models\InventoryImportItem;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test Quantity Constraint
 * 
 * Kiểm tra các ràng buộc về số lượng trong mua bán và nhập kho
 */
class QuantityConstraintTest extends TestCase
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
     * Test: Không cho đặt hàng khi không đủ stock
     * 
     * @test
     */
    public function test_cannot_order_when_insufficient_stock()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::factory()->create([
            'name' => 'iPhone 15 Pro',
            'price' => 30000000,
            'quantity' => 5, // Chỉ còn 5 cái
            'status' => 'published',
        ]);

        // Act: Cố gắng đặt 10 cái (nhiều hơn stock)
        $response = $this->actingAs($admin)->postJson('/api/orders', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => 10, // Đặt 10 cái
                    'unit_price' => $product->price,
                    'line_total' => $product->price * 10,
                    'discount_amount' => 0,
                ]
            ],
            'customer_name' => 'Test Customer',
            'subtotal' => $product->price * 10,
            'tax_total' => 0,
            'grand_total' => $product->price * 10,
        ]);

        // Assert: Phải bị từ chối
        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => "Sản phẩm 'iPhone 15 Pro' chỉ còn 5 trong kho."]);

        // Kiểm tra stock không thay đổi
        $product->refresh();
        $this->assertEquals(5, $product->quantity);
        $this->assertEquals(0, $product->sold_count);

        dump('✅ Không cho đặt hàng khi không đủ stock');
    }

    /**
     * Test: Stock giảm đúng khi đặt hàng thành công
     * 
     * @test
     */
    public function test_stock_decreases_correctly_when_order_placed()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::factory()->create([
            'name' => 'MacBook Pro M3',
            'price' => 50000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        $initialQuantity = $product->quantity;

        // Act: Đặt 3 cái
        $response = $this->actingAs($admin)->postJson('/api/orders', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => 3,
                    'unit_price' => $product->price,
                    'line_total' => $product->price * 3,
                    'discount_amount' => 0,
                ]
            ],
            'customer_name' => 'Test Customer',
            'subtotal' => $product->price * 3,
            'tax_total' => 0,
            'grand_total' => $product->price * 3,
            'payment_method_id' => 1,
        ]);

        // Assert
        $response->assertStatus(201);

        $product->refresh();
        $this->assertEquals($initialQuantity - 3, $product->quantity, 'Quantity phải giảm 3');
        $this->assertEquals(3, $product->sold_count, 'Sold count phải tăng 3');

        dump('Stock after order:', [
            'initial_quantity' => $initialQuantity,
            'ordered_quantity' => 3,
            'remaining_quantity' => $product->quantity,
            'sold_count' => $product->sold_count,
        ]);

        dump('✅ Stock giảm đúng khi đặt hàng');
    }

    /**
     * Test: Stock được hoàn lại khi hủy đơn
     * 
     * @test
     */
    public function test_stock_restored_when_order_cancelled()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::factory()->create([
            'name' => 'AirPods Pro',
            'price' => 5000000,
            'quantity' => 20,
            'status' => 'published',
        ]);

        // Tạo đơn hàng
        $order = Order::create([
            'code' => 'ORD-TEST-001',
            'user_id' => $admin->id,
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method_id' => 1,
            'subtotal' => $product->price * 5,
            'tax_total' => 0,
            'grand_total' => $product->price * 5,
            'channel' => 'online',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 5,
            'unit_price' => $product->price,
            'line_total' => $product->price * 5,
        ]);

        // Giảm stock thủ công (giả lập đã đặt hàng)
        $product->decrement('quantity', 5);
        $product->increment('sold_count', 5);
        $product->refresh();

        $quantityBeforeCancel = $product->quantity;
        $soldCountBeforeCancel = $product->sold_count;

        dump('Before cancel:', [
            'quantity' => $quantityBeforeCancel,
            'sold_count' => $soldCountBeforeCancel,
        ]);

        // Act: Hủy đơn
        $response = $this->actingAs($admin)->postJson("/api/orders/{$order->id}/cancel", [
            'cancel_reason' => 'Khách đổi ý'
        ]);

        // Assert
        $response->assertStatus(200);

        $product->refresh();
        $this->assertEquals($quantityBeforeCancel + 5, $product->quantity, 'Quantity phải tăng lại 5');
        $this->assertEquals($soldCountBeforeCancel - 5, $product->sold_count, 'Sold count phải giảm 5');

        dump('After cancel:', [
            'quantity' => $product->quantity,
            'sold_count' => $product->sold_count,
        ]);

        dump('✅ Stock được hoàn lại khi hủy đơn');
    }

    /**
     * Test: Inventory Import tăng stock đúng
     * 
     * @test
     */
    public function test_inventory_import_increases_stock_correctly()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::first();
        $product = Product::factory()->create([
            'name' => 'iPad Pro',
            'price' => 25000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        $initialQuantity = $product->quantity;

        // Act: Tạo phiếu nhập kho
        $response = $this->actingAs($admin)->postJson('/api/inventory-imports', [
            'supplier_id' => $supplier->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 50, // Nhập 50 cái
                    'unit_cost' => 20000000,
                    'line_total' => 20000000 * 50,
                ]
            ],
            'subtotal' => 20000000 * 50,
            'tax_total' => 0,
            'grand_total' => 20000000 * 50,
        ]);

        $response->assertStatus(201);
        $import = InventoryImport::latest()->first();

        dump('Import created:', [
            'import_id' => $import->id,
            'status' => $import->status,
        ]);

        // Chuyển sang completed để cộng stock
        $response = $this->actingAs($admin)->putJson("/api/inventory-imports/{$import->id}/status", [
            'status' => 'completed'
        ]);

        $response->assertStatus(200);

        // Assert
        $product->refresh();
        $this->assertEquals($initialQuantity + 50, $product->quantity, 'Quantity phải tăng 50');

        dump('Stock after import:', [
            'initial_quantity' => $initialQuantity,
            'imported_quantity' => 50,
            'final_quantity' => $product->quantity,
        ]);

        dump('✅ Inventory Import tăng stock đúng');
    }

    /**
     * Test: Không cho sửa phiếu nhập đã completed
     * 
     * @test
     */
    public function test_cannot_edit_completed_inventory_import()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::first();
        $product = Product::factory()->create([
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Tạo phiếu nhập
        $import = InventoryImport::create([
            'code' => 'IMP-TEST-001',
            'supplier_id' => $supplier->id,
            'created_by' => $admin->id,
            'status' => 'completed', // Đã hoàn thành
            'subtotal' => 1000000,
            'grand_total' => 1000000,
            'completed_at' => now(),
        ]);

        InventoryImportItem::create([
            'inventory_import_id' => $import->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'unit_cost' => 100000,
            'line_total' => 1000000,
        ]);

        // Act: Cố gắng sửa phiếu đã completed
        $response = $this->actingAs($admin)->putJson("/api/inventory-imports/{$import->id}", [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 20, // Thay đổi số lượng
                    'unit_cost' => 100000,
                    'line_total' => 2000000,
                ]
            ],
        ]);

        // Assert: Phải bị từ chối
        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Không thể sửa phiếu nhập đã hoàn thành. Phiếu đã cập nhật số lượng tồn kho.']);

        dump('✅ Không cho sửa phiếu nhập đã completed');
    }

    /**
     * Test: Không cho số lượng âm khi đặt hàng
     * 
     * @test
     */
    public function test_cannot_order_with_negative_quantity()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $product = Product::factory()->create([
            'price' => 10000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Act: Cố gắng đặt với số lượng âm
        $response = $this->actingAs($admin)->postJson('/api/orders', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => -5, // Số lượng âm
                    'unit_price' => $product->price,
                    'line_total' => $product->price * -5,
                    'discount_amount' => 0,
                ]
            ],
            'customer_name' => 'Test Customer',
            'subtotal' => $product->price * -5,
            'tax_total' => 0,
            'grand_total' => $product->price * -5,
        ]);

        // Assert: Phải bị từ chối
        $response->assertStatus(422);

        dump('✅ Không cho số lượng âm khi đặt hàng');
    }

    /**
     * Test: Không cho giá âm khi nhập kho
     * 
     * @test
     */
    public function test_cannot_import_with_negative_price()
    {
        // Arrange
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::first();
        $product = Product::factory()->create([
            'quantity' => 10,
            'status' => 'published',
        ]);

        // Act: Cố gắng nhập với giá âm
        $response = $this->actingAs($admin)->postJson('/api/inventory-imports', [
            'supplier_id' => $supplier->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10,
                    'unit_cost' => -100000, // Giá âm
                    'line_total' => -1000000,
                ]
            ],
            'subtotal' => -1000000,
            'tax_total' => 0,
            'grand_total' => -1000000,
        ]);

        // Assert: Phải bị từ chối
        $response->assertStatus(422);

        dump('✅ Không cho giá âm khi nhập kho');
    }
}
