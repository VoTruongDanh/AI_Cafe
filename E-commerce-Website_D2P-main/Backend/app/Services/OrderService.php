<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Order Service - Business logic chung cho Web và WinForm
 * Đảm bảo tính nhất quán khi tạo đơn hàng từ 2 sources
 */
class OrderService
{
    /**
     * Tạo đơn hàng mới
     *
     * @param array $data
     * @param string $source 'web' hoặc 'winform'
     * @return Order
     * @throws \Exception
     */
    public function createOrder(array $data, string $source = 'web'): Order
    {
        return DB::transaction(function () use ($data, $source) {
            // 1. Validate stock availability
            $this->validateStockAvailability($data['items']);

            // 2. Calculate totals
            $totals = $this->calculateOrderTotals($data['items']);

            // 3. Create order
            $order = Order::create([
                'user_id' => $data['user_id'] ?? auth()->id(),
                'source' => $source,
                'created_by' => auth()->id(),
                'status' => $data['status'] ?? 'pending',
                'subtotal' => $totals['subtotal'],
                'tax' => $totals['tax'],
                'discount' => $data['discount'] ?? 0,
                'grand_total' => $totals['grand_total'],
                'payment_method_id' => $data['payment_method_id'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // 4. Create order items và update stock
            foreach ($data['items'] as $item) {
                $this->createOrderItem($order, $item);
            }

            // 5. Apply promotion nếu có
            if (isset($data['promotion_code'])) {
                $this->applyPromotion($order, $data['promotion_code']);
            }

            // 6. Log activity
            $this->logOrderCreation($order, $source);

            // 7. Load relationships
            $order->load(['items.product', 'user', 'payment']);

            return $order;
        });
    }

    /**
     * Validate stock availability
     */
    protected function validateStockAvailability(array $items): void
    {
        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);

            if ($product->quantity < $item['quantity']) {
                throw new \Exception(
                    "Sản phẩm '{$product->name}' không đủ số lượng. " .
                    "Còn lại: {$product->quantity}, yêu cầu: {$item['quantity']}"
                );
            }

            if (!$product->is_active) {
                throw new \Exception("Sản phẩm '{$product->name}' không còn kinh doanh");
            }
        }
    }

    /**
     * Calculate order totals
     */
    protected function calculateOrderTotals(array $items): array
    {
        $subtotal = 0;

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);
            $price = $item['price'] ?? $product->price;
            $subtotal += $price * $item['quantity'];
        }

        $tax = $subtotal * 0.1; // 10% VAT
        $grandTotal = $subtotal + $tax;

        return [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'grand_total' => $grandTotal,
        ];
    }

    /**
     * Create order item và update stock
     * ✅ FIX: Sử dụng lockForUpdate() để tránh race condition
     */
    protected function createOrderItem(Order $order, array $itemData): OrderItem
    {
        // ✅ Lock row để tránh 2 transactions cùng đọc/ghi
        $product = Product::where('id', $itemData['product_id'])
            ->lockForUpdate()
            ->firstOrFail();

        // ✅ Kiểm tra stock lại sau khi lock (double-check)
        if ($product->stock < $itemData['quantity']) {
            throw new \Exception(
                "Sản phẩm '{$product->name}' không đủ số lượng. " .
                "Còn lại: {$product->stock}, yêu cầu: {$itemData['quantity']}"
            );
        }

        if (!$product->is_active) {
            throw new \Exception("Sản phẩm '{$product->name}' không còn kinh doanh");
        }

        // Create order item
        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $itemData['quantity'],
            'price' => $itemData['price'] ?? $product->price,
            'subtotal' => ($itemData['price'] ?? $product->price) * $itemData['quantity'],
        ]);

        // ✅ Update stock - Atomic operation
        $product->decrement('stock', $itemData['quantity']);
        $product->increment('sold_count', $itemData['quantity']);

        return $orderItem;
    }

    /**
     * Apply promotion code
     */
    protected function applyPromotion(Order $order, string $code): void
    {
        // Logic áp dụng mã giảm giá
        // TODO: Implement promotion logic
    }

    /**
     * Log order creation
     */
    protected function logOrderCreation(Order $order, string $source): void
    {
        Log::channel('orders')->info('Order created', [
            'order_id' => $order->id,
            'source' => $source,
            'user_id' => $order->user_id,
            'created_by' => $order->created_by,
            'grand_total' => $order->grand_total,
            'items_count' => $order->items->count(),
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Update order status
     */
    public function updateStatus(Order $order, string $newStatus, ?string $notes = null): Order
    {
        $oldStatus = $order->status;

        $order->update([
            'status' => $newStatus,
            'notes' => $notes ? ($order->notes . "\n" . $notes) : $order->notes,
        ]);

        // Log status change
        Log::channel('orders')->info('Order status updated', [
            'order_id' => $order->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'updated_by' => auth()->id(),
            'timestamp' => now()->toDateTimeString(),
        ]);

        // TODO: Send notification to customer

        return $order->fresh();
    }

    /**
     * Cancel order và restore stock
     */
    public function cancelOrder(Order $order, ?string $reason = null): Order
    {
        return DB::transaction(function () use ($order, $reason) {
            // Restore stock
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('stock', $item->quantity);
                    $product->decrement('sold_count', $item->quantity);
                }
            }

            // Update order status
            $order->update([
                'status' => 'cancelled',
                'notes' => $order->notes . "\nHủy: " . $reason,
            ]);

            Log::channel('orders')->warning('Order cancelled', [
                'order_id' => $order->id,
                'reason' => $reason,
                'cancelled_by' => auth()->id(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return $order->fresh();
        });
    }

    /**
     * Get orders statistics
     */
    public function getStatistics(array $filters = []): array
    {
        $query = Order::query();

        // Apply filters
        if (isset($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return [
            'total_orders' => $query->count(),
            'total_revenue' => $query->where('status', '!=', 'cancelled')->sum('grand_total'),
            'pending_orders' => $query->where('status', 'pending')->count(),
            'completed_orders' => $query->where('status', 'completed')->count(),
            'cancelled_orders' => $query->where('status', 'cancelled')->count(),
            'average_order_value' => $query->where('status', '!=', 'cancelled')->avg('grand_total'),
        ];
    }
}
