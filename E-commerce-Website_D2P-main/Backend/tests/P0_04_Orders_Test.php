<?php

/**
 * P0-04: ORDERS & ORDER STATUS TESTS
 * 
 * Test cases:
 * - ORD-001: Tạo đơn hàng
 * - ORD-002: Xem đơn hàng
 * - ORD-003: Hủy đơn - Customer
 * - ORD-004: Hủy đơn - Admin
 * - ORD-005: Cập nhật trạng thái
 * - ORD-006: Payment timeout
 */

require_once __DIR__ . '/../vendor/autoload.php';

class OrdersTest
{
    private $baseUrl = 'http://localhost:8000/api';
    private $customerToken;
    private $adminToken;
    private $customerId;
    private $adminId;
    private $productId;
    private $orderId;
    private $results = [];

    public function __construct()
    {
        echo "🧪 P0-04: ORDERS & ORDER STATUS TESTS\n";
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
        echo "🔧 Setup: Creating test users and order...\n";

        // Create customer
        $response = $this->request('POST', '/auth/register', [
            'name' => 'Order Test Customer',
            'email' => 'ordercustomer_' . time() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0987654321',
            'address' => '123 Test St'
        ]);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $this->customerToken = $response['body']['token'] ?? $response['body']['data']['token'] ?? null;
            $this->customerId = $response['body']['user']['id'] ?? $response['body']['data']['user']['id'] ?? null;
            echo "✅ Customer created: ID {$this->customerId}\n";
        } else {
            echo "❌ Failed to create customer\n";
            return false;
        }

        // Login as admin
        $response = $this->request('POST', '/auth/login', [
            'email' => 'admin@electroshop.vn',
            'password' => 'password'
        ]);

        if ($response['status'] === 200) {
            $this->adminToken = $response['body']['token'] ?? $response['body']['data']['token'] ?? null;
            $this->adminId = $response['body']['user']['id'] ?? $response['body']['data']['user']['id'] ?? null;
            echo "✅ Admin logged in: ID {$this->adminId}\n";
        } else {
            echo "❌ Failed to login as admin\n";
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

        // Create an order by adding to cart and checkout
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Order Test Customer',
            'customer_phone' => '0987654321',
            'customer_email' => 'test@example.com',
            'shipping_address_line' => '123 Test Street',
            'payment_method_id' => 1,
            'notes' => 'Test order'
        ], $this->customerToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $this->orderId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;
            echo "✅ Order created: ID {$this->orderId}\n";
        } else {
            echo "❌ Failed to create order\n";
            return false;
        }

        echo "\n";
        return true;
    }

    // ORD-001: Tạo đơn hàng
    public function testCreateOrder()
    {
        echo "📦 ORD-001: Tạo đơn hàng\n";
        echo str_repeat("-", 60) . "\n";

        // ORD-001.1: Tạo đơn COD
        // Add to cart first
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1, // COD
            'notes' => 'Test COD order'
        ], $this->customerToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $order = $response['body']['data'] ?? $response['body'];
            if (isset($order['code'])) {
                $this->pass('ORD-001.1', "Tạo đơn COD thành công (Code: {$order['code']})");
            } else {
                $this->fail('ORD-001.1', 'Order code missing', 'Has code', 'No code');
            }
        } else {
            $this->fail('ORD-001.1', 'Tạo đơn COD', 'Status 200/201', 'Status ' . $response['status']);
        }

        // ORD-001.2: Tạo đơn với cart trống
        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1
        ], $this->customerToken);

        if ($response['status'] === 422 || $response['status'] === 400) {
            $this->pass('ORD-001.2', 'Từ chối tạo đơn với cart trống');
        } else {
            $this->fail('ORD-001.2', 'Validate cart not empty', 'Status 422/400', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // ORD-002: Xem đơn hàng
    public function testViewOrders()
    {
        echo "👀 ORD-002: Xem đơn hàng\n";
        echo str_repeat("-", 60) . "\n";

        // ORD-002.1: Customer xem đơn của mình
        $response = $this->request('GET', '/orders', null, $this->customerToken);

        if ($response['status'] === 200) {
            $orders = $response['body']['data'] ?? $response['body'];
            if (is_array($orders) && count($orders) > 0) {
                $this->pass('ORD-002.1', 'Customer xem được đơn của mình');
            } else {
                $this->fail('ORD-002.1', 'Customer orders', 'Has orders', 'No orders');
            }
        } else {
            $this->fail('ORD-002.1', 'View customer orders', 'Status 200', 'Status ' . $response['status']);
        }

        // ORD-002.2: Customer xem chi tiết đơn
        $response = $this->request('GET', "/orders/{$this->orderId}", null, $this->customerToken);

        if ($response['status'] === 200) {
            $order = $response['body']['data'] ?? $response['body'];
            if (isset($order['id']) && $order['id'] == $this->orderId) {
                $this->pass('ORD-002.2', 'Customer xem được chi tiết đơn');
            } else {
                $this->fail('ORD-002.2', 'Order detail', 'Correct order', 'Wrong order');
            }
        } else {
            $this->fail('ORD-002.2', 'View order detail', 'Status 200', 'Status ' . $response['status']);
        }

        // ORD-002.3: Admin xem tất cả đơn
        $response = $this->request('GET', '/admin/orders', null, $this->adminToken);

        if ($response['status'] === 200) {
            $this->pass('ORD-002.3', 'Admin xem được tất cả đơn');
        } else {
            $this->fail('ORD-002.3', 'Admin view all orders', 'Status 200', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // ORD-003: Hủy đơn - Customer
    public function testCustomerCancelOrder()
    {
        echo "❌ ORD-003: Hủy đơn - Customer\n";
        echo str_repeat("-", 60) . "\n";

        // Create a new order for cancellation test
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1
        ], $this->customerToken);

        $cancelOrderId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;

        if (!$cancelOrderId) {
            $this->skip('ORD-003.1', 'Customer hủy đơn pending', 'Cannot create test order');
            $this->skip('ORD-003.2', 'Customer không hủy đơn confirmed', 'Cannot create test order');
            echo "\n";
            return;
        }

        // ORD-003.1: Customer hủy đơn pending
        $response = $this->request('PUT', "/orders/{$cancelOrderId}/cancel", null, $this->customerToken);

        if ($response['status'] === 200) {
            $this->pass('ORD-003.1', 'Customer hủy được đơn pending');
        } else {
            $this->fail('ORD-003.1', 'Cancel pending order', 'Status 200', 'Status ' . $response['status']);
        }

        // ORD-003.2: Customer không hủy được đơn confirmed
        // First, admin confirms the order
        $this->request('PUT', "/admin/orders/{$this->orderId}/status", [
            'status' => 'confirmed'
        ], $this->adminToken);

        $response = $this->request('PUT', "/orders/{$this->orderId}/cancel", null, $this->customerToken);

        if ($response['status'] === 403 || $response['status'] === 422 || $response['status'] === 400) {
            $this->pass('ORD-003.2', 'Customer không hủy được đơn confirmed');
        } else {
            $this->fail('ORD-003.2', 'Prevent cancel confirmed order', 'Status 400/403/422', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // ORD-004: Hủy đơn - Admin
    public function testAdminCancelOrder()
    {
        echo "🔧 ORD-004: Hủy đơn - Admin\n";
        echo str_repeat("-", 60) . "\n";

        // Create orders for admin cancellation tests
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1
        ], $this->customerToken);

        $adminCancelOrderId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;

        if (!$adminCancelOrderId) {
            $this->skip('ORD-004.1', 'Admin hủy đơn pending', 'Cannot create test order');
            $this->skip('ORD-004.2', 'Admin hủy đơn confirmed', 'Cannot create test order');
            echo "\n";
            return;
        }

        // ORD-004.1: Admin hủy đơn pending (using status update)
        $response = $this->request('PUT', "/admin/orders/{$adminCancelOrderId}/status", [
            'status' => 'cancelled'
        ], $this->adminToken);

        if ($response['status'] === 200) {
            $this->pass('ORD-004.1', 'Admin hủy được đơn pending');
        } else {
            $this->fail('ORD-004.1', 'Admin cancel pending', 'Status 200', 'Status ' . $response['status']);
        }

        // ORD-004.2: Admin hủy đơn confirmed
        // Create another order and confirm it
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1
        ], $this->customerToken);

        $confirmedOrderId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;

        if ($confirmedOrderId) {
            $this->request('PUT', "/admin/orders/{$confirmedOrderId}/status", [
                'status' => 'confirmed'
            ], $this->adminToken);

            $response = $this->request('PUT', "/admin/orders/{$confirmedOrderId}/status", [
                'status' => 'cancelled'
            ], $this->adminToken);

            if ($response['status'] === 200) {
                $this->pass('ORD-004.2', 'Admin hủy được đơn confirmed');
            } else {
                $this->fail('ORD-004.2', 'Admin cancel confirmed', 'Status 200', 'Status ' . $response['status']);
            }
        } else {
            $this->skip('ORD-004.2', 'Admin hủy đơn confirmed', 'Cannot create test order');
        }

        echo "\n";
    }

    // ORD-005: Cập nhật trạng thái
    public function testUpdateOrderStatus()
    {
        echo "🔄 ORD-005: Cập nhật trạng thái\n";
        echo str_repeat("-", 60) . "\n";

        // Create a new order for status update tests
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1
        ], $this->customerToken);

        $statusOrderId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;

        if (!$statusOrderId) {
            $this->skip('ORD-005.1', 'Update pending → confirmed', 'Cannot create test order');
            $this->skip('ORD-005.2', 'Update confirmed → processing', 'Cannot create test order');
            $this->skip('ORD-005.3', 'Update processing → shipped', 'Cannot create test order');
            echo "\n";
            return;
        }

        // ORD-005.1: pending → confirmed
        $response = $this->request('PUT', "/admin/orders/{$statusOrderId}/status", [
            'status' => 'confirmed'
        ], $this->adminToken);

        if ($response['status'] === 200) {
            $this->pass('ORD-005.1', 'Update pending → confirmed');
        } else {
            $this->fail('ORD-005.1', 'Update to confirmed', 'Status 200', 'Status ' . $response['status']);
        }

        // ORD-005.2: confirmed → processing
        $response = $this->request('PUT', "/admin/orders/{$statusOrderId}/status", [
            'status' => 'processing'
        ], $this->adminToken);

        if ($response['status'] === 200) {
            $this->pass('ORD-005.2', 'Update confirmed → processing');
        } else {
            $this->fail('ORD-005.2', 'Update to processing', 'Status 200', 'Status ' . $response['status']);
        }

        // ORD-005.3: processing → shipped
        $response = $this->request('PUT', "/admin/orders/{$statusOrderId}/status", [
            'status' => 'shipped'
        ], $this->adminToken);

        if ($response['status'] === 200) {
            $this->pass('ORD-005.3', 'Update processing → shipped');
        } else {
            $this->fail('ORD-005.3', 'Update to shipped', 'Status 200', 'Status ' . $response['status']);
        }

        echo "\n";
    }

    // ORD-006: Payment timeout
    public function testPaymentTimeout()
    {
        echo "⏰ ORD-006: Payment timeout\n";
        echo str_repeat("-", 60) . "\n";

        // ORD-006.1: Đơn online payment có expires_at
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 2, // VNPay or online payment
        ], $this->customerToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $order = $response['body']['data'] ?? $response['body'];
            if (isset($order['payment_expires_at']) && $order['payment_expires_at'] !== null) {
                $this->pass('ORD-006.1', 'Đơn online payment có payment_expires_at');
            } else {
                $this->fail('ORD-006.1', 'Payment expires_at', 'Has expires_at', 'No expires_at');
            }
        } else {
            $this->skip('ORD-006.1', 'Payment expires_at', 'Cannot create order');
        }

        // ORD-006.2: Đơn COD không có expires_at
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 1
        ], $this->customerToken);

        $response = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1, // COD
        ], $this->customerToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $order = $response['body']['data'] ?? $response['body'];
            if (!isset($order['payment_expires_at']) || $order['payment_expires_at'] === null) {
                $this->pass('ORD-006.2', 'Đơn COD không có payment_expires_at');
            } else {
                $this->fail('ORD-006.2', 'COD no expires_at', 'No expires_at', 'Has expires_at');
            }
        } else {
            $this->skip('ORD-006.2', 'COD no expires_at', 'Cannot create order');
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

        $this->testCreateOrder();
        $this->testViewOrders();
        $this->testCustomerCancelOrder();
        $this->testAdminCancelOrder();
        $this->testUpdateOrderStatus();
        $this->testPaymentTimeout();

        $this->printSummary();
    }
}

// Run tests
$test = new OrdersTest();
$test->run();
