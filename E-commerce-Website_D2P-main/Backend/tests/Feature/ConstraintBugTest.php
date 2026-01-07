<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Wishlist;
use App\Models\ProductReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test Constraint Bug Fix
 * 
 * Kiểm tra xem khi xóa Product, dữ liệu liên quan có bị mất không
 */
class ConstraintBugTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->seed(\Database\Seeders\CategorySeeder::class);
        $this->seed(\Database\Seeders\SupplierSeeder::class);
    }

    /**
     * Test: Xóa Product không làm mất CartItem
     * 
     * @test
     */
    public function test_deleting_product_does_not_delete_cart_items()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'name' => 'iPhone 15 Pro',
            'price' => 30000000,
            'quantity' => 10,
            'status' => 'published',
        ]);

        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
            'subtotal' => $product->price,
            'grand_total' => $product->price,
        ]);

        $cartItem = CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        dump('Before delete:', [
            'cart_item_id' => $cartItem->id,
            'product_id' => $cartItem->product_id,
            'product_name' => $product->name,
        ]);

        // Act: Xóa Product (force delete để trigger foreign key constraint)
        $product->forceDelete();

        // Assert: CartItem vẫn còn nhưng product_id = NULL
        $cartItem->refresh();
        $this->assertNotNull($cartItem->id, 'CartItem không được xóa');
        $this->assertNull($cartItem->product_id, 'product_id phải là NULL');

        dump('After delete:', [
            'cart_item_still_exists' => true,
            'product_id' => $cartItem->product_id,
            'cart_item_id' => $cartItem->id,
        ]);

        dump('✅ BUG ĐÃ ĐƯỢC SỬA: CartItem không bị xóa khi xóa Product');
    }

    /**
     * Test: Xóa Product không làm mất Wishlist
     * 
     * @test
     */
    public function test_deleting_product_does_not_delete_wishlist()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'name' => 'MacBook Pro M3',
            'price' => 50000000,
            'quantity' => 5,
            'status' => 'published',
        ]);

        $wishlist = Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        dump('Before delete:', [
            'wishlist_id' => $wishlist->id,
            'product_id' => $wishlist->product_id,
            'product_name' => $product->name,
        ]);

        // Act: Xóa Product (force delete để trigger foreign key constraint)
        $product->forceDelete();

        // Assert: Wishlist vẫn còn nhưng product_id = NULL
        $wishlist->refresh();
        $this->assertNotNull($wishlist->id, 'Wishlist không được xóa');
        $this->assertNull($wishlist->product_id, 'product_id phải là NULL');

        dump('After delete:', [
            'wishlist_still_exists' => true,
            'product_id' => $wishlist->product_id,
            'wishlist_id' => $wishlist->id,
        ]);

        dump('✅ BUG ĐÃ ĐƯỢC SỬA: Wishlist không bị xóa khi xóa Product');
    }

    /**
     * Test: Xóa Product không làm mất ProductReview
     * 
     * @test
     */
    public function test_deleting_product_does_not_delete_reviews()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        $product = Product::factory()->create([
            'name' => 'AirPods Pro',
            'price' => 5000000,
            'quantity' => 20,
            'status' => 'published',
        ]);

        $review = ProductReview::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'rating' => 5,
            'title' => 'Sản phẩm tuyệt vời',
            'comment' => 'Rất hài lòng với sản phẩm này',
            'is_approved' => true,
        ]);

        dump('Before delete:', [
            'review_id' => $review->id,
            'product_id' => $review->product_id,
            'rating' => $review->rating,
            'comment' => $review->comment,
        ]);

        // Act: Xóa Product (force delete để trigger foreign key constraint)
        $product->forceDelete();

        // Assert: Review vẫn còn nhưng product_id = NULL
        $review->refresh();
        $this->assertNotNull($review->id, 'Review không được xóa');
        $this->assertNull($review->product_id, 'product_id phải là NULL');
        $this->assertEquals(5, $review->rating, 'Rating vẫn còn');
        $this->assertEquals('Rất hài lòng với sản phẩm này', $review->comment, 'Comment vẫn còn');

        dump('After delete:', [
            'review_still_exists' => true,
            'product_id' => $review->product_id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'data_preserved' => true,
        ]);

        dump('✅ BUG ĐÃ ĐƯỢC SỬA: Review không bị xóa, dữ liệu được bảo toàn');
    }

    /**
     * Test: Xóa nhiều Product cùng lúc
     * 
     * @test
     */
    public function test_deleting_multiple_products_preserves_data()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'customer']);
        
        $product1 = Product::factory()->create(['name' => 'Product 1']);
        $product2 = Product::factory()->create(['name' => 'Product 2']);
        $product3 = Product::factory()->create(['name' => 'Product 3']);

        $cart = Cart::create([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        // Thêm 3 sản phẩm vào giỏ
        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product1->id,
            'quantity' => 1,
            'unit_price' => $product1->price,
            'line_total' => $product1->price,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product2->id,
            'quantity' => 2,
            'unit_price' => $product2->price,
            'line_total' => $product2->price * 2,
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product3->id,
            'quantity' => 1,
            'unit_price' => $product3->price,
            'line_total' => $product3->price,
        ]);

        $this->assertEquals(3, $cart->items()->count());

        // Act: Xóa 2 sản phẩm (force delete để trigger foreign key constraint)
        $product1->forceDelete();
        $product2->forceDelete();

        // Assert: Vẫn còn 3 cart items
        $cart->refresh();
        $this->assertEquals(3, $cart->items()->count(), 'Vẫn còn 3 cart items');

        // 2 items có product_id = NULL
        $nullItems = $cart->items()->whereNull('product_id')->count();
        $this->assertEquals(2, $nullItems, '2 items có product_id = NULL');

        // 1 item vẫn còn product_id
        $validItems = $cart->items()->whereNotNull('product_id')->count();
        $this->assertEquals(1, $validItems, '1 item vẫn có product_id');

        dump('Multiple Delete Test:', [
            'total_cart_items' => $cart->items()->count(),
            'items_with_null_product' => $nullItems,
            'items_with_valid_product' => $validItems,
        ]);

        dump('✅ BUG ĐÃ ĐƯỢC SỬA: Xóa nhiều Product không làm mất CartItem');
    }
}
