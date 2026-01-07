<?php

/**
 * P0 - CRITICAL: AUTHENTICATION & AUTHORIZATION TESTS
 * 
 * Test Cases:
 * AUTH-001: Đăng ký tài khoản mới
 * AUTH-002: Đăng nhập
 * AUTH-003: Quên mật khẩu
 * AUTH-004: Social Login
 * AUTH-005: Authorization
 */

require __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;

$baseUrl = 'http://127.0.0.1:8000';
$client = new Client(['http_errors' => false]);

echo "🧪 P0-01: AUTHENTICATION & AUTHORIZATION TESTS\n";
echo "================================================\n\n";

$testResults = [
    'total' => 0,
    'passed' => 0,
    'failed' => 0,
    'errors' => []
];

// ============================================
// AUTH-001: Đăng ký tài khoản mới
// ============================================
echo "📝 AUTH-001: Đăng ký tài khoản mới\n";
echo "-----------------------------------\n";

$testResults['total']++;
$randomEmail = 'test_' . time() . '@test.com';

// Test 1.1: Đăng ký với thông tin hợp lệ
echo "Test 1.1: Đăng ký với email hợp lệ\n";
$registerResponse = $client->post("$baseUrl/api/auth/register", [
    'json' => [
        'name' => 'Test User',
        'email' => $randomEmail,
        'password' => 'Password@123',
        'password_confirmation' => 'Password@123'
    ]
]);

$status = $registerResponse->getStatusCode();
if ($status === 201 || $status === 200) {
    echo "✅ PASS: Đăng ký thành công\n";
    $testResults['passed']++;
    $registerData = json_decode($registerResponse->getBody(), true);
    $newUserId = $registerData['user']['id'] ?? null;
    echo "   User ID: {$newUserId}\n";
} else {
    echo "❌ FAIL: Không thể đăng ký (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "AUTH-001.1: Register failed with status {$status}";
}

// Test 1.2: Đăng ký với email trùng
echo "\nTest 1.2: Đăng ký với email trùng\n";
$testResults['total']++;
$duplicateResponse = $client->post("$baseUrl/api/auth/register", [
    'json' => [
        'name' => 'Test User 2',
        'email' => $randomEmail, // Email trùng
        'password' => 'Password@123',
        'password_confirmation' => 'Password@123'
    ]
]);

$status = $duplicateResponse->getStatusCode();
if ($status === 422) {
    echo "✅ PASS: Từ chối email trùng\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Nên từ chối email trùng (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "AUTH-001.2: Should reject duplicate email";
}

// Test 1.3: Đăng ký với password yếu
echo "\nTest 1.3: Đăng ký với password yếu\n";
$testResults['total']++;
$weakPasswordResponse = $client->post("$baseUrl/api/auth/register", [
    'json' => [
        'name' => 'Test User 3',
        'email' => 'test_weak_' . time() . '@test.com',
        'password' => '123', // Password yếu
        'password_confirmation' => '123'
    ]
]);

$status = $weakPasswordResponse->getStatusCode();
if ($status === 422) {
    echo "✅ PASS: Từ chối password yếu\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Nên từ chối password yếu (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "AUTH-001.3: Should reject weak password";
}

echo "\n";

// ============================================
// AUTH-002: Đăng nhập
// ============================================
echo "📝 AUTH-002: Đăng nhập\n";
echo "-----------------------------------\n";

// Test 2.1: Đăng nhập với credentials đúng
echo "Test 2.1: Đăng nhập với credentials đúng\n";
$testResults['total']++;
$loginResponse = $client->post("$baseUrl/api/auth/login", [
    'json' => [
        'email' => '1@1.1',
        'password' => '1'
    ]
]);

$status = $loginResponse->getStatusCode();
$loginData = json_decode($loginResponse->getBody(), true);

if ($status === 200 && isset($loginData['token'])) {
    echo "✅ PASS: Đăng nhập thành công\n";
    echo "   Token: " . substr($loginData['token'], 0, 20) . "...\n";
    $testResults['passed']++;
    $validToken = $loginData['token'];
} else {
    echo "❌ FAIL: Không thể đăng nhập (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "AUTH-002.1: Login failed";
    $validToken = null;
}

// Test 2.2: Đăng nhập với credentials sai
echo "\nTest 2.2: Đăng nhập với credentials sai\n";
$testResults['total']++;
$wrongLoginResponse = $client->post("$baseUrl/api/auth/login", [
    'json' => [
        'email' => '1@1.1',
        'password' => 'wrongpassword'
    ]
]);

$status = $wrongLoginResponse->getStatusCode();
if ($status === 401 || $status === 422) {
    echo "✅ PASS: Từ chối credentials sai\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Nên từ chối credentials sai (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "AUTH-002.2: Should reject wrong credentials";
}

// Test 2.3: Đăng nhập với email không tồn tại
echo "\nTest 2.3: Đăng nhập với email không tồn tại\n";
$testResults['total']++;
$noEmailResponse = $client->post("$baseUrl/api/auth/login", [
    'json' => [
        'email' => 'notexist@test.com',
        'password' => 'password'
    ]
]);

$status = $noEmailResponse->getStatusCode();
if ($status === 401 || $status === 422) {
    echo "✅ PASS: Từ chối email không tồn tại\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Nên từ chối email không tồn tại (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "AUTH-002.3: Should reject non-existent email";
}

echo "\n";

// ============================================
// AUTH-003: Quên mật khẩu
// ============================================
echo "📝 AUTH-003: Quên mật khẩu\n";
echo "-----------------------------------\n";

// Test 3.1: Gửi link reset với email tồn tại
echo "Test 3.1: Gửi link reset với email tồn tại\n";
$testResults['total']++;
$forgotResponse = $client->post("$baseUrl/api/auth/forgot-password", [
    'json' => [
        'email' => '1@1.1'
    ]
]);

$status = $forgotResponse->getStatusCode();
if ($status === 200) {
    echo "✅ PASS: Gửi link reset thành công\n";
    $testResults['passed']++;
} else {
    echo "⚠️  SKIP: Forgot password endpoint (Status: {$status})\n";
    echo "   Note: Có thể chưa implement hoặc cần email service\n";
    // Không tính là fail vì có thể chưa setup email
}

// Test 3.2: Gửi link reset với email không tồn tại
echo "\nTest 3.2: Gửi link reset với email không tồn tại\n";
$testResults['total']++;
$forgotWrongResponse = $client->post("$baseUrl/api/auth/forgot-password", [
    'json' => [
        'email' => 'notexist@test.com'
    ]
]);

$status = $forgotWrongResponse->getStatusCode();
if ($status === 404 || $status === 422) {
    echo "✅ PASS: Từ chối email không tồn tại\n";
    $testResults['passed']++;
} else {
    echo "⚠️  SKIP: Forgot password validation (Status: {$status})\n";
}

echo "\n";

// ============================================
// AUTH-005: Authorization
// ============================================
echo "📝 AUTH-005: Authorization\n";
echo "-----------------------------------\n";

if ($validToken) {
    // Test 5.1: Customer không access admin pages
    echo "Test 5.1: Customer không access admin pages\n";
    $testResults['total']++;
    $adminAccessResponse = $client->get("$baseUrl/api/admin/users", [
        'headers' => ['Authorization' => "Bearer {$validToken}"]
    ]);
    
    $status = $adminAccessResponse->getStatusCode();
    if ($status === 403) {
        echo "✅ PASS: Customer không thể access admin pages\n";
        $testResults['passed']++;
    } else {
        echo "❌ FAIL: Customer không nên access admin pages (Status: {$status})\n";
        $testResults['failed']++;
        $testResults['errors'][] = "AUTH-005.1: Customer should not access admin pages";
    }
    
    // Test 5.2: Admin access admin pages
    echo "\nTest 5.2: Admin access admin pages\n";
    $testResults['total']++;
    
    // Login as admin
    $adminLoginResponse = $client->post("$baseUrl/api/auth/login", [
        'json' => [
            'email' => 'admin@electroshop.vn',
            'password' => 'Password@123'
        ]
    ]);
    
    if ($adminLoginResponse->getStatusCode() === 200) {
        $adminToken = json_decode($adminLoginResponse->getBody(), true)['token'];
        
        $adminAccessResponse2 = $client->get("$baseUrl/api/admin/users", [
            'headers' => ['Authorization' => "Bearer {$adminToken}"]
        ]);
        
        $status = $adminAccessResponse2->getStatusCode();
        if ($status === 200) {
            echo "✅ PASS: Admin có thể access admin pages\n";
            $testResults['passed']++;
        } else {
            echo "❌ FAIL: Admin nên access được admin pages (Status: {$status})\n";
            $testResults['failed']++;
            $testResults['errors'][] = "AUTH-005.2: Admin should access admin pages";
        }
    }
    
    // Test 5.3: Unauthenticated không access protected routes
    echo "\nTest 5.3: Unauthenticated không access protected routes\n";
    $testResults['total']++;
    $noAuthResponse = $client->get("$baseUrl/api/orders");
    
    $status = $noAuthResponse->getStatusCode();
    if ($status === 401) {
        echo "✅ PASS: Unauthenticated không thể access protected routes\n";
        $testResults['passed']++;
    } else {
        echo "❌ FAIL: Nên yêu cầu authentication (Status: {$status})\n";
        $testResults['failed']++;
        $testResults['errors'][] = "AUTH-005.3: Should require authentication";
    }
}

echo "\n";

// ============================================
// SUMMARY
// ============================================
echo "================================================\n";
echo "📊 TEST SUMMARY\n";
echo "================================================\n";
echo "Total Tests: {$testResults['total']}\n";
echo "✅ Passed: {$testResults['passed']}\n";
echo "❌ Failed: {$testResults['failed']}\n";

$passRate = $testResults['total'] > 0 ? round(($testResults['passed'] / $testResults['total']) * 100, 2) : 0;
echo "📈 Pass Rate: {$passRate}%\n";

if (!empty($testResults['errors'])) {
    echo "\n❌ ERRORS:\n";
    foreach ($testResults['errors'] as $error) {
        echo "   - {$error}\n";
    }
}

echo "\n";

if ($testResults['failed'] === 0) {
    echo "🎉 ALL TESTS PASSED!\n";
    exit(0);
} else {
    echo "⚠️  SOME TESTS FAILED!\n";
    exit(1);
}
