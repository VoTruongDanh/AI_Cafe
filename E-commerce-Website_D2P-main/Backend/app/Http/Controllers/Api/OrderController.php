<?php

namespace App\Http\Controllers\Api;

use App\Models\Cart;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Promotion;
use App\Services\BankTransferService;
use App\Services\VietQRService;
use App\Services\MoMoService;
use App\Services\MoMoPaymentService;
use App\Services\OrderMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use OpenApi\Annotations as OA;

class OrderController extends \App\Http\Controllers\Controller
{
    use \App\Http\Controllers\Api\Concerns\EnsuresAdminAccess;

    protected OrderMailService $mailService;
    protected MoMoPaymentService $momoService;

    public function __construct(OrderMailService $mailService, MoMoPaymentService $momoService)
    {
        $this->mailService = $mailService;
        $this->momoService = $momoService;
    }

    /**
     * Helper: Hoàn lại stock an toàn (không cho quantity/sold_count âm)
     */
    protected function restoreStock(Product $product, int $quantity): void
    {
        // Hoàn lại quantity
        $product->increment('quantity', $quantity);
        
        // ✅ BUG FIX: Không cho sold_count âm
        $newSoldCount = max(0, $product->sold_count - $quantity);
        $product->update(['sold_count' => $newSoldCount]);
        
        // Broadcast event
        try {
            event(new \App\Events\ProductUpdated($product->fresh()));
        } catch (\Exception $e) {
            \Log::warning('Failed to update product event: ' . $e->getMessage());
        }
    }

    /**
     * @OA\Get(
     * path="/orders",
     * tags={"Orders"},
     * summary="Danh sách đơn hàng",
     * security={{"sanctum":{}}},
     * @OA\Response(response=200, description="OK")
     * )
     */
    public function index(Request $request)
    {
        $relationships = ['user', 'items.product.images', 'promotion', 'paymentMethod', 'processor'];

        // Thêm vnpay transaction nếu có
        if (Schema::hasTable('vnpay_transactions')) {
            $relationships[] = 'latestPendingVNPayTransaction';
            $relationships[] = 'firstVNPayTransaction';
        }

        $query = Order::query()->with($relationships);

        if ($request->user()->role === 'customer') {
            $query->where('user_id', $request->user()->id);
        } else {
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
            if ($request->filled('customer_id')) {
                $query->where('user_id', $request->input('customer_id'));
            }
        }

        $orders = $query
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('date_to')))
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json($orders);
    }

    /**
     * @OA\Post(
     * path="/orders",
     * tags={"Orders"},
     * summary="Tạo đơn hàng (Hỗ trợ POS và Web)",
     * security={{"sanctum":{}}},
     * @OA\Response(response=201, description="Created")
     * )
     */
    public function store(Request $request)
    {
        // 1. Nếu có items -> Logic cho WinForms/POS (Nhân viên tạo)
        if ($request->has('items') && is_array($request->get('items'))) {
            return $this->storeDirectPOS($request);
        }

        // 2. Nếu không có items -> Logic cho Web (Khách mua từ giỏ hàng)
        return $this->storeFromCart($request);
    }

    /**
     * Xử lý tạo đơn từ WinForms (POS) - Đã sửa để tự động điền status
     */
    private function storeDirectPOS(Request $request)
    {
        // Validate dữ liệu: Cho phép thiếu status, channel... (sẽ tự điền default)
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'customer_id' => ['nullable', 'exists:users,id'],
            'customer_name' => ['required', 'string'],
            'customer_phone' => ['nullable', 'string'],
            'customer_email' => ['nullable', 'email'],
            'shipping_address_line' => ['nullable', 'string'],

            // Các trường này Winform gửi cũng được, không gửi thì backend tự set
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'channel' => ['nullable', 'string'],

            'payment_method_id' => ['nullable', 'exists:payment_methods,id'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'tax_total' => ['required', 'numeric', 'min:0'],
            'grand_total' => ['required', 'numeric', 'min:0'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.sku' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.line_total' => ['required', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        // ✅ BUG FIX: Validate số lượng không âm
        foreach ($data['items'] as $item) {
            if ($item['quantity'] <= 0) {
                return response()->json([
                    'message' => 'Số lượng sản phẩm phải lớn hơn 0.'
                ], 422);
            }
        }

        // ✅ BUG FIX: Validate giá không âm và không bằng 0 (tránh free items)
        foreach ($data['items'] as $item) {
            if ($item['unit_price'] <= 0) {
                return response()->json([
                    'message' => 'Giá sản phẩm phải lớn hơn 0.'
                ], 422);
            }
        }

        // Kiểm tra tồn kho cho từng sản phẩm trước khi tạo đơn
        foreach ($data['items'] as $item) {
            $product = Product::find($item['product_id']);
            if (!$product || $product->trashed()) {
                return response()->json([
                    'message' => "Sản phẩm ID {$item['product_id']} không tồn tại."
                ], 422);
            }
            
            if ($product->quantity < $item['quantity']) {
                return response()->json([
                    'message' => "Sản phẩm '{$product->name}' chỉ còn {$product->quantity} trong kho."
                ], 422);
            }
            
            if ($product->status !== 'published') {
                return response()->json([
                    'message' => "Sản phẩm '{$product->name}' không khả dụng."
                ], 422);
            }

            // ✅ BUG FIX: Validate giá từ client không được thấp hơn giá database (tránh price manipulation)
            $expectedPrice = $product->effective_price ?? $product->price;
            if ($item['unit_price'] < $expectedPrice * 0.5) { // Cho phép sai lệch tối đa 50% (cho trường hợp giảm giá đặc biệt)
                return response()->json([
                    'message' => "Giá sản phẩm '{$product->name}' không hợp lệ."
                ], 422);
            }

            // ✅ BUG FIX: Validate line_total = unit_price * quantity - discount_amount
            $expectedLineTotal = ($item['unit_price'] * $item['quantity']) - ($item['discount_amount'] ?? 0);
            if (abs($item['line_total'] - $expectedLineTotal) > 0.01) { // Cho phép sai số làm tròn 0.01
                return response()->json([
                    'message' => "Tổng tiền sản phẩm '{$product->name}' không khớp."
                ], 422);
            }
        }

        // ✅ BUG FIX: Validate tổng tiền đơn hàng
        $calculatedSubtotal = array_sum(array_column($data['items'], 'line_total'));
        if (abs($data['subtotal'] - $calculatedSubtotal) > 0.01) {
            return response()->json([
                'message' => 'Tổng tiền đơn hàng không khớp.'
            ], 422);
        }

        $calculatedGrandTotal = $data['subtotal'] + $data['tax_total'] - ($data['discount_total'] ?? 0);
        if (abs($data['grand_total'] - $calculatedGrandTotal) > 0.01) {
            return response()->json([
                'message' => 'Tổng tiền cuối cùng không khớp.'
            ], 422);
        }

        return DB::transaction(function () use ($request, $data) {
            // Nếu Winforms gửi mã thì dùng, không thì tự sinh
            $orderCode = $request->input('code') ?? ('POS-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6)));

            $employeeId = $request->user()->id;

            // Cấu hình giá trị mặc định nếu WinForms không gửi lên
            $status = $data['status'] ?? 'completed';             // Mặc định: Hoàn thành
            $paymentStatus = $data['payment_status'] ?? 'paid';   // Mặc định: Đã trả tiền
            $channel = $data['channel'] ?? 'pos';                 // Mặc định: Tại quầy

            // ✅ BUG FIX: Lock products để tránh concurrent stock update
            $productIds = array_column($data['items'], 'product_id');
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            // ✅ BUG FIX: Kiểm tra lại stock sau khi lock (tránh overselling)
            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                if (!$product || $product->quantity < $item['quantity']) {
                    throw new \Exception("Sản phẩm '{$item['product_name']}' không đủ hàng trong kho.");
                }
            }

            $order = Order::create([
                'code' => $orderCode,
                'user_id' => $request->input('user_id') ?? $data['customer_id'] ?? null,
                'processed_by' => $employeeId,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_email' => $data['customer_email'] ?? null,
                'shipping_address_line' => $data['shipping_address_line'] ?? null,

                // Sử dụng giá trị mặc định đã xử lý ở trên
                'status' => $status,
                'payment_status' => $paymentStatus,
                'channel' => $channel,

                'payment_method_id' => $data['payment_method_id'] ?? null,
                'subtotal' => $data['subtotal'],
                'tax_total' => $data['tax_total'],
                'grand_total' => $data['grand_total'],
                'discount_total' => $data['discount_total'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'placed_at' => now(),

                // Tự động điền ngày giờ nếu trạng thái là paid
                'paid_at' => ($paymentStatus === 'paid') ? now() : null,
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'sku' => $item['sku'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['line_total'],
                    'discount_amount' => $item['discount_amount'] ?? 0,
                ]);

                // ✅ BUG FIX: Sử dụng product đã lock
                $product = $products->get($item['product_id']);
                if ($product) {
                    // ✅ BUG FIX: Kiểm tra để không cho quantity âm
                    $newQuantity = $product->quantity - $item['quantity'];
                    if ($newQuantity < 0) {
                        throw new \Exception("Lỗi: Số lượng sản phẩm '{$product->name}' sẽ bị âm sau khi giảm.");
                    }
                    
                    $product->decrement('quantity', $item['quantity']);
                    $product->increment('sold_count', $item['quantity']);
                    
                    // ✅ Broadcast ProductUpdated event để Frontend cập nhật realtime
                    try {
                        event(new \App\Events\ProductUpdated($product->fresh()));
                        \Log::info('ProductUpdated event broadcasted', ['product_id' => $product->id, 'quantity' => $product->quantity]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to broadcast ProductUpdated: ' . $e->getMessage());
                    }
                }
            }

            // ✅ Gửi email hóa đơn cho khách hàng (nếu có email)
            if (!empty($order->customer_email)) {
                try {
                    $this->mailService->sendInvoice($order);
                    Log::info('POS order invoice email sent', ['order_code' => $order->code, 'email' => $order->customer_email]);
                } catch (\Exception $e) {
                    Log::error('Failed to send POS order invoice email: ' . $e->getMessage(), [
                        'order_code' => $order->code,
                        'email' => $order->customer_email
                    ]);
                }
            }

            // ✅ Broadcast event
            event(new \App\Events\OrderCreated($order));

            return response()->json($order->load('items'), 201);
        });
    }

    /**
     * Xử lý tạo đơn từ Cart (Web/App)
     */
    private function storeFromCart(Request $request)
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'shipping_address_line' => ['nullable', 'string', 'max:255'],
            'shipping_city' => ['nullable', 'string', 'max:100'],
            'shipping_ward' => ['nullable', 'string', 'max:100'],
            'payment_method_id' => ['nullable', 'exists:payment_methods,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $cart = Cart::with(['items.product', 'promotion'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Giỏ hàng trống.'], 422);
        }

        // ✅ BUG FIX: Validate lại toàn bộ giỏ hàng từ database (tránh cart manipulation)
        $recalculatedSubtotal = 0;
        foreach ($cart->items as $item) {
            $product = $item->product;
            if (!$product || $product->trashed()) {
                return response()->json([
                    'message' => "Sản phẩm '{$item->product_name}' không còn tồn tại."
                ], 422);
            }
            
            if ($product->quantity < $item->quantity) {
                return response()->json([
                    'message' => "Sản phẩm '{$product->name}' chỉ còn {$product->quantity} trong kho, không đủ để đặt hàng."
                ], 422);
            }
            
            if ($product->status !== 'published') {
                return response()->json([
                    'message' => "Sản phẩm '{$product->name}' không khả dụng."
                ], 422);
            }

            // ✅ BUG FIX: Tính lại giá từ database (không tin giá từ client)
            $serverPrice = $product->effective_price ?? $product->price;
            $recalculatedSubtotal += $serverPrice * $item->quantity;
        }

        // ✅ BUG FIX: Validate promotion còn hợp lệ không
        if ($cart->promotion_id) {
            $promotion = Promotion::find($cart->promotion_id);
            if (!$promotion || !$promotion->is_active) {
                return response()->json([
                    'message' => 'Mã khuyến mãi không còn hợp lệ.'
                ], 422);
            }

            // Kiểm tra usage_limit
            if ($promotion->usage_limit && $promotion->used_count >= $promotion->usage_limit) {
                return response()->json([
                    'message' => 'Mã khuyến mãi đã hết lượt sử dụng.'
                ], 422);
            }

            // Kiểm tra min_order_value
            if ($promotion->min_order_value && $recalculatedSubtotal < $promotion->min_order_value) {
                return response()->json([
                    'message' => 'Giá trị đơn hàng không đủ điều kiện sử dụng mã khuyến mãi.'
                ], 422);
            }
        }

        // ✅ BUG FIX: Sử dụng database transaction với lock
        return DB::transaction(function () use ($cart, $request, $data, $recalculatedSubtotal) {
            $orderCode = 'ORD-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));

            // ✅ BUG FIX: Lock products để tránh race condition
            $productIds = $cart->items->pluck('product_id')->toArray();
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            // ✅ BUG FIX: Kiểm tra lại stock sau khi lock
            foreach ($cart->items as $item) {
                $product = $products->get($item->product_id);
                if (!$product || $product->quantity < $item->quantity) {
                    throw new \Exception("Sản phẩm '{$item->product_name}' không đủ hàng trong kho.");
                }
            }

            // ✅ BUG FIX: Tính lại discount từ database
            $discountTotal = 0;
            if ($cart->promotion_id) {
                $promotion = Promotion::lockForUpdate()->find($cart->promotion_id);
                if ($promotion && $promotion->is_active) {
                    if ($promotion->promotion_type === 'percentage') {
                        $discountTotal = $recalculatedSubtotal * ($promotion->value / 100);
                        if ($promotion->max_discount_value) {
                            $discountTotal = min($discountTotal, $promotion->max_discount_value);
                        }
                    } else {
                        $discountTotal = min($promotion->value, $recalculatedSubtotal);
                    }
                }
            }

            // Tính thuế 8% trên tổng tiền sau giảm giá
            $subtotalAfterDiscount = $recalculatedSubtotal - $discountTotal;
            $taxTotal = round($subtotalAfterDiscount * 0.08);
            $grandTotal = $subtotalAfterDiscount + $taxTotal;

            // ✅ Xác định thời gian hết hạn thanh toán
            $paymentExpiresAt = null;
            if ($data['payment_method_id']) {
                $paymentMethod = PaymentMethod::find($data['payment_method_id']);
                // Chỉ set timeout cho thanh toán online (VNPay, MoMo, Bank Transfer)
                if ($paymentMethod && $paymentMethod->type === 'online') {
                    // 15 phút cho thanh toán online
                    $paymentExpiresAt = now()->addMinutes(15);
                }
                // COD không cần timeout
            }

            $order = Order::create(array_merge($data, [
                'code' => $orderCode,
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_expires_at' => $paymentExpiresAt, // ✅ Thêm timeout
                'promotion_id' => $cart->promotion_id,
                'subtotal' => $recalculatedSubtotal, // ✅ BUG FIX: Dùng giá đã tính lại từ database
                'discount_total' => $discountTotal,   // ✅ BUG FIX: Dùng discount đã tính lại
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
                'placed_at' => now(),
                'channel' => 'online',
            ]));

            foreach ($cart->items as $item) {
                // ✅ BUG FIX: Lấy giá từ database, không tin giá từ cart
                $product = $products->get($item->product_id);
                $serverPrice = $product->effective_price ?? $product->price;

                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $serverPrice, // ✅ BUG FIX: Dùng giá từ database
                    'discount_amount' => 0, // Discount áp dụng cho toàn đơn, không phải từng item
                    'line_total' => $serverPrice * $item->quantity,
                ]);

                // ✅ BUG FIX: Sử dụng product đã lock
                // ✅ BUG FIX: Kiểm tra để không cho quantity âm
                $newQuantity = $product->quantity - $item->quantity;
                if ($newQuantity < 0) {
                    throw new \Exception("Lỗi: Số lượng sản phẩm '{$product->name}' sẽ bị âm sau khi giảm.");
                }
                
                $product->decrement('quantity', $item->quantity);
                $product->increment('sold_count', $item->quantity);
                
                // ✅ Broadcast ProductUpdated event để Frontend cập nhật realtime
                try {
                    event(new \App\Events\ProductUpdated($product->fresh()));
                    \Log::info('ProductUpdated event broadcasted', ['product_id' => $product->id, 'quantity' => $product->quantity]);
                } catch (\Exception $e) {
                    \Log::error('Failed to broadcast ProductUpdated: ' . $e->getMessage());
                }
            }

            // ✅ BUG FIX: Increment used_count với lock để tránh race condition
            if ($cart->promotion_id) {
                $promotion = Promotion::lockForUpdate()->find($cart->promotion_id);
                if ($promotion) {
                    $promotion->increment('used_count');
                }
            }

            $cart->items()->delete();
            $cart->update([
                'promotion_id' => null,
                'subtotal' => 0,
                'discount_total' => 0,
                'grand_total' => 0,
                'total_quantity' => 0,
            ]);

            // ✅ Broadcast event
            event(new \App\Events\OrderCreated($order));

            // Xử lý thanh toán online
            $isOnlinePayment = false;
            if ($order->payment_method_id) {
                try {
                    $paymentMethod = PaymentMethod::find($order->payment_method_id);
                    if ($paymentMethod && $paymentMethod->type === 'online') {
                        $isOnlinePayment = true;
                        if (Schema::hasTable('bank_transactions')) {
                            $bankTransferService = new BankTransferService();
                            $bankTransferService->createTransaction($order, $paymentMethod);
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to create payment transaction: ' . $e->getMessage());
                }
            }

            // Gửi email hóa đơn - Chỉ gửi ngay nếu KHÔNG phải thanh toán online (COD)
            // Với thanh toán online (chuyển khoản, MoMo), email sẽ được gửi sau khi xác nhận thanh toán thành công
            if (!$isOnlinePayment) {
                try {
                    $this->mailService->sendInvoice($order);
                } catch (\Exception $e) {
                    Log::error('Failed to send order invoice email: ' . $e->getMessage());
                }
            }

            $relationships = ['items', 'promotion'];
            if (Schema::hasTable('bank_transactions')) {
                $relationships[] = 'bankTransaction';
            }

            return response()->json($order->load($relationships), 201);
        });
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeOrderAccess($request, $order);
        $relationships = ['items.product.images', 'promotion', 'paymentMethod', 'processor'];
        if (Schema::hasTable('bank_transactions')) {
            $relationships[] = 'bankTransaction';
        }
        if (Schema::hasTable('vnpay_transactions')) {
            $relationships[] = 'latestPendingVNPayTransaction';
        }
        return response()->json($order->load($relationships));
    }

    public function update(Request $request, Order $order)
    {
        if ($request->user()->role === 'customer') {
            return response()->json(['message' => 'Bạn không có quyền cập nhật đơn hàng.'], 403);
        }

        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'payment_method_id' => ['nullable', 'exists:payment_methods,id'],
            'processed_by' => ['nullable', 'exists:users,id'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'shipping_address_line' => ['nullable', 'string', 'max:255'],
            'shipping_city' => ['nullable', 'string', 'max:100'],
            'shipping_district' => ['nullable', 'string', 'max:100'],
        ]);

        $order->fill($data);

        // Lưu trạng thái cũ để broadcast
        $previousStatus = $order->getOriginal('status');

        $order->save();

        // ✅ Broadcast event nếu status thay đổi
        if (isset($data['status']) && $previousStatus !== $data['status']) {
            event(new \App\Events\OrderStatusUpdated($order, $previousStatus, $data['status']));
        }

        return response()->json($order->refresh()->load('items', 'promotion'));
    }

    public function destroy(Request $request, Order $order)
    {
        if ($request->user()->role === 'customer') {
            return response()->json(['message' => 'Bạn không có quyền hủy đơn hàng.'], 403);
        }

        // ✅ Hoàn lại quantity khi xóa đơn hàng (chỉ nếu đơn chưa bị hủy trước đó)
        if ($order->status !== 'cancelled' && $order->status !== 'returned') {
            foreach ($order->items as $item) {
                if ($item->product) {
                    $this->restoreStock($item->product, $item->quantity);
                }
            }
        }

        $order->delete();
        return response()->json(['message' => 'Đã xóa đơn hàng.']);
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        // Kiểm tra quyền
        $isAdmin = in_array($request->user()->role, ['admin', 'staff']);
        if (!$isAdmin && $order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Bạn không có quyền hủy đơn hàng này.'], 403);
        }

        // Validate lý do hủy
        $data = $request->validate([
            'cancel_reason' => ['nullable', 'string', 'max:500'],
        ]);

        // ✅ Chỉ cho phép hủy đơn hàng đang chờ xử lý (pending) hoặc chờ xác nhận hủy (pending_cancel)
        if (!in_array($order->status, ['pending', 'pending_cancel'])) {
            return response()->json(['message' => 'Chỉ có thể hủy đơn hàng đang chờ xử lý.'], 400);
        }

        // ✅ LOGIC MỚI: Nếu khách đã xác nhận chuyển khoản nhưng Admin chưa verify
        // → KHÔNG cho hủy ngay, phải chờ Admin xác nhận
        // Kiểm tra: transfer_confirmed_at có giá trị VÀ payment_status chưa phải 'paid' (chưa được Admin verify)
        if (!$isAdmin && $order->transfer_confirmed_at && $order->payment_status !== 'paid') {
            // Khách đã bấm "Tôi đã thanh toán" → Chờ Admin xác nhận hủy
            $previousStatus = $order->status;
            $order->status = 'pending_cancel';
            $order->cancel_reason = $data['cancel_reason'] ?? 'Khách hàng yêu cầu hủy';
            $order->cancelled_by = $request->user()->id;
            $order->save();

            // ✅ Broadcast event để admin nhận realtime update
            event(new \App\Events\OrderStatusUpdated($order, $previousStatus, 'pending_cancel'));

            // Gửi email thông báo đã nhận yêu cầu hủy
            try {
                $this->mailService->sendPendingCancel($order, $order->cancel_reason);
            } catch (\Exception $e) {
                Log::error('Failed to send pending cancel email: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Yêu cầu hủy đơn đã được ghi nhận. Vui lòng chờ Admin xác nhận sau khi kiểm tra giao dịch chuyển khoản.',
                'order' => $order->load('items.product'),
                'pending_cancel' => true
            ]);
        }

        // ✅ LOGIC HOÀN TIỀN (chỉ khi Admin hủy hoặc khách chưa xác nhận CK):
        $needRefund = false;
        $refundStatus = null;
        $responseMessage = 'Đã hủy đơn hàng thành công.';

        if ($order->payment_status === 'paid') {
            // Đã xác nhận thanh toán → chắc chắn cần hoàn tiền
            $needRefund = true;
            $refundStatus = 'pending';
            $responseMessage .= ' Yêu cầu hoàn tiền đã được ghi nhận, chúng tôi sẽ liên hệ bạn sớm nhất.';
        }

        // Cập nhật đơn hàng
        $order->status = 'cancelled';
        $order->cancel_reason = $data['cancel_reason'] ?? ($order->cancel_reason ?? 'Khách hàng yêu cầu hủy');
        $order->cancelled_at = now();
        if (!$order->cancelled_by) {
            $order->cancelled_by = $request->user()->id;
        }

        // Nếu cần hoàn tiền
        if ($needRefund) {
            $order->refund_required = true;
            $order->refund_status = $refundStatus;
        }

        $order->save();

        // ✅ Hoàn lại quantity VÀ giảm sold_count khi hủy đơn
        foreach ($order->items as $item) {
            if ($item->product) {
                $this->restoreStock($item->product, $item->quantity);
            }
        }

        // ✅ Broadcast event để admin nhận realtime update
        event(new \App\Events\OrderStatusUpdated($order, 'pending', 'cancelled'));

        // Gửi email thông báo hủy đơn
        try {
            $this->mailService->sendOrderCancelled($order, $order->cancel_reason);
        } catch (\Exception $e) {
            Log::error('Failed to send cancel email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => $responseMessage,
            'order' => $order->load('items.product'),
            'refund_required' => $needRefund,
            'refund_status' => $refundStatus
        ]);
    }

    /**
     * @OA\Post(
     *     path="/admin/orders/{id}/process-refund",
     *     tags={"Admin Orders"},
     *     summary="Process refund for cancelled order",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="action", type="string", enum={"completed", "rejected"}),
     *             @OA\Property(property="refund_note", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Refund processed")
     * )
     */
    public function processRefund(Request $request, $id)
    {
        $this->ensureAdmin($request);

        $order = Order::findOrFail($id);

        // Kiểm tra đơn hàng có yêu cầu hoàn tiền không
        if (!$order->refund_required) {
            return response()->json([
                'message' => 'Đơn hàng này không yêu cầu hoàn tiền'
            ], 400);
        }

        // Kiểm tra trạng thái hoàn tiền
        if ($order->refund_status === 'completed') {
            return response()->json([
                'message' => 'Đơn hàng này đã được hoàn tiền rồi'
            ], 400);
        }

        $validated = $request->validate([
            'action' => 'required|in:completed,rejected',
            'refund_note' => 'nullable|string|max:500'
        ]);

        // Nếu là MoMo và action = completed, tự động gọi API hoàn tiền MoMo
        $momoRefundResult = null;
        if ($validated['action'] === 'completed' && $order->payment_method_id == 3) { // 3 = MoMo
            if ($this->momoService->canRefund($order)) {
                $momoRefundResult = $this->momoService->refundPayment(
                    $order,
                    $validated['refund_note'] ?? "Hoàn tiền đơn hàng {$order->code}"
                );

                if (!$momoRefundResult['success']) {
                    // Nếu MoMo refund thất bại, vẫn ghi nhận nhưng thông báo lỗi
                    Log::warning('MoMo auto-refund failed', [
                        'order_code' => $order->code,
                        'error' => $momoRefundResult['message']
                    ]);
                }
            }
        }

        $order->refund_status = $validated['action'];
        $order->refunded_at = now();
        $order->refund_note = $validated['refund_note'] ?? null;

        if ($validated['action'] === 'completed') {
            $order->payment_status = 'refunded';
        }

        $order->save();

        // Gửi email thông báo hoàn tiền cho khách hàng
        if ($validated['action'] === 'completed') {
            try {
                $this->mailService->sendOrderRefunded($order, $validated['refund_note'] ?? null);
            } catch (\Exception $e) {
                Log::error('Failed to send refund email: ' . $e->getMessage());
            }
        }

        $message = $validated['action'] === 'completed'
            ? 'Đã xác nhận hoàn tiền thành công'
            : 'Đã từ chối yêu cầu hoàn tiền';

        // Thêm thông tin MoMo refund nếu có
        if ($momoRefundResult) {
            $message .= $momoRefundResult['success']
                ? ' (MoMo đã hoàn tiền tự động)'
                : ' (Lưu ý: Hoàn tiền MoMo tự động thất bại - cần hoàn thủ công)';
        }

        return response()->json([
            'message' => $message,
            'order' => $order->load('items.product', 'user', 'paymentMethod'),
            'momo_refund' => $momoRefundResult
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $this->ensureAdmin($request);

        // ✅ Không cho cập nhật đơn đã hoàn thành VÀ đã thanh toán
        if ($order->status === 'completed' && $order->payment_status === 'paid') {
            return response()->json(['message' => 'Không thể cập nhật đơn hàng đã hoàn thành và đã thanh toán.'], 400);
        }

        $data = $request->validate([
            'status' => ['required', 'string', 'in:pending,confirmed,processing,shipped,delivered,completed,returned,cancelled'],
            'payment_status' => ['nullable', 'string'],
            'cancel_reason' => ['nullable', 'string', 'max:500'],
        ]);

        // Loại bỏ các giá trị rỗng (nhưng giữ cancel_reason nếu có)
        $cancelReason = $data['cancel_reason'] ?? null;
        $data = array_filter($data, fn($value) => $value !== null && $value !== '');
        unset($data['cancel_reason']); // Sẽ xử lý riêng

        if (empty($data)) {
            return response()->json(['message' => 'Không có thay đổi'], 200);
        }

        $previousStatus = $order->status;
        $newStatus = $data['status'] ?? $previousStatus; // ✅ BUG FIX: Định nghĩa trước để tránh undefined

        $order->fill($data);

        // ✅ Cập nhật người duyệt cuối cùng khi chuyển trạng thái
        $order->processed_by = $request->user()->id;

        if (isset($data['payment_status']) && $data['payment_status'] === 'paid' && !$order->paid_at) $order->paid_at = now();

        // ✅ Hoàn lại quantity khi chuyển sang returned hoặc cancelled
        if (isset($data['status'])) {
            $newStatus = $data['status'];

            // Hoàn quantity khi chuyển sang returned (từ trạng thái khác)
            if ($newStatus === 'returned' && $previousStatus !== 'returned' && $previousStatus !== 'cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $this->restoreStock($item->product, $item->quantity);
                    }
                }
            }

            // Hoàn quantity khi chuyển sang cancelled (từ trạng thái khác)
            if ($newStatus === 'cancelled' && $previousStatus !== 'cancelled' && $previousStatus !== 'returned') {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $this->restoreStock($item->product, $item->quantity);
                    }
                }

                // Lưu thông tin hủy đơn
                $order->cancel_reason = $cancelReason ?: 'Đơn hàng đã bị hủy bởi quản trị viên';
                $order->cancelled_at = now();
                $order->cancelled_by = $request->user()->id;

                // Kiểm tra cần hoàn tiền không
                $needRefund = in_array($order->payment_status, ['paid', 'pending']) &&
                              in_array($order->payment_method_id, [2, 3]); // Bank transfer or MoMo
                if ($needRefund && $order->payment_status === 'paid') {
                    $order->refund_required = true;
                    $order->refund_status = 'pending';
                }
            }
        }

        $order->save();

        // ✅ Broadcast event
        event(new \App\Events\OrderStatusUpdated($order, $previousStatus, $newStatus));

        // Gửi email hóa đơn khi admin xác nhận thanh toán thành công
        if (isset($data['payment_status']) && $data['payment_status'] === 'paid' && $order->payment_status === 'paid') {
            try {
                $this->mailService->sendInvoice($order);
            } catch (\Exception $e) {
                Log::error('Failed to send invoice after payment confirmation: ' . $e->getMessage());
            }
        }

        // Send cancellation email if status changed to cancelled
        if (isset($data['status']) && $data['status'] === 'cancelled' && $previousStatus !== 'cancelled') {
            $reason = $cancelReason ?: 'Đơn hàng đã bị hủy bởi quản trị viên';
            try {
                $this->mailService->sendOrderCancelled($order, $reason);
            } catch (\Exception $e) {
                Log::error('Failed to send cancel email in updateStatus: ' . $e->getMessage());
            }
        }

        return response()->json($order->refresh()->load('items.product.images', 'promotion', 'paymentMethod', 'processor'));
    }

    protected function authorizeOrderAccess(Request $request, Order $order): void
    {
        if ($request->user()->role === 'customer' && $order->user_id !== $request->user()->id) {
            abort(403, 'Bạn không có quyền truy cập đơn hàng này.');
        }
    }

    // --- CÁC HÀM QR & MOMO ---
    public function getQRCode(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $this->authorizeOrderAccess($request, $order);
        if (!$order->qr_code_url) {
            $transferContent = VietQRService::generateTransferContent($order->code);
            $qrUrl = VietQRService::generateQRUrl($order->code, $order->grand_total);
            $order->update(['qr_code_url' => $qrUrl, 'transfer_content' => $transferContent]);
        }

        // Lấy expires_at từ BankTransaction
        $bankTransaction = \App\Models\BankTransaction::where('order_id', $order->id)->first();
        $expiresAt = $bankTransaction ? $bankTransaction->expires_at?->toIso8601String() : null;

        return response()->json([
            'order_code' => $order->code, 'amount' => $order->grand_total,
            'qr_code_url' => $order->qr_code_url, 'transfer_content' => $order->transfer_content,
            'bank_info' => VietQRService::getBankInfo(), 'order_items' => $this->mapOrderItems($order),
            'expires_at' => $expiresAt,
        ]);
    }

    public function getMoMoQRCode(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $this->authorizeOrderAccess($request, $order);
        if (!$order->momo_qr_url) {
            $transferContent = MoMoService::generateTransferContent($order->code);
            $qrUrl = MoMoService::generateQRUrl($order->code, $order->grand_total);
            $order->update(['momo_qr_url' => $qrUrl, 'momo_transfer_content' => $transferContent]);
        }
        return response()->json([
            'order_code' => $order->code, 'amount' => $order->grand_total,
            'qr_code_url' => $order->momo_qr_url, 'transfer_content' => $order->momo_transfer_content,
            'momo_info' => MoMoService::getAccountInfo(), 'order_items' => $this->mapOrderItems($order)
        ]);
    }

    private function mapOrderItems($order) {
        return $order->items->map(function ($item) {
            return [
                'id' => $item->id, 'product_id' => $item->product_id, 'product_name' => $item->product_name,
                'quantity' => $item->quantity, 'unit_price' => $item->unit_price, 'price' => $item->unit_price,
                'product' => $item->product ? ['id' => $item->product->id, 'name' => $item->product->name, 'thumbnail' => $item->product->thumbnail, 'image_url' => $item->product->image_url] : null,
            ];
        });
    }

    public function confirmTransfer(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $this->authorizeOrderAccess($request, $order);
        $data = $request->validate(['transfer_note' => ['nullable', 'string', 'max:500']]);
        
        $previousStatus = $order->status;
        $previousPaymentStatus = $order->payment_status;
        
        $order->update([
            'status' => 'pending', 'payment_status' => 'pending',
            'transfer_confirmed_at' => now(), 'transfer_note' => $data['transfer_note'] ?? null
        ]);

        // ✅ Broadcast event để admin nhận realtime update
        if ($previousPaymentStatus !== 'pending') {
            event(new \App\Events\OrderStatusUpdated($order, $previousStatus, 'pending'));
        }

        return response()->json(['message' => 'Đã xác nhận.', 'status' => $order->status, 'payment_status' => $order->payment_status]);
    }

    /**
     * Admin xác nhận ĐÃ nhận tiền chuyển khoản
     * Đồng thời cập nhật trạng thái đơn hàng thành "confirmed" (Đã xác nhận)
     */
    public function verifyPayment(Request $request, $id)
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);
        
        $previousStatus = $order->status;
        
        $order->update([
            'payment_status' => 'paid',
            'paid_at' => now(),
            'processed_by' => $request->user()->id,
            'status' => 'confirmed', // Tự động chuyển sang trạng thái "Đã xác nhận"
        ]);

        // ✅ Broadcast event để admin và user nhận realtime update
        event(new \App\Events\OrderStatusUpdated($order, $previousStatus, 'confirmed'));

        // Gửi email xác nhận thanh toán thành công
        try {
            Mail::to($order->customer_email)->send(new \App\Mail\PaymentConfirmedMail($order));
        } catch (\Exception $e) {
            Log::error('Failed to send payment confirmed email: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Đã xác nhận thanh toán và cập nhật trạng thái đơn hàng', 'order' => $order->refresh()]);
    }

    /**
     * Admin từ chối xác nhận thanh toán (chưa nhận được tiền)
     * Reset trạng thái để khách có thể thanh toán lại hoặc hủy đơn
     */
    public function rejectPayment(Request $request, $id)
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);

        $data = $request->validate([
            'reject_reason' => ['nullable', 'string', 'max:500']
        ]);

        $rejectReason = $data['reject_reason'] ?? 'Chưa nhận được tiền chuyển khoản';

        $previousPaymentStatus = $order->payment_status;

        $order->update([
            'payment_status' => 'unpaid',
            'transfer_confirmed_at' => null, // Reset để khách có thể thanh toán lại
            'transfer_note' => null,
            'payment_reject_reason' => $rejectReason,
            'payment_rejected_at' => now(),
        ]);

        // ✅ Broadcast event để admin và user nhận realtime update
        if ($previousPaymentStatus !== 'unpaid') {
            event(new \App\Events\OrderStatusUpdated($order, $order->status, $order->status));
        }

        // Gửi email thông báo từ chối thanh toán
        try {
            $this->mailService->sendPaymentRejected($order, $rejectReason);
        } catch (\Exception $e) {
            Log::error('Failed to send payment rejected email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Đã từ chối xác nhận thanh toán. Khách hàng có thể thanh toán lại hoặc hủy đơn.',
            'order' => $order->refresh()
        ]);
    }

    /**
     * Admin xác nhận hủy đơn hàng (khi khách yêu cầu hủy nhưng đã xác nhận chuyển khoản)
     * Admin sẽ kiểm tra sao kê và quyết định có hoàn tiền hay không
     */
    public function confirmCancel(Request $request, $id)
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);

        if ($order->status !== 'pending_cancel') {
            return response()->json(['message' => 'Đơn hàng không ở trạng thái chờ xác nhận hủy.'], 400);
        }

        $data = $request->validate([
            'has_received_money' => ['required', 'boolean'], // Admin xác nhận đã nhận tiền hay chưa
            'refund_note' => ['nullable', 'string', 'max:500']
        ]);

        // Cập nhật đơn hàng thành đã hủy
        $order->status = 'cancelled';
        $order->cancelled_at = now();

        if ($data['has_received_money']) {
            // Admin xác nhận ĐÃ nhận tiền → Đánh dấu đã hoàn tiền luôn
            $order->payment_status = 'refunded'; // Đã hoàn tiền
            $order->paid_at = now();
            $order->refund_required = true;
            $order->refund_status = 'completed'; // Hoàn tiền xong
            $order->refunded_at = now();
            $order->refund_note = $data['refund_note'] ?? 'Đã hoàn tiền khi xác nhận hủy đơn';
        } else {
            // Admin xác nhận CHƯA nhận tiền → Không cần hoàn tiền
            $order->payment_status = 'unpaid';
            $order->refund_required = false;
        }

        $order->save();

        // Hoàn lại quantity và giảm sold_count
        foreach ($order->items as $item) {
            if ($item->product) {
                $this->restoreStock($item->product, $item->quantity);
            }
        }

        // ✅ Broadcast event để admin và user nhận realtime update
        event(new \App\Events\OrderStatusUpdated($order, 'pending_cancel', 'cancelled'));

        // Gửi email thông báo
        try {
            $this->mailService->sendOrderCancelled($order, $order->cancel_reason);
        } catch (\Exception $e) {
            Log::error('Failed to send cancel email: ' . $e->getMessage());
        }

        $message = 'Đã xác nhận hủy đơn hàng.';
        if ($data['has_received_money']) {
            $message .= ' Đã hoàn tiền cho khách hàng.';
        }

        return response()->json([
            'message' => $message,
            'order' => $order->load('items.product'),
            'refund_required' => $order->refund_required
        ]);
    }

    /**
     * Admin từ chối hủy đơn hàng (khách yêu cầu hủy nhưng Admin không đồng ý)
     */
    public function rejectCancel(Request $request, $id)
    {
        $this->ensureAdmin($request);
        $order = Order::findOrFail($id);

        if ($order->status !== 'pending_cancel') {
            return response()->json(['message' => 'Đơn hàng không ở trạng thái chờ xác nhận hủy.'], 400);
        }

        $data = $request->validate([
            'reject_reason' => ['nullable', 'string', 'max:500']
        ]);

        $rejectReason = $data['reject_reason'] ?? 'Admin từ chối yêu cầu hủy';

        // Đưa đơn hàng về trạng thái pending
        $order->status = 'pending';
        $order->cancel_reason = null;
        $order->cancelled_by = null;
        $order->cancel_reject_reason = $rejectReason;
        $order->save();

        // ✅ Broadcast event để admin và user nhận realtime update
        event(new \App\Events\OrderStatusUpdated($order, 'pending_cancel', 'pending'));

        // Gửi email thông báo từ chối hủy đơn
        try {
            $this->mailService->sendCancelRejected($order, $rejectReason);
        } catch (\Exception $e) {
            Log::error('Failed to send cancel rejected email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Đã từ chối yêu cầu hủy đơn hàng.',
            'order' => $order->load('items.product')
        ]);
    }
}
