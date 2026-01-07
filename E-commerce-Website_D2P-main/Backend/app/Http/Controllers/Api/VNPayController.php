<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\VNPayTransaction;
use App\Services\VNPayService;
use App\Services\OrderMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VNPayController extends Controller
{
    protected VNPayService $vnpayService;
    protected OrderMailService $mailService;

    public function __construct(VNPayService $vnpayService, OrderMailService $mailService)
    {
        $this->vnpayService = $vnpayService;
        $this->mailService = $mailService;
    }

    /**
     * Tạo URL thanh toán VNPay cho đơn hàng
     *
     * @OA\Post(
     *     path="/payments/vnpay/create/{orderId}",
     *     tags={"Payments"},
     *     summary="Tạo URL thanh toán VNPay",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="orderId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Success"),
     *     @OA\Response(response=404, description="Order not found"),
     *     @OA\Response(response=422, description="Invalid order status")
     * )
     */
    public function createPayment(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);

        // Kiểm tra quyền truy cập
        if ($order->user_id !== $request->user()->id && !$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        // Kiểm tra trạng thái đơn hàng
        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Đơn hàng đã được thanh toán'], 422);
        }

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Đơn hàng đã bị hủy'], 422);
        }

        // Kiểm tra phương thức thanh toán
        $paymentMethod = $order->paymentMethod;
        if (!$paymentMethod || !in_array($paymentMethod->code, ['VNPAY', 'vnpay'])) {
            return response()->json(['message' => 'Phương thức thanh toán không phải VNPay'], 422);
        }

        // Tạo URL thanh toán
        $result = $this->vnpayService->createPaymentUrl($order);

        if (!$result['success']) {
            return response()->json([
                'message' => $result['error'],
            ], 500);
        }

        return response()->json([
            'message' => 'Tạo URL thanh toán thành công',
            'payment_url' => $result['payment_url'],
            'txn_ref' => $result['txn_ref'],
            'expires_at' => $result['expires_at'],
            'expiry_minutes' => config('vnpay.expiry_minutes', 15),
        ]);
    }

    /**
     * Xử lý Return URL từ VNPay (redirect về frontend)
     * Endpoint này được gọi khi user hoàn thành thanh toán và redirect về
     *
     * @OA\Get(
     *     path="/payments/vnpay/return",
     *     tags={"Payments"},
     *     summary="Xử lý callback từ VNPay",
     *     @OA\Response(response=302, description="Redirect to frontend")
     * )
     */
    public function handleReturn(Request $request)
    {
        $vnpData = $request->all();

        Log::info('VNPay Return URL called', $vnpData);

        // Xác thực và lấy thông tin giao dịch
        $result = $this->vnpayService->verifyReturnUrl($vnpData);

        if (!$result['success']) {
            // Redirect về frontend với error
            $frontendUrl = config('vnpay.return_url', 'http://localhost:3000/payment/vnpay/return');
            return redirect($frontendUrl . '?error=' . urlencode($result['error']));
        }

        // Tìm transaction
        $txnRef = $result['txn_ref'];
        $transaction = VNPayTransaction::where('txn_ref', $txnRef)->first();

        if ($transaction && $result['is_success']) {
            // Cập nhật transaction
            $transaction->update([
                'vnp_transaction_no' => $result['transaction_no'],
                'vnp_response_code' => $result['response_code'],
                'bank_code' => $result['bank_code'],
                'pay_date' => $result['pay_date'],
                'status' => 'success',
                'response_data' => $vnpData,
            ]);

            // Cập nhật order
            $order = $transaction->order;
            if ($order && $order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                ]);

                // Gửi email xác nhận
                try {
                    $this->mailService->sendInvoice($order);
                } catch (\Exception $e) {
                    Log::error('Failed to send invoice email after VNPay payment', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } elseif ($transaction) {
            // Cập nhật transaction thất bại
            $transaction->update([
                'vnp_response_code' => $result['response_code'],
                'status' => 'failed',
                'response_data' => $vnpData,
            ]);
        }

        // Redirect về frontend với kết quả
        $frontendUrl = config('vnpay.return_url', 'http://localhost:3000/payment/vnpay/return');
        $queryParams = http_build_query([
            'vnp_ResponseCode' => $result['response_code'],
            'vnp_TxnRef' => $txnRef,
            'vnp_Amount' => $result['amount'],
            'vnp_TransactionNo' => $result['transaction_no'] ?? '',
            'vnp_BankCode' => $result['bank_code'] ?? '',
            'success' => $result['is_success'] ? '1' : '0',
            'message' => urlencode($result['message']),
        ]);

        return redirect($frontendUrl . '?' . $queryParams);
    }

    /**
     * Webhook IPN từ VNPay (xác thực tự động)
     * Endpoint này được VNPay gọi để xác nhận thanh toán
     *
     * @OA\Post(
     *     path="/payments/vnpay/webhook",
     *     tags={"Payments"},
     *     summary="VNPay IPN Webhook",
     *     @OA\Response(response=200, description="IPN Response")
     * )
     */
    public function handleWebhook(Request $request)
    {
        $vnpData = $request->all();

        Log::info('VNPay Webhook IPN received', $vnpData);

        // Xử lý IPN
        $result = $this->vnpayService->handleIPN($vnpData);

        Log::info('VNPay Webhook IPN response', $result);

        // Trả về response theo format VNPay yêu cầu
        return response()->json($result);
    }

    /**
     * Kiểm tra trạng thái giao dịch
     *
     * @OA\Get(
     *     path="/payments/vnpay/status/{txnRef}",
     *     tags={"Payments"},
     *     summary="Kiểm tra trạng thái giao dịch VNPay",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="txnRef", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Transaction status"),
     *     @OA\Response(response=404, description="Transaction not found")
     * )
     */
    public function checkStatus(Request $request, $txnRef)
    {
        $transaction = VNPayTransaction::where('txn_ref', $txnRef)
            ->with('order')
            ->first();

        if (!$transaction) {
            return response()->json(['message' => 'Không tìm thấy giao dịch'], 404);
        }

        // Kiểm tra quyền
        $order = $transaction->order;
        if ($order && $order->user_id !== $request->user()->id && !$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Không có quyền truy cập'], 403);
        }

        return response()->json([
            'txn_ref' => $transaction->txn_ref,
            'order_id' => $transaction->order_id,
            'order_code' => $order->code ?? null,
            'amount' => $transaction->amount,
            'status' => $transaction->status,
            'vnp_response_code' => $transaction->vnp_response_code,
            'vnp_transaction_no' => $transaction->vnp_transaction_no,
            'bank_code' => $transaction->bank_code,
            'pay_date' => $transaction->pay_date,
            'is_success' => $transaction->isSuccess(),
            'error_message' => $transaction->getErrorMessage(),
            'created_at' => $transaction->created_at,
        ]);
    }

    /**
     * Lấy thông tin cấu hình VNPay (public)
     *
     * @OA\Get(
     *     path="/payments/vnpay/info",
     *     tags={"Payments"},
     *     summary="Lấy thông tin VNPay",
     *     @OA\Response(response=200, description="VNPay info")
     * )
     */
    public function getInfo()
    {
        return response()->json([
            'enabled' => VNPayService::isEnabled(),
            'info' => VNPayService::getPaymentInfo(),
        ]);
    }

    /**
     * Xác thực kết quả thanh toán VNPay từ frontend (API)
     * Frontend gọi API này sau khi VNPay redirect về để xác thực và cập nhật order
     *
     * @OA\Get(
     *     path="/payments/vnpay/verify",
     *     tags={"Payments"},
     *     summary="Xác thực kết quả thanh toán VNPay",
     *     @OA\Response(response=200, description="Verification result")
     * )
     */
    public function verifyReturn(Request $request)
    {
        $vnpData = $request->all();

        Log::info('VNPay Verify Return called', $vnpData);

        // Xác thực chữ ký và lấy thông tin giao dịch
        $result = $this->vnpayService->verifyReturnUrl($vnpData);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'],
            ], 400);
        }

        // Tìm transaction
        $txnRef = $result['txn_ref'];
        $transaction = VNPayTransaction::where('txn_ref', $txnRef)->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy giao dịch',
            ], 404);
        }

        $order = $transaction->order;

        if ($result['is_success']) {
            // Cập nhật transaction nếu chưa success
            if ($transaction->status !== 'success') {
                $transaction->update([
                    'vnp_transaction_no' => $result['transaction_no'],
                    'vnp_response_code' => $result['response_code'],
                    'bank_code' => $result['bank_code'],
                    'pay_date' => $result['pay_date'],
                    'status' => 'success',
                    'response_data' => $vnpData,
                ]);

                // Cập nhật order
                if ($order && $order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                    ]);

                    // Gửi email xác nhận
                    try {
                        $this->mailService->sendInvoice($order);
                    } catch (\Exception $e) {
                        Log::error('Failed to send invoice email after VNPay verification', [
                            'order_id' => $order->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Thanh toán thành công',
                'data' => [
                    'txn_ref' => $txnRef,
                    'order_id' => $order->id ?? null,
                    'order_code' => $order->code ?? null,
                    'amount' => $result['amount'],
                    'transaction_no' => $result['transaction_no'],
                    'bank_code' => $result['bank_code'],
                    'pay_date' => $result['pay_date'],
                    'response_code' => $result['response_code'],
                ],
            ]);
        } else {
            // Cập nhật transaction thất bại
            if ($transaction->status === 'pending') {
                $transaction->update([
                    'vnp_response_code' => $result['response_code'],
                    'status' => 'failed',
                    'response_data' => $vnpData,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Thanh toán thất bại',
                'data' => [
                    'txn_ref' => $txnRef,
                    'order_id' => $order->id ?? null,
                    'order_code' => $order->code ?? null,
                    'response_code' => $result['response_code'],
                ],
            ]);
        }
    }
}
