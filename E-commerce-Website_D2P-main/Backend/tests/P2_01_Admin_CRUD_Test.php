<?php

/**
 * P2-01: ADMIN CRUD OPERATIONS TESTS
 * 
 * Test all Create, Read, Update, Delete operations in Admin panel
 * Priority: MEDIUM
 * 
 * Modules to test:
 * 1. Categories (CRUD)
 * 2. Products (CRUD)
 * 3. Users (CRUD)
 * 4. Suppliers (CRUD)
 * 5. Payment Methods (CRUD)
 * 6. Promotions (CRUD)
 */

require_once __DIR__ . '/../vendor/autoload.php';

class AdminCRUDTest {
    private $baseUrl = 'http://localhost:8000/api';
    private $adminToken;
    private $createdIds = []; // Track created items for cleanup
    
    public function __construct() {
        echo "\n🧪 P2-01: ADMIN CRUD OPERATIONS TESTS\n";
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
        
        return $response['body']['access_token'] ?? $response['body']['token'] ?? null;
    }
    
    public function setUp() {
        echo "🔧 Setting up test environment...\n";
        
        // Login as admin
        $this->adminToken = $this->login('admin@electroshop.vn', 'password');
        if (!$this->adminToken) {
            die("❌ Failed to login as admin\n");
        }
        
        echo "✅ Setup complete\n\n";
    }
    
    // ==================== CATEGORIES CRUD ====================
    
    public function testCategoriesCRUD() {
        echo "📁 TEST: Categories CRUD\n";
        echo str_repeat("-", 60) . "\n";
        
        $results = ['total' => 4, 'passed' => 0, 'failed' => 0];
        
        // CREATE
        echo "1️⃣ CREATE: Tạo category mới\n";
        $createData = [
            'name' => 'Test Category ' . time(),
            'slug' => 'test-category-' . time(),
            'description' => 'Test description',
            'is_active' => true
        ];
        
        $response = $this->request('POST', '/admin/categories', $createData, $this->adminToken);
        
        if ($response['status'] === 201 || $response['status'] === 200) {
            $categoryId = $response['body']['id'] ?? $response['body']['data']['id'] ?? null;
            if ($categoryId) {
                echo "   ✅ PASS: Created category ID $categoryId\n";
                $this->createdIds['categories'][] = $categoryId;
                $results['passed']++;
            } else {
                echo "   ❌ FAIL: No ID in response\n";
                $results['failed']++;
            }
        } else {
            echo "   ❌ FAIL: Status {$response['status']}\n";
            echo "   Response: " . json_encode($response['body']) . "\n";
            $results['failed']++;
        }
        
        if (!isset($categoryId)) {
            echo "   ⚠️ Skipping remaining tests (no category created)\n\n";
            return $results;
        }
        
        // READ
        echo "2️⃣ READ: Lấy thông tin category\n";
        $response = $this->request('GET', "/admin/categories/$categoryId", null, $this->adminToken);
        
        if ($response['status'] === 200 && isset($response['body']['id'])) {
            echo "   ✅ PASS: Retrieved category\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot retrieve category\n";
            $results['failed']++;
        }
        
        // UPDATE
        echo "3️⃣ UPDATE: Cập nhật category\n";
        $updateData = [
            'name' => 'Updated Category ' . time(),
            'description' => 'Updated description'
        ];
        
        $response = $this->request('PUT', "/admin/categories/$categoryId", $updateData, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Updated category\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot update category (Status: {$response['status']})\n";
            $results['failed']++;
        }
        
        // DELETE
        echo "4️⃣ DELETE: Xóa category\n";
        $response = $this->request('DELETE', "/admin/categories/$categoryId", null, $this->adminToken);
        
        if ($response['status'] === 200 || $response['status'] === 204) {
            echo "   ✅ PASS: Deleted category\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot delete category (Status: {$response['status']})\n";
            $results['failed']++;
        }
        
        echo "\n";
        return $results;
    }
    
    // ==================== SUPPLIERS CRUD ====================
    
    public function testSuppliersCRUD() {
        echo "🏭 TEST: Suppliers CRUD\n";
        echo str_repeat("-", 60) . "\n";
        
        $results = ['total' => 4, 'passed' => 0, 'failed' => 0];
        
        // CREATE
        echo "1️⃣ CREATE: Tạo supplier mới\n";
        $createData = [
            'name' => 'Test Supplier ' . time(),
            'contact_person' => 'John Doe',
            'phone' => '0987654321',
            'email' => 'supplier' . time() . '@test.com',
            'address' => '123 Test St'
        ];
        
        $response = $this->request('POST', '/admin/suppliers', $createData, $this->adminToken);
        
        if ($response['status'] === 201 || $response['status'] === 200) {
            $supplierId = $response['body']['id'] ?? $response['body']['data']['id'] ?? null;
            if ($supplierId) {
                echo "   ✅ PASS: Created supplier ID $supplierId\n";
                $this->createdIds['suppliers'][] = $supplierId;
                $results['passed']++;
            } else {
                echo "   ❌ FAIL: No ID in response\n";
                $results['failed']++;
            }
        } else {
            echo "   ❌ FAIL: Status {$response['status']}\n";
            $results['failed']++;
        }
        
        if (!isset($supplierId)) {
            echo "   ⚠️ Skipping remaining tests\n\n";
            return $results;
        }
        
        // READ
        echo "2️⃣ READ: Lấy thông tin supplier\n";
        $response = $this->request('GET', "/admin/suppliers/$supplierId", null, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Retrieved supplier\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot retrieve supplier\n";
            $results['failed']++;
        }
        
        // UPDATE
        echo "3️⃣ UPDATE: Cập nhật supplier\n";
        $updateData = [
            'name' => 'Updated Supplier ' . time(),
            'phone' => '0912345678'
        ];
        
        $response = $this->request('PUT', "/admin/suppliers/$supplierId", $updateData, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Updated supplier\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot update supplier\n";
            $results['failed']++;
        }
        
        // DELETE
        echo "4️⃣ DELETE: Xóa supplier\n";
        $response = $this->request('DELETE', "/admin/suppliers/$supplierId", null, $this->adminToken);
        
        if ($response['status'] === 200 || $response['status'] === 204) {
            echo "   ✅ PASS: Deleted supplier\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot delete supplier\n";
            $results['failed']++;
        }
        
        echo "\n";
        return $results;
    }
    
    // ==================== USERS CRUD ====================
    
    public function testUsersCRUD() {
        echo "👥 TEST: Users CRUD\n";
        echo str_repeat("-", 60) . "\n";
        
        $results = ['total' => 4, 'passed' => 0, 'failed' => 0];
        
        // CREATE
        echo "1️⃣ CREATE: Tạo user mới\n";
        $createData = [
            'name' => 'Test User ' . time(),
            'email' => 'testuser' . time() . '@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'customer',
            'phone' => '0987654321'
        ];
        
        $response = $this->request('POST', '/admin/users', $createData, $this->adminToken);
        
        if ($response['status'] === 201 || $response['status'] === 200) {
            $userId = $response['body']['id'] ?? $response['body']['data']['id'] ?? null;
            if ($userId) {
                echo "   ✅ PASS: Created user ID $userId\n";
                $this->createdIds['users'][] = $userId;
                $results['passed']++;
            } else {
                echo "   ❌ FAIL: No ID in response\n";
                $results['failed']++;
            }
        } else {
            echo "   ❌ FAIL: Status {$response['status']}\n";
            $results['failed']++;
        }
        
        if (!isset($userId)) {
            echo "   ⚠️ Skipping remaining tests\n\n";
            return $results;
        }
        
        // READ
        echo "2️⃣ READ: Lấy thông tin user\n";
        $response = $this->request('GET', "/admin/users/$userId", null, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Retrieved user\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot retrieve user\n";
            $results['failed']++;
        }
        
        // UPDATE
        echo "3️⃣ UPDATE: Cập nhật user\n";
        $updateData = [
            'name' => 'Updated User ' . time(),
            'phone' => '0912345678'
        ];
        
        $response = $this->request('PUT', "/admin/users/$userId", $updateData, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Updated user\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot update user\n";
            $results['failed']++;
        }
        
        // DELETE
        echo "4️⃣ DELETE: Xóa user\n";
        $response = $this->request('DELETE', "/admin/users/$userId", null, $this->adminToken);
        
        if ($response['status'] === 200 || $response['status'] === 204) {
            echo "   ✅ PASS: Deleted user\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot delete user\n";
            $results['failed']++;
        }
        
        echo "\n";
        return $results;
    }
    
    // ==================== PAYMENT METHODS CRUD ====================
    
    public function testPaymentMethodsCRUD() {
        echo "💳 TEST: Payment Methods CRUD\n";
        echo str_repeat("-", 60) . "\n";
        
        $results = ['total' => 4, 'passed' => 0, 'failed' => 0];
        
        // CREATE
        echo "1️⃣ CREATE: Tạo payment method mới\n";
        $createData = [
            'name' => 'Test Payment ' . time(),
            'code' => 'TEST_' . time(),
            'description' => 'Test payment method',
            'is_active' => true
        ];
        
        $response = $this->request('POST', '/payment-methods', $createData, $this->adminToken);
        
        if ($response['status'] === 201 || $response['status'] === 200) {
            $pmId = $response['body']['id'] ?? $response['body']['data']['id'] ?? null;
            if ($pmId) {
                echo "   ✅ PASS: Created payment method ID $pmId\n";
                $this->createdIds['payment_methods'][] = $pmId;
                $results['passed']++;
            } else {
                echo "   ❌ FAIL: No ID in response\n";
                $results['failed']++;
            }
        } else {
            echo "   ❌ FAIL: Status {$response['status']}\n";
            $results['failed']++;
        }
        
        if (!isset($pmId)) {
            echo "   ⚠️ Skipping remaining tests\n\n";
            return $results;
        }
        
        // READ
        echo "2️⃣ READ: Lấy thông tin payment method\n";
        $response = $this->request('GET', "/payment-methods/$pmId", null, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Retrieved payment method\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot retrieve payment method\n";
            $results['failed']++;
        }
        
        // UPDATE
        echo "3️⃣ UPDATE: Cập nhật payment method\n";
        $updateData = [
            'name' => 'Updated Payment ' . time(),
            'is_active' => false
        ];
        
        $response = $this->request('PUT', "/payment-methods/$pmId", $updateData, $this->adminToken);
        
        if ($response['status'] === 200) {
            echo "   ✅ PASS: Updated payment method\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot update payment method\n";
            $results['failed']++;
        }
        
        // DELETE
        echo "4️⃣ DELETE: Xóa payment method\n";
        $response = $this->request('DELETE', "/payment-methods/$pmId", null, $this->adminToken);
        
        if ($response['status'] === 200 || $response['status'] === 204) {
            echo "   ✅ PASS: Deleted payment method\n";
            $results['passed']++;
        } else {
            echo "   ❌ FAIL: Cannot delete payment method\n";
            $results['failed']++;
        }
        
        echo "\n";
        return $results;
    }
    
    // ==================== Run All Tests ====================
    
    public function runAll() {
        $this->setUp();
        
        $allResults = [
            'total' => 0,
            'passed' => 0,
            'failed' => 0
        ];
        
        $tests = [
            'Categories' => 'testCategoriesCRUD',
            'Suppliers' => 'testSuppliersCRUD',
            'Users' => 'testUsersCRUD',
            'Payment Methods' => 'testPaymentMethodsCRUD',
        ];
        
        foreach ($tests as $name => $method) {
            $result = $this->$method();
            $allResults['total'] += $result['total'];
            $allResults['passed'] += $result['passed'];
            $allResults['failed'] += $result['failed'];
        }
        
        // Summary
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "📊 TEST SUMMARY\n";
        echo str_repeat("=", 60) . "\n";
        echo "Total Tests: {$allResults['total']}\n";
        echo "✅ Passed: {$allResults['passed']}\n";
        echo "❌ Failed: {$allResults['failed']}\n";
        
        $passRate = $allResults['total'] > 0 
            ? round(($allResults['passed'] / $allResults['total']) * 100, 1) 
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
        
        return $allResults;
    }
}

// Run tests
$test = new AdminCRUDTest();
$test->runAll();
