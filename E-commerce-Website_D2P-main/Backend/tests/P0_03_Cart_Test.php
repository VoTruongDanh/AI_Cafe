<?php

/**
 * P0-03: CART & CHECKOUT TESTS
 * 
 * Test cases:
 * - CART-001: Thêm vào giỏ hàng
 * - CART-002: Cập nhật giỏ hàng
 * - CART-003: Tính toán giá
 * - CART-004: Checkout
 * - CART-005: Validation
 */

require_once __DIR__ . '/../vendor/autoload.php';

class CartCheckoutTest
{
    private $baseUrl = 'http://localhost:8000/api';
    private $userToken;
    private $userId;
    private $productId;
    private $cartItemId;
    private $results = [];

    public function __construct()
    {
        echo "🧪 P0-03: CART & CHECKOUT TESTS\n";
        echo str_repeat("=", 60) . "\n\n";
    }

    private function request($method, $endpoint, $data = null, $token = null)
    {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        if ($token) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'status' => $httpCode,
            'body' => json_decode($response, true)
        ];
    }

    private function pass($testId, $message)
    {
        echo "✅ PASS: $testId - $message\n";
        $this->results[$testId] = 'PASS';
    }

    private function fail($testId, $message, $expected, $actual)
    {
        echo "❌ FAIL: $testId - $message\n";
        echo "   Expected: $expected\n";
        echo "   Actual: $actual\n";
        $this->results[$testId] = 'FAIL';
    }

    private function skip($testId, $message, $reason)
    {
        echo "⚠️  SKIP: $testId - $message\n";
        echo "   Reason: $reason\n";
        $this->results[$testId] = 'SKIP';
    }

    public function setup()
    {
        echo "🔧 Setup: Creating test user and getting product...\n";

        // Register test user
        $response = $this->request('POST', '/auth/register', [
            'name' => 'Cart Test User',
            'email' => 'carttest_' . time() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0987654321',
            'address' => '123 Test St'
        ]);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $this->userToken = $response['body']['token'] ?? $response['body']['data']['token'] ?? null;
            $this->userId = $response['body']['user']['id'] ?? $response['body']['data']['user']['id'] ?? null;
            echo "✅ User created: ID {$this->userId}\n";
        } else {
            echo "❌ Failed to create user\n";
            return false;
        }

        // Get a product
        $response = $this->request('GET', '/products?per_page=1');
        if ($response['status'] === 200 && !empty($response['body']['data'])) {
            $this->productId = $response['body']['data'][0]['id'];
            echo "✅ Product found: ID {$this->productId}\n";
        } else {
            echo "❌ Failed to get product\n";
            return false;
        }

        echo "\n";
        return true;
    }

    // CART-001: Thêm vào giỏ hàng
    public function testAddToCart()
    {
        echo "📦 CART-001: Thêm vào giỏ hàng\n";
        echo str_repeat("-", 60) . "\n";

        // CART-001.1: Thêm sản phẩm mới
        $response = $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 2
        ], $this->userToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            // Get cart item ID from items array
            $items = $response['body']['items'] ?? [];
            if (!empty($items)) {
                $this->cartItemId = $items[0]['id'];
            }
            $this->pass('CART-001.1', 'Thêm sản phẩm mới vào cart');
        } else {
            $this->fail('CART-001.1', 'Thêm sản phẩm mới', 'Status 200/201', 'Status ' . $response['status']);
        }

        // CART-001.2: Thêm sản phẩm đã có (tăng quantity)
        $response = $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->userToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $this->pass('CART-001.2', 'Thêm sản phẩm đã có → Tăng quantity');
        } else {
            $this->fail('CART-001.2', 'Tăng quantity', 'Status 200/201', 'Status ' . $response['status']);
        }

        // CART-001.3: Thêm sản phẩm không tồn tại
        $response = $this->request('POST', '/cart/items', [
            'product_id' => 99999,
            'quantity' => 1
        ], $this->userToken);

        if ($response['status'] === 404 || $response['status'] === 422) {
            $this->pass('CART-001.3', 'Từ chối sản phẩm không tồn tại');
        } else {
            $this->fail('CART-001.3', 'Validate product exists', 'Status 404/422', 'Status ' . $response['status']);
        }

        // CART-001.4: Thêm với quantity = 0
        $response = $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 0
        ], $this->userToken);

        if ($response['status'] === 422) {
            $this->pass('CART-001.4', 'Từ chối quantity = 0');
        } else {
            $this->fail('CART-001.4', 'Validate quantity > 0', 'Status 422', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // CART-002: Cập nhật giỏ hàng
    public function testUpdateCart()
    {
        echo "📝 CART-002: Cập nhật giỏ hàng\n";
        echo str_repeat("-", 60) . "\n";

        if (!$this->cartItemId) {
            $this->skip('CART-002.1', 'Tăng quantity', 'No cart item ID');
            $this->skip('CART-002.2', 'Giảm quantity', 'No cart item ID');
            $this->skip('CART-002.3', 'Delete item', 'No cart item ID');
            echo "\n";
            return;
        }

        // CART-002.1: Tăng quantity
        $response = $this->request('PATCH', "/cart/items/{$this->cartItemId}", [
            'quantity' => 5
        ], $this->userToken);

        if ($response['status'] === 200) {
            $this->pass('CART-002.1', 'Tăng quantity thành công');
        } else {
            $this->fail('CART-002.1', 'Tăng quantity', 'Status 200', 'Status ' . $response['status']);
        }

        // CART-002.2: Giảm quantity
        $response = $this->request('PATCH', "/cart/items/{$this->cartItemId}", [
            'quantity' => 2
        ], $this->userToken);

        if ($response['status'] === 200) {
            $this->pass('CART-002.2', 'Giảm quantity thành công');
        } else {
            $this->fail('CART-002.2', 'Giảm quantity', 'Status 200', 'Status ' . $response['status']);
        }

        // CART-002.3: Delete item
        $response = $this->request('DELETE', "/cart/items/{$this->cartItemId}", null, $this->userToken);

        if ($response['status'] === 200 || $response['status'] === 204) {
            $this->pass('CART-002.3', 'Xóa item thành công');
            
            // Re-add item for next tests
            $response = $this->request('POST', '/cart/items', [
                'product_id' => $this->productId,
                'quantity' => 2
            ], $this->userToken);
            $items = $response['body']['items'] ?? [];
            if (!empty($items)) {
                $this->cartItemId = $items[0]['id'];
            }
        } else {
            $this->fail('CART-002.3', 'Delete item', 'Status 200/204', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // CART-003: Tính toán giá
    public function testCartCalculation()
    {
        echo "💰 CART-003: Tính toán giá\n";
        echo str_repeat("-", 60) . "\n";

        // Get cart
        $response = $this->request('GET', '/cart', null, $this->userToken);

        if ($response['status'] === 200) {
            $cart = $response['body'];
            
            // CART-003.1: Subtotal calculation
            if (isset($cart['subtotal'])) {
                $this->pass('CART-003.1', 'Subtotal được tính');
            } else {
                $this->fail('CART-003.1', 'Subtotal calculation', 'Has subtotal', 'No subtotal');
            }

            // CART-003.2: Discount calculation
            if (isset($cart['discount_total'])) {
                $this->pass('CART-003.2', 'Discount được tính');
            } else {
                $this->fail('CART-003.2', 'Discount calculation', 'Has discount_total', 'No discount_total');
            }

            // CART-003.3: Grand total calculation
            if (isset($cart['grand_total'])) {
                $expectedTotal = $cart['subtotal'] - ($cart['discount_total'] ?? 0);
                if (abs($cart['grand_total'] - $expectedTotal) < 0.01) {
                    $this->pass('CART-003.3', 'Grand total được tính đúng');
                } else {
                    $this->fail('CART-003.3', 'Grand total calculation', "Total = $expectedTotal", "Total = {$cart['grand_total']}");
                }
            } else {
                $this->fail('CART-003.3', 'Grand total calculation', 'Has grand_total', 'No grand_total');
            }
        } else {
            $this->skip('CART-003.1', 'Subtotal calculation', 'Cannot get cart');
            $this->skip('CART-003.2', 'Discount calculation', 'Cannot get cart');
            $this->skip('CART-003.3', 'Grand total calculation', 'Cannot get cart');
        }

        echo "\n";
    }

    // CART-004: Checkout
    public function testCheckout()
    {
        echo "🛒 CART-004: Checkout\n";
        echo str_repeat("-", 60) . "\n";

        // CART-004.1: Checkout with valid data
        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'customer_email' => 'test@example.com',
            'shipping_address_line' => '123 Test Street, Test City',
            'payment_method_id' => 1,
            'notes' => 'Test order'
        ], $this->userToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $orderId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;
            $this->pass('CART-004.1', "Checkout thành công (Order ID: $orderId)");
        } else {
            $this->fail('CART-004.1', 'Checkout', 'Status 200/201', 'Status ' . $response['status']);
        }

        // CART-004.2: Checkout with empty cart
        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test Street',
            'payment_method_id' => 1
        ], $this->userToken);

        if ($response['status'] === 422 || $response['status'] === 400) {
            $this->pass('CART-004.2', 'Từ chối checkout với cart trống');
        } else {
            $this->fail('CART-004.2', 'Validate cart not empty', 'Status 422/400', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // CART-005: Validation
    public function testCartValidation()
    {
        echo "✔️  CART-005: Validation\n";
        echo str_repeat("-", 60) . "\n";

        // Add item back to cart for testing
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->userToken);

        // CART-005.1: Không cho thêm quá stock
        $response = $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 99999
        ], $this->userToken);

        if ($response['status'] === 422 || $response['status'] === 400) {
            $this->pass('CART-005.1', 'Từ chối quantity > stock');
        } else {
            $this->fail('CART-005.1', 'Validate quantity <= stock', 'Status 422/400', 'Status ' . $response['status']);
        }

        // CART-005.2: Không cho thêm sản phẩm hết hàng
        // (Skip this test as we don't have a product with stock = 0)
        $this->skip('CART-005.2', 'Validate product in stock', 'No out-of-stock product available');

        // CART-005.3: Validate without authentication
        $response = $this->request('GET', '/cart');

        if ($response['status'] === 401) {
            $this->pass('CART-005.3', 'Từ chối access cart without auth');
        } else {
            $this->fail('CART-005.3', 'Require authentication', 'Status 401', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    public function printSummary()
    {
        echo str_repeat("=", 60) . "\n";
        echo "📊 TEST SUMMARY\n";
        echo str_repeat("=", 60) . "\n";

        $passed = count(array_filter($this->results, fn($r) => $r === 'PASS'));
        $failed = count(array_filter($this->results, fn($r) => $r === 'FAIL'));
        $skipped = count(array_filter($this->results, fn($r) => $r === 'SKIP'));
        $total = count($this->results);

        echo "Total Tests: $total\n";
        echo "✅ Passed: $passed (" . round($passed / $total * 100, 1) . "%)\n";
        echo "❌ Failed: $failed (" . round($failed / $total * 100, 1) . "%)\n";
        echo "⚠️  Skipped: $skipped (" . round($skipped / $total * 100, 1) . "%)\n";
        echo "\n";

        if ($failed > 0) {
            echo "❌ FAILED TESTS:\n";
            foreach ($this->results as $testId => $result) {
                if ($result === 'FAIL') {
                    echo "   - $testId\n";
                }
            }
            echo "\n";
        }

        $passRate = round($passed / $total * 100, 1);
        if ($passRate >= 90) {
            echo "✅ EXCELLENT! Pass rate >= 90%\n";
        } elseif ($passRate >= 70) {
            echo "✅ GOOD! Pass rate >= 70%\n";
        } elseif ($passRate >= 50) {
            echo "⚠️  FAIR. Pass rate >= 50%\n";
        } else {
            echo "❌ POOR. Pass rate < 50%\n";
        }
    }

    public function run()
    {
        if (!$this->setup()) {
            echo "❌ Setup failed. Cannot continue tests.\n";
            return;
        }

        $this->testAddToCart();
        $this->testUpdateCart();
        $this->testCartCalculation();
        $this->testCheckout();
        $this->testCartValidation();

        $this->printSummary();
    }
}

// Run tests
$test = new CartCheckoutTest();
$test->run();
