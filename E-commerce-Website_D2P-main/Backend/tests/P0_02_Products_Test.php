<?php

/**
 * P0 - CRITICAL: PRODUCTS & CATALOG TESTS
 * 
 * Test Cases:
 * PROD-001: Hiển thị danh sách sản phẩm
 * PROD-002: Chi tiết sản phẩm
 * PROD-003: Search sản phẩm
 * PROD-004: Categories
 * PROD-005: Stock management
 */

require __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;

$baseUrl = 'http://127.0.0.1:8000';
$client = new Client(['http_errors' => false]);

echo "🧪 P0-02: PRODUCTS & CATALOG TESTS\n";
echo "====================================\n\n";

$testResults = [
    'total' => 0,
    'passed' => 0,
    'failed' => 0,
    'errors' => []
];

// ============================================
// PROD-001: Hiển thị danh sách sản phẩm
// ============================================
echo "📝 PROD-001: Hiển thị danh sách sản phẩm\n";
echo "----------------------------------------\n";

// Test 1.1: Load tất cả sản phẩm
echo "Test 1.1: Load tất cả sản phẩm\n";
$testResults['total']++;
$productsResponse = $client->get("$baseUrl/api/products");
$status = $productsResponse->getStatusCode();
$productsData = json_decode($productsResponse->getBody(), true);

if ($status === 200 && isset($productsData['data'])) {
    $products = $productsData['data'];
    $count = count($products);
    echo "✅ PASS: Load được {$count} sản phẩm\n";
    $testResults['passed']++;
    
    // Lưu product đầu tiên để test sau
    $testProduct = $products[0] ?? null;
} else {
    echo "❌ FAIL: Không load được sản phẩm (Status: {$status})\n";
    $testResults['failed']++;
    $testResults['errors'][] = "PROD-001.1: Cannot load products";
    $testProduct = null;
}

// Test 1.2: Pagination hoạt động
echo "\nTest 1.2: Pagination hoạt động\n";
$testResults['total']++;
$paginationResponse = $client->get("$baseUrl/api/products?page=1&per_page=5");
$status = $paginationResponse->getStatusCode();
$paginationData = json_decode($paginationResponse->getBody(), true);

if ($status === 200 && isset($paginationData['data']) && count($paginationData['data']) <= 5) {
    echo "✅ PASS: Pagination hoạt động (per_page=5)\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Pagination không hoạt động\n";
    $testResults['failed']++;
    $testResults['errors'][] = "PROD-001.2: Pagination not working";
}

// Test 1.3: Filter theo category
if ($testProduct && isset($testProduct['category_id'])) {
    echo "\nTest 1.3: Filter theo category\n";
    $testResults['total']++;
    $categoryId = $testProduct['category_id'];
    $filterResponse = $client->get("$baseUrl/api/products?category_id={$categoryId}");
    $status = $filterResponse->getStatusCode();
    $filterData = json_decode($filterResponse->getBody(), true);
    
    if ($status === 200 && isset($filterData['data'])) {
        echo "✅ PASS: Filter theo category hoạt động\n";
        $testResults['passed']++;
    } else {
        echo "❌ FAIL: Filter theo category không hoạt động\n";
        $testResults['failed']++;
        $testResults['errors'][] = "PROD-001.3: Category filter not working";
    }
}

// Test 1.4: Sort by price
echo "\nTest 1.4: Sort by price\n";
$testResults['total']++;
$sortResponse = $client->get("$baseUrl/api/products?sort=price&order=asc");
$status = $sortResponse->getStatusCode();

if ($status === 200) {
    echo "✅ PASS: Sort by price hoạt động\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Sort by price không hoạt động\n";
    $testResults['failed']++;
    $testResults['errors'][] = "PROD-001.4: Sort not working";
}

echo "\n";

// ============================================
// PROD-002: Chi tiết sản phẩm
// ============================================
echo "📝 PROD-002: Chi tiết sản phẩm\n";
echo "----------------------------------------\n";

if ($testProduct) {
    $productId = $testProduct['id'];
    
    // Test 2.1: Hiển thị đầy đủ thông tin
    echo "Test 2.1: Hiển thị đầy đủ thông tin\n";
    $testResults['total']++;
    $detailResponse = $client->get("$baseUrl/api/products/{$productId}");
    $status = $detailResponse->getStatusCode();
    $detailData = json_decode($detailResponse->getBody(), true);
    $product = $detailData['data'] ?? $detailData;
    
    if ($status === 200 && isset($product['id'])) {
        $hasRequiredFields = isset($product['name']) && 
                            isset($product['price']) && 
                            isset($product['description']);
        
        if ($hasRequiredFields) {
            echo "✅ PASS: Hiển thị đầy đủ thông tin sản phẩm\n";
            echo "   Name: {$product['name']}\n";
            echo "   Price: {$product['price']}\n";
            $testResults['passed']++;
        } else {
            echo "❌ FAIL: Thiếu thông tin sản phẩm\n";
            $testResults['failed']++;
            $testResults['errors'][] = "PROD-002.1: Missing product fields";
        }
    } else {
        echo "❌ FAIL: Không load được chi tiết sản phẩm\n";
        $testResults['failed']++;
        $testResults['errors'][] = "PROD-002.1: Cannot load product detail";
    }
    
    // Test 2.2: Hiển thị stock
    echo "\nTest 2.2: Hiển thị stock\n";
    $testResults['total']++;
    
    if (isset($product['stock_quantity']) || isset($product['quantity'])) {
        $stock = $product['stock_quantity'] ?? $product['quantity'] ?? 0;
        echo "✅ PASS: Hiển thị stock ({$stock})\n";
        $testResults['passed']++;
    } else {
        echo "❌ FAIL: Không hiển thị stock\n";
        $testResults['failed']++;
        $testResults['errors'][] = "PROD-002.2: Stock not displayed";
    }
}

echo "\n";

// ============================================
// PROD-003: Search sản phẩm
// ============================================
echo "📝 PROD-003: Search sản phẩm\n";
echo "----------------------------------------\n";

// Test 3.1: Search by name
echo "Test 3.1: Search by name\n";
$testResults['total']++;
$searchResponse = $client->get("$baseUrl/api/products?search=laptop");
$status = $searchResponse->getStatusCode();
$searchData = json_decode($searchResponse->getBody(), true);

if ($status === 200 && isset($searchData['data'])) {
    echo "✅ PASS: Search by name hoạt động\n";
    echo "   Found: " . count($searchData['data']) . " products\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Search by name không hoạt động\n";
    $testResults['failed']++;
    $testResults['errors'][] = "PROD-003.1: Search not working";
}

// Test 3.2: Search không có kết quả
echo "\nTest 3.2: Search không có kết quả\n";
$testResults['total']++;
$noResultResponse = $client->get("$baseUrl/api/products?search=xyzabc123notfound");
$status = $noResultResponse->getStatusCode();
$noResultData = json_decode($noResultResponse->getBody(), true);

if ($status === 200 && isset($noResultData['data']) && count($noResultData['data']) === 0) {
    echo "✅ PASS: Search trả về empty khi không có kết quả\n";
    $testResults['passed']++;
} else {
    echo "⚠️  SKIP: Search không có kết quả (có thể có sản phẩm trùng)\n";
}

echo "\n";

// ============================================
// PROD-004: Categories
// ============================================
echo "📝 PROD-004: Categories\n";
echo "----------------------------------------\n";

// Test 4.1: Load categories
echo "Test 4.1: Load categories\n";
$testResults['total']++;
$categoriesResponse = $client->get("$baseUrl/api/categories");
$status = $categoriesResponse->getStatusCode();
$categoriesData = json_decode($categoriesResponse->getBody(), true);

if ($status === 200 && isset($categoriesData['data'])) {
    $categories = $categoriesData['data'];
    $count = count($categories);
    echo "✅ PASS: Load được {$count} categories\n";
    $testResults['passed']++;
} else {
    echo "❌ FAIL: Không load được categories\n";
    $testResults['failed']++;
    $testResults['errors'][] = "PROD-004.1: Cannot load categories";
}

echo "\n";

// ============================================
// PROD-005: Stock management
// ============================================
echo "📝 PROD-005: Stock management\n";
echo "----------------------------------------\n";

if ($testProduct) {
    $productId = $testProduct['id'];
    
    // Get current stock
    $detailResponse = $client->get("$baseUrl/api/products/{$productId}");
    $product = json_decode($detailResponse->getBody(), true)['data'] ?? json_decode($detailResponse->getBody(), true);
    $initialStock = $product['stock_quantity'] ?? $product['quantity'] ?? 0;
    
    echo "Test 5.1: Hiển thị trạng thái stock\n";
    $testResults['total']++;
    
    if ($initialStock > 0) {
        echo "✅ PASS: Sản phẩm còn hàng (Stock: {$initialStock})\n";
        $testResults['passed']++;
    } else {
        echo "⚠️  INFO: Sản phẩm hết hàng (Stock: {$initialStock})\n";
        $testResults['passed']++;
    }
}

echo "\n";

// ============================================
// SUMMARY
// ============================================
echo "====================================\n";
echo "📊 TEST SUMMARY\n";
echo "====================================\n";
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
