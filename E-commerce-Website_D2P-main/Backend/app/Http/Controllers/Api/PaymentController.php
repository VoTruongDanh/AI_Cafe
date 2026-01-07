<?php

namespace App\Http\Controllers\Api;

use App\Models\BankTransaction;
use App\Models\Order;
use App\Services\BankTransferService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use OpenApi\Annotations as OA;

class PaymentController extends \App\Http\Controllers\Controller
{
    /**
     * @OA\Get(
     *     path="/orders/{orderId}/payment/qr-code",
     *     tags={"Payments"},
     *     summary="Lấy QR code và thông tin thanh toán chuyển khoản",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="orderId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Thông tin thanh toán",
     *         @OA\JsonContent(
     *             @OA\Property(property="order_code", type="string"),
     *             @OA\Property(property="amount", type="number"),
     *             @OA\Property(property="bank_name", type="string"),
     *             @OA\Property(property="account_name", type="string"),
     *             @OA\Property(property="account_number", type="string"),
     *             @OA\Property(property="content", type="string"),
     *             @OA\Property(property="qr_code_data", type="string"),
     *             @OA\Property(property="qr_code_image_url", type="string", nullable=true),
     *             @OA\Property(property="transaction_code", type="string"),
     *             @OA\Property(property="expires_at", type="string", format="date-time"),
     *             @OA\Property(property="status", type="string")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Không tìm thấy đơn hàng hoặc giao dịch")
     * )
     */
    public function getQrCode(Request $request, $orderId)
    {
        try {
            // Kiểm tra bảng bank_transactions có tồn tại không - kiểm tra TRƯỚC khi load order
            $tableExists = false;
            try {
                // Sử dụng DB::select để kiểm tra table một cách an toàn
                $result = DB::select("SHOW TABLES LIKE 'bank_transactions'");
                $tableExists = !empty($result);
            } catch (\Exception $e) {
                // Nếu lỗi, thử cách khác
                try {
                    $tableExists = Schema::hasTable('bank_transactions');
                } catch (\Exception $e2) {
                    Log::error('Error checking bank_transactions table: ' . $e2->getMessage());
                    // Nếu không thể check table, giả sử table không tồn tại
                    $tableExists = false;
                }
            }
            
            if (!$tableExists) {
                Log::warning('bank_transactions table does not exist for order ' . $orderId);
                return response()->json([
                    'message' => 'Hệ thống thanh toán chưa được thiết lập. Vui lòng liên hệ quản trị viên để chạy migration.',
                    'error' => 'bank_transactions table does not exist'
                ], 500);
            }

            // Load order với paymentMethod - KHÔNG load bankTransaction trong with() để tránh lỗi
            try {
                $order = Order::with('paymentMethod')
                    ->where('id', $orderId)
                    ->where('user_id', $request->user()->id)
                    ->firstOrFail();
            } catch (\Illuminate\Database\QueryException $e) {
                // Nếu lỗi do bảng không tồn tại, trả về lỗi rõ ràng
                $errorMessage = $e->getMessage();
                if (stripos($errorMessage, 'bank_transactions') !== false || 
                    stripos($errorMessage, "doesn't exist") !== false ||
                    stripos($errorMessage, 'Base table or view not found') !== false ||
                    (stripos($errorMessage, 'Table') !== false && stripos($errorMessage, "doesn't exist") !== false)) {
                    return response()->json([
                        'message' => 'Hệ thống thanh toán chưa được thiết lập. Vui lòng liên hệ quản trị viên để chạy migration.',
                        'error' => 'bank_transactions table does not exist'
                    ], 500);
                }
                // Log và re-throw nếu không phải lỗi do bảng không tồn tại
                Log::error('Database error loading order: ' . $errorMessage);
                throw $e;
            } catch (\Exception $e) {
                Log::error('Error loading order: ' . $e->getMessage());
                throw $e;
            }

            // Load bankTransaction riêng chỉ nếu bảng tồn tại
            $bankTransaction = null;
            if ($tableExists) {
                try {
                    // Sử dụng query trực tiếp thay vì relationship để tránh lỗi
                    $bankTransaction = BankTransaction::where('order_id', $order->id)->first();
                } catch (\Illuminate\Database\QueryException $e) {
                    // Nếu lỗi do bảng không tồn tại, bỏ qua
                    $errorMessage = $e->getMessage();
                    if (stripos($errorMessage, 'bank_transactions') !== false || 
                        stripos($errorMessage, "doesn't exist") !== false ||
                        stripos($errorMessage, 'Base table or view not found') !== false) {
                        Log::warning('bank_transactions table does not exist when trying to load transaction');
                        $bankTransaction = null;
                    } else {
                        // Nếu lỗi khác, log và bỏ qua
                        Log::warning('Could not load bankTransaction: ' . $e->getMessage());
                        $bankTransaction = null;
                    }
                } catch (\Exception $e) {
                    // Nếu không load được, set null
                    Log::warning('Could not load bankTransaction relationship: ' . $e->getMessage());
                    $bankTransaction = null;
                }
            }

            // Kiểm tra phương thức thanh toán
            if (!$order->paymentMethod) {
                return response()->json([
                    'message' => 'Đơn hàng không có phương thức thanh toán'
                ], 400);
            }

            if ($order->paymentMethod->type !== 'online') {
                return response()->json([
                    'message' => 'Đơn hàng không sử dụng phương thức thanh toán online'
                ], 400);
            }

            // Lấy hoặc tạo bank transaction (đã được load ở trên)
            if (!$bankTransaction) {
                try {
                    // Tạo mới nếu chưa có
                    $bankTransferService = new BankTransferService();
                    $bankTransaction = $bankTransferService->createTransaction($order, $order->paymentMethod);
                    // Reload để đảm bảo có đầy đủ dữ liệu
                    $bankTransaction->refresh();
                } catch (\Exception $e) {
                    Log::error('Failed to create bank transaction in getQrCode: ' . $e->getMessage(), [
                        'order_id' => $orderId,
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json([
                        'message' => 'Không thể tạo giao dịch thanh toán: ' . $e->getMessage()
                    ], 500);
                }
            }

            // Tạo URL cho QR code image nếu có
            $qrCodeImageUrl = null;
            if ($bankTransaction->qr_code_image_path) {
                $qrCodeImageUrl = Storage::url($bankTransaction->qr_code_image_path);
            }

            return response()->json([
                'order_code' => $order->code,
                'amount' => $bankTransaction->amount,
                'bank_name' => $bankTransaction->bank_name,
                'account_name' => $bankTransaction->account_name,
                'account_number' => $bankTransaction->account_number,
                'content' => $bankTransaction->content,
                'qr_code_data' => $bankTransaction->qr_code_data,
                'qr_code_image_url' => $qrCodeImageUrl,
                'transaction_code' => $bankTransaction->transaction_code,
                'expires_at' => $bankTransaction->expires_at?->toDateTimeString(),
                'status' => $bankTransaction->status,
                'payment_method_code' => $order->paymentMethod->code,
                'payment_method_name' => $order->paymentMethod->name,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Không tìm thấy đơn hàng'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error in getQrCode: ' . $e->getMessage(), [
                'order_id' => $orderId,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Đã xảy ra lỗi khi lấy thông tin thanh toán: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/orders/{orderId}/payment/status",
     *     tags={"Payments"},
     *     summary="Kiểm tra trạng thái thanh toán",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="orderId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Trạng thái thanh toán",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string"),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="paid_at", type="string", format="date-time", nullable=true),
     *             @OA\Property(property="expires_at", type="string", format="date-time", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=404, description="Không tìm thấy đơn hàng hoặc giao dịch")
     * )
     */
    public function checkPaymentStatus(Request $request, $orderId)
    {
        try {
            // Kiểm tra bảng bank_transactions có tồn tại không
            $tableExists = false;
            try {
                $result = DB::select("SHOW TABLES LIKE 'bank_transactions'");
                $tableExists = !empty($result);
            } catch (\Exception $e) {
                try {
                    $tableExists = Schema::hasTable('bank_transactions');
                } catch (\Exception $e2) {
                    Log::error('Error checking bank_transactions table in checkPaymentStatus: ' . $e2->getMessage());
                    $tableExists = false;
                }
            }
            
            if (!$tableExists) {
                return response()->json([
                    'message' => 'Hệ thống thanh toán chưa được thiết lập. Vui lòng liên hệ quản trị viên để chạy migration.',
                    'error' => 'bank_transactions table does not exist'
                ], 500);
            }

            $order = Order::where('id', $orderId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            // Load bankTransaction bằng query trực tiếp thay vì relationship
            $bankTransaction = null;
            try {
                $bankTransaction = BankTransaction::where('order_id', $order->id)->first();
            } catch (\Exception $e) {
                Log::warning('Could not load bankTransaction in checkPaymentStatus: ' . $e->getMessage());
            }

            if (!$bankTransaction) {
                return response()->json([
                    'message' => 'Không tìm thấy giao dịch thanh toán'
                ], 404);
            }

            $bankTransferService = new BankTransferService();
            $status = $bankTransferService->checkPaymentStatus($bankTransaction);

            // Refresh order để lấy trạng thái mới nhất
            $order->refresh();

            return response()->json(array_merge($status, [
                'order_payment_status' => $order->payment_status,
                'expires_at' => $bankTransaction->expires_at?->toDateTimeString(),
                'paid_at' => isset($status['paid_at']) ? ($status['paid_at'] instanceof \Carbon\Carbon ? $status['paid_at']->toDateTimeString() : $status['paid_at']) : ($bankTransaction->paid_at?->toDateTimeString()),
            ]));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Không tìm thấy đơn hàng'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error in checkPaymentStatus: ' . $e->getMessage(), [
                'order_id' => $orderId,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Đã xảy ra lỗi khi kiểm tra trạng thái thanh toán: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/admin/payments/{transactionId}/confirm",
     *     tags={"Admin"},
     *     summary="Xác nhận thanh toán (Admin)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="transactionId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="bank_reference", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Xác nhận thành công"),
     *     @OA\Response(response=403, description="Không có quyền"),
     *     @OA\Response(response=404, description="Không tìm thấy giao dịch")
     * )
     */
    public function confirmPayment(Request $request, $transactionId)
    {
        // Chỉ admin mới được xác nhận
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Bạn không có quyền thực hiện hành động này'], 403);
        }

        $bankTransaction = BankTransaction::findOrFail($transactionId);
        $bankReference = $request->input('bank_reference');

        $bankTransferService = new BankTransferService();
        $success = $bankTransferService->confirmPayment($bankTransaction, $bankReference);

        if ($success) {
            return response()->json([
                'message' => 'Xác nhận thanh toán thành công',
                'transaction' => $bankTransaction->fresh(),
            ]);
        }

        return response()->json([
            'message' => 'Không thể xác nhận thanh toán. Giao dịch có thể đã được xử lý hoặc đã hết hạn.'
        ], 400);
    }

    /**
     * @OA\Post(
     *     path="/payments/webhook",
     *     tags={"Payments"},
     *     summary="Webhook nhận thông báo thanh toán từ ngân hàng",
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="transaction_code", type="string"),
     *             @OA\Property(property="bank_reference", type="string"),
     *             @OA\Property(property="amount", type="number"),
     *             @OA\Property(property="status", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Xử lý thành công")
     * )
     */
    public function webhook(Request $request)
    {
        // TODO: Implement webhook verification với ngân hàng
        // Verify signature từ ngân hàng để đảm bảo request hợp lệ
        
        $transactionCode = $request->input('transaction_code');
        $bankReference = $request->input('bank_reference');
        $amount = $request->input('amount');
        $status = $request->input('status');

        $bankTransaction = BankTransaction::where('transaction_code', $transactionCode)->first();

        if (!$bankTransaction) {
            return response()->json(['message' => 'Không tìm thấy giao dịch'], 404);
        }

        // Kiểm tra số tiền
        if ($amount != $bankTransaction->amount) {
            return response()->json(['message' => 'Số tiền không khớp'], 400);
        }

        // Xác nhận thanh toán nếu status là success
        if ($status === 'success' || $status === 'paid') {
            $bankTransferService = new BankTransferService();
            $bankTransferService->confirmPayment($bankTransaction, $bankReference);
        }

        return response()->json(['message' => 'Webhook processed']);
    }
}

