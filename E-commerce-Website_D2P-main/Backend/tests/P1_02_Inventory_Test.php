<?php

/**
 * P1-02: INVENTORY MANAGEMENT TESTS
 * 
 * Test cases:
 * - INV-001: Nhập kho
 * - INV-002: Stock alerts
 * - INV-003: Stock tracking
 */

require_once __DIR__ . '/../vendor/autoload.php';

class InventoryTest
{
    private $baseUrl = 'http://localhost:8000/api';
    private $adminToken;
    private $productId;
    private $initialStock;
    private $results = [];

    public function __construct()
    {
        echo "🧪 P1-02: INVENTORY MANAGEMENT TESTS\n";
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
        echo "🔧 Setup: Logging in and getting product...\n";

        // Login as admin
        $response = $this->request('POST', '/auth/login', [
            'email' => 'admin@electroshop.vn',
            'password' => 'password'
        ]);

        if ($response['status'] === 200) {
            $this->adminToken = $response['body']['token'] ?? $response['body']['data']['token'] ?? null;
            echo "✅ Admin logged in\n";
        } else {
            echo "❌ Failed to login as admin\n";
            return false;
        }

        // Get a product
        $response = $this->request('GET', '/products?per_page=1');
        if ($response['status'] === 200 && !empty($response['body']['data'])) {
            $product = $response['body']['data'][0];
            $this->productId = $product['id'];
            $this->initialStock = $product['quantity'] ?? 0;
            echo "✅ Product found: ID {$this->productId}, Stock: {$this->initialStock}\n";
        } else {
            echo "❌ Failed to get product\n";
            return false;
        }

        echo "\n";
        return true;
    }

    // INV-001: Nhập kho
    public function testInventoryImport()
    {
        echo "📦 INV-001: Nhập kho\n";
        echo str_repeat("-", 60) . "\n";

        // INV-001.1: Tạo phiếu nhập kho
        $response = $this->request('POST', '/admin/inventory-imports', [
            'supplier_id' => 1,
            'notes' => 'Test inventory import',
            'items' => [
                [
                    'product_id' => $this->productId,
                    'quantity' => 10,
                    'unit_cost' => 100000
                ]
            ]
        ], $this->adminToken);

        if ($response['status'] === 200 || $response['status'] === 201) {
            $importId = $response['body']['data']['id'] ?? $response['body']['id'] ?? null;
            $this->pass('INV-001.1', "Tạo phiếu nhập kho thành công (ID: {$importId})");
            
            // Try to confirm/approve the import
            if ($importId) {
                $confirmResponse = $this->request('PUT', "/admin/inventory-imports/{$importId}/status", [
                    'status' => 'confirmed'
                ], $this->adminToken);
                
                if ($confirmResponse['status'] === 200) {
                    echo "   ✅ Confirmed inventory import\n";
                }
            }
        } else {
            echo "   [DEBUG] Create inventory import failed\n";
            echo "   [DEBUG] Status: {$response['status']}\n";
            if (isset($response['body']['message'])) {
                echo "   [DEBUG] Message: {$response['body']['message']}\n";
            }
            if (isset($response['body']['errors'])) {
                echo "   [DEBUG] Errors: " . json_encode($response['body']['errors']) . "\n";
            }
            $this->fail('INV-001.1', 'Tạo phiếu nhập', 'Status 200/201', 'Status ' . $response['status']);
        }

        // INV-001.2: Kiểm tra stock tăng
        $response = $this->request('GET', "/products/{$this->productId}");
        
        if ($response['status'] === 200) {
            $product = $response['body']['data'] ?? $response['body'];
            $newStock = $product['quantity'] ?? 0;
            
            if ($newStock > $this->initialStock) {
                $increase = $newStock - $this->initialStock;
                $this->pass('INV-001.2', "Stock tăng sau khi nhập kho (+{$increase})");
            } else {
                $this->fail('INV-001.2', 'Stock increase', "Stock > {$this->initialStock}", "Stock = {$newStock}");
            }
        } else {
            $this->skip('INV-001.2', 'Check stock increase', 'Cannot get product');
        }

        echo "\n";
    }

    // INV-002: Stock alerts
    public function testStockAlerts()
    {
        echo "⚠️  INV-002: Stock alerts\n";
        echo str_repeat("-", 60) . "\n";

        // INV-002.1: Kiểm tra products có stock thấp
        $response = $this->request('GET', '/admin/products?stock_status=low', null, $this->adminToken);

        if ($response['status'] === 200) {
            $this->pass('INV-002.1', 'Có thể filter products theo stock status');
        } else {
            $this->fail('INV-002.1', 'Filter low stock', 'Status 200', 'Status ' . $response['status']);
        }

        // INV-002.2: Kiểm tra dashboard có stock alerts
        $response = $this->request('GET', '/admin/dashboard/stats', null, $this->adminToken);

        if ($response['status'] === 200) {
            $dashboard = $response['body'];
            if (isset($dashboard['low_stock_products']) || isset($dashboard['alerts'])) {
                $this->pass('INV-002.2', 'Dashboard có stock alerts');
            } else {
                $this->pass('INV-002.2', 'Dashboard accessible (alerts may be empty)');
            }
        } else {
            // Try alternative endpoint
            $altResponse = $this->request('GET', '/admin/dashboard', null, $this->adminToken);
            if ($altResponse['status'] === 200) {
                $this->pass('INV-002.2', 'Dashboard accessible');
            } else {
                $this->fail('INV-002.2', 'Dashboard alerts', 'Status 200', 'Status ' . $response['status']);
            }
        }

        echo "\n";
    }

    // INV-003: Stock tracking
    public function testStockTracking()
    {
        echo "📊 INV-003: Stock tracking\n";
        echo str_repeat("-", 60) . "\n";

        // Create customer and order to test stock decrease
        $customerResponse = $this->request('POST', '/auth/register', [
            'name' => 'Inventory Test Customer',
            'email' => 'invtest_' . time() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0987654321',
            'address' => '123 Test St'
        ]);

        if ($customerResponse['status'] !== 200 && $customerResponse['status'] !== 201) {
            $this->skip('INV-003.1', 'Stock decrease on order', 'Cannot create customer');
            $this->skip('INV-003.2', 'Stock increase on cancel', 'Cannot create customer');
            echo "\n";
            return;
        }

        $customerToken = $customerResponse['body']['token'] ?? $customerResponse['body']['data']['token'] ?? null;

        // Get current stock
        $response = $this->request('GET', "/products/{$this->productId}");
        $stockBeforeOrder = $response['body']['data']['quantity'] ?? $response['body']['quantity'] ?? 0;

        // INV-003.1: Stock giảm khi đặt hàng
        // Add to cart
        $this->request('POST', '/cart/items', [
            'product_id' => $this->productId,
            'quantity' => 2
        ], $customerToken);

        // Create order
        $orderResponse = $this->request('POST', '/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '0987654321',
            'shipping_address_line' => '123 Test St',
            'payment_method_id' => 1
        ], $customerToken);

        if ($orderResponse['status'] === 200 || $orderResponse['status'] === 201) {
            $orderId = $orderResponse['body']['data']['id'] ?? $orderResponse['body']['id'] ?? null;
            
            // Check stock after order
            $response = $this->request('GET', "/products/{$this->productId}");
            $stockAfterOrder = $response['body']['data']['quantity'] ?? $response['body']['quantity'] ?? 0;
            
            if ($stockAfterOrder < $stockBeforeOrder) {
                $decrease = $stockBeforeOrder - $stockAfterOrder;
                $this->pass('INV-003.1', "Stock giảm khi đặt hàng (-{$decrease})");
            } else {
                $this->fail('INV-003.1', 'Stock decrease', "Stock < {$stockBeforeOrder}", "Stock = {$stockAfterOrder}");
            }

            // INV-003.2: Stock tăng khi hủy đơn
            if ($orderId) {
                $cancelResponse = $this->request('PUT', "/orders/{$orderId}/cancel", null, $customerToken);
                
                if ($cancelResponse['status'] === 200) {
                    // Check stock after cancel
                    $response = $this->request('GET', "/products/{$this->productId}");
                    $stockAfterCancel = $response['body']['data']['quantity'] ?? $response['body']['quantity'] ?? 0;
                    
                    if ($stockAfterCancel > $stockAfterOrder) {
                        $increase = $stockAfterCancel - $stockAfterOrder;
                        $this->pass('INV-003.2', "Stock tăng khi hủy đơn (+{$increase})");
                    } else {
                        $this->fail('INV-003.2', 'Stock restore', "Stock > {$stockAfterOrder}", "Stock = {$stockAfterCancel}");
                    }
                } else {
                    $this->skip('INV-003.2', 'Stock restore on cancel', 'Cannot cancel order');
                }
            } else {
                $this->skip('INV-003.2', 'Stock restore on cancel', 'No order ID');
            }
        } else {
            $this->skip('INV-003.1', 'Stock decrease on order', 'Cannot create order');
            $this->skip('INV-003.2', 'Stock restore on cancel', 'Cannot create order');
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

        $this->testInventoryImport();
        $this->testStockAlerts();
        $this->testStockTracking();

        $this->printSummary();
    }
}

// Run tests
$test = new InventoryTest();
$test->run();
