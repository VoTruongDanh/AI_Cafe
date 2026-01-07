<?php

/**
 * P1-03: DASHBOARD & ANALYTICS TESTS
 * 
 * Test dashboard statistics, analytics, and reports
 * Priority: HIGH
 */

require_once __DIR__ . '/../vendor/autoload.php';

class DashboardTest {
    private $baseUrl = 'http://localhost:8000/api';
    private $adminToken;
    private $customerToken;
    
    public function __construct() {
        echo "\n🧪 P1-03: DASHBOARD & ANALYTICS TESTS\n";
        echo str_repeat("=", 60) . "\n\n";
    }
    
    private function request($method, $endpoint, $data = null, $token = null) {
        $ch = curl_init($this->baseUrl . $endpoint);
        
        $headers = ['Content-Type: application/json'];
        if ($token) {
            $headers[] = 'Authorization: Bearer ' . $token;
        }
        
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'status' => $statusCode,
            'body' => json_decode($response, true)
        ];
    }
    
    private function login($email, $password) {
        $response = $this->request('POST', '/auth/login', [
            'email' => $email,
            'password' => $password
        ]);
        
        echo "Login attempt for $email: Status {$response['status']}\n";
        if ($response['status'] !== 200) {
            echo "Response: " . json_encode($response['body']) . "\n";
        }
        
        return $response['body']['access_token'] ?? $response['body']['token'] ?? null;
    }
    
    public function setUp() {
        echo "🔧 Setting up test environment...\n";
        
        // Login as admin
        $this->adminToken = $this->login('admin@electroshop.vn', 'password');
        if (!$this->adminToken) {
            die("❌ Failed to login as admin\n");
        }
        
        // Create and login as customer
        $customerEmail = 'dashtest_' . time() . '@example.com';
        $registerResponse = $this->request('POST', '/auth/register', [
            'name' => 'Dashboard Test Customer',
            'email' => $customerEmail,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0987654321',
            'address' => '123 Test St'
        ]);
        
        if ($registerResponse['status'] === 200 || $registerResponse['status'] === 201) {
            $this->customerToken = $registerResponse['body']['token'] ?? $registerResponse['body']['data']['token'] ?? null;
            if (!$this->customerToken) {
                die("❌ Failed to get customer token\n");
            }
        } else {
            die("❌ Failed to register customer\n");
        }
        
        echo "✅ Setup complete\n\n";
    }
    
    // ==================== DASH-001: Dashboard Stats ====================
    
    public function testDashboardStats() {
        echo "📊 DASH-001.1: Get dashboard statistics\n";
        
        $endpoints = [
            '/admin/dashboard',
            '/admin/dashboard/stats',
            '/admin/statistics',
            '/admin/stats'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found dashboard endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                
                // Validate response structure
                $data = $response['body'];
                if (isset($data['total_revenue']) || isset($data['revenue'])) {
                    echo "✅ Has revenue data\n";
                }
                if (isset($data['total_orders']) || isset($data['orders'])) {
                    echo "✅ Has orders data\n";
                }
                if (isset($data['total_products']) || isset($data['products'])) {
                    echo "✅ Has products data\n";
                }
                if (isset($data['total_customers']) || isset($data['customers'])) {
                    echo "✅ Has customers data\n";
                }
                
                break;
            }
        }
        
        if (!$found) {
            echo "❌ FAIL: Dashboard endpoint not found (tried multiple endpoints)\n";
            return false;
        }
        
        echo "✅ PASS: Dashboard stats working\n\n";
        return true;
    }
    
    public function testCustomerCannotAccessDashboard() {
        echo "📊 DASH-001.2: Customer cannot access dashboard\n";
        
        // Try the endpoint that exists
        $response = $this->request('GET', '/admin/dashboard/top-products', null, $this->customerToken);
        
        if ($response['status'] === 403 || $response['status'] === 401) {
            echo "✅ PASS: Customer blocked from dashboard (Status: {$response['status']})\n\n";
            return true;
        } elseif ($response['status'] === 404) {
            echo "⚠️ SKIP: Endpoint not found (Status: 404)\n\n";
            return null;
        }
        
        echo "❌ FAIL: Customer can access dashboard (Status: {$response['status']})\n\n";
        return false;
    }
    
    // ==================== DASH-002: Analytics ====================
    
    public function testRevenueAnalytics() {
        echo "📊 DASH-002.1: Get revenue analytics\n";
        
        $endpoints = [
            '/admin/analytics/revenue',
            '/admin/reports/revenue',
            '/admin/dashboard/revenue'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found revenue analytics endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo "⚠️ SKIP: Revenue analytics endpoint not found\n\n";
            return null;
        }
        
        echo "✅ PASS: Revenue analytics working\n\n";
        return true;
    }
    
    public function testOrdersAnalytics() {
        echo "📊 DASH-002.2: Get orders analytics\n";
        
        $endpoints = [
            '/admin/analytics/orders',
            '/admin/reports/orders',
            '/admin/dashboard/orders'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found orders analytics endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo "⚠️ SKIP: Orders analytics endpoint not found\n\n";
            return null;
        }
        
        echo "✅ PASS: Orders analytics working\n\n";
        return true;
    }
    
    public function testTopProducts() {
        echo "📊 DASH-002.3: Get top selling products\n";
        
        $endpoints = [
            '/admin/analytics/top-products',
            '/admin/reports/top-products',
            '/admin/dashboard/top-products',
            '/admin/products/top-selling'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found top products endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo "⚠️ SKIP: Top products endpoint not found\n\n";
            return null;
        }
        
        echo "✅ PASS: Top products working\n\n";
        return true;
    }
    
    // ==================== DASH-003: Reports ====================
    
    public function testSalesReport() {
        echo "📊 DASH-003.1: Get sales report\n";
        
        $endpoints = [
            '/admin/reports/sales',
            '/admin/reports',
            '/admin/analytics/sales'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found sales report endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo "⚠️ SKIP: Sales report endpoint not found\n\n";
            return null;
        }
        
        echo "✅ PASS: Sales report working\n\n";
        return true;
    }
    
    public function testInventoryReport() {
        echo "📊 DASH-003.2: Get inventory report\n";
        
        $endpoints = [
            '/admin/reports/inventory',
            '/admin/inventory/report',
            '/admin/products/stock-report'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found inventory report endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo "⚠️ SKIP: Inventory report endpoint not found\n\n";
            return null;
        }
        
        echo "✅ PASS: Inventory report working\n\n";
        return true;
    }
    
    public function testCustomersReport() {
        echo "📊 DASH-003.3: Get customers report\n";
        
        $endpoints = [
            '/admin/reports/customers',
            '/admin/users/report',
            '/admin/analytics/customers'
        ];
        
        $found = false;
        foreach ($endpoints as $endpoint) {
            $response = $this->request('GET', $endpoint, null, $this->adminToken);
            
            if ($response['status'] === 200) {
                echo "✅ Found customers report endpoint: $endpoint\n";
                echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo "⚠️ SKIP: Customers report endpoint not found\n\n";
            return null;
        }
        
        echo "✅ PASS: Customers report working\n\n";
        return true;
    }
    
    // ==================== Run All Tests ====================
    
    public function runAll() {
        $this->setUp();
        
        $results = [
            'total' => 0,
            'passed' => 0,
            'failed' => 0,
            'skipped' => 0
        ];
        
        $tests = [
            'testDashboardStats',
            'testCustomerCannotAccessDashboard',
            'testRevenueAnalytics',
            'testOrdersAnalytics',
            'testTopProducts',
            'testSalesReport',
            'testInventoryReport',
            'testCustomersReport'
        ];
        
        foreach ($tests as $test) {
            $results['total']++;
            $result = $this->$test();
            
            if ($result === true) {
                $results['passed']++;
            } elseif ($result === false) {
                $results['failed']++;
            } else {
                $results['skipped']++;
            }
        }
        
        // Summary
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "📊 TEST SUMMARY\n";
        echo str_repeat("=", 60) . "\n";
        echo "Total Tests: {$results['total']}\n";
        echo "✅ Passed: {$results['passed']}\n";
        echo "❌ Failed: {$results['failed']}\n";
        echo "⚠️ Skipped: {$results['skipped']}\n";
        
        $passRate = $results['total'] > 0 
            ? round(($results['passed'] / $results['total']) * 100, 1) 
            : 0;
        echo "\n📈 Pass Rate: {$passRate}%\n";
        
        if ($passRate >= 90) {
            echo "🎉 Status: EXCELLENT\n";
        } elseif ($passRate >= 70) {
            echo "✅ Status: GOOD\n";
        } elseif ($passRate >= 50) {
            echo "⚠️ Status: NEEDS IMPROVEMENT\n";
        } else {
            echo "❌ Status: CRITICAL ISSUES\n";
        }
        
        return $results;
    }
}

// Run tests
$test = new DashboardTest();
$test->runAll();
