#!/bin/bash

# Script để chạy tất cả tests

echo "========================================="
echo "Running All Tests"
echo "========================================="

# Test 1: Promotion Stacking
echo ""
echo "1. Testing Promotion Stacking..."
php artisan test --filter=PromotionStackingTest

# Test 2: Race Condition
echo ""
echo "2. Testing Race Condition..."
php artisan test --filter=OrderRaceConditionTest

# Test 3: Refund Flow
echo ""
echo "3. Testing Refund Flow..."
php artisan test --filter=RefundFlowTest

# Test 4: Complete Order Flow
echo ""
echo "4. Testing Complete Order Flow..."
php artisan test --filter=CompleteOrderFlowTest

echo ""
echo "========================================="
echo "All Tests Completed"
echo "========================================="
