<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\MoMoTransaction;
use App\Services\MoMoPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use OpenApi\Annotations as OA;

/**
 * MoMo Payment Controller
 *
 * Xử lý thanh toán MoMo với webhook tự động
 */
class MoMoPaymentController extends Controller
{
    protected MoMoPaymentService $momoService;

    public function __construct(MoMoPaymentService $momoService)
    {
        $this->momoService = $momoService;
    }

    /**
     * @OA\Post(
     *     path="/orders/{orderId}/momo/create",
     *     tags={"MoMo Payments"},
     *     summary="Tạo thanh toán MoMo cho đơn hàng",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="orderId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Tạo thanh toán thành công",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean"),
     *             @OA\Property(property="pay_url", type="string"),
     *             @OA\Property(property="qr_code_url", type="string"),
     *             @OA\Property(property="deep_link", type="string"),
     *             @OA\Property(property="momo_order_id", type="string"),
     *             @OA\Property(property="amount", type="integer"),
     *             @OA\Property(property="expires_at", type="string")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Lỗi tạo thanh toán"),
     *     @OA\Response(response=404, description="Không tìm thấy đơn hàng")
     * )
     */
    public function createPayment(Request $request, $orderId): JsonResponse
    {
        try {
            // Lấy đơn hàng - Admin/Staff có thể tạo thanh toán cho bất kỳ đơn nào
            $user = $request->user();
            $query = Order::where('id', $orderId);
            
            // Nếu là customer thì chỉ được thanh toán đơn của mình
            if ($user->isCustomer()) {
                $query->where('user_id', $user->id);
            }
            
            $order = $query->firstOrFail();

            // Kiểm tra trạng thái đơn hàng
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Đơn hàng đã được thanh toán',
                ], 400);
            }

            // Kiểm tra xem đã có giao dịch MoMo đang pending chưa
            $existingTransaction = MoMoTransaction::where('order_id', $order->id)
                ->pending()
                ->first();

            if ($existingTransaction) {
                // Kiểm tra nếu giao dịch đã hết hạn thì cập nhật status
                if ($existingTransaction->isExpired()) {
                    $existingTransaction->update(['status' => 'expired']);
                } else {
                    // Trả về giao dịch đang pending với thời gian chính xác
                    return response()->json([
                        'success' => true,
                        'pay_url' => $existingTransaction->pay_url,
                        'qr_code_url' => $existingTransaction->qr_code_url,
                        'deep_link' => $existingTransaction->deep_link,
                        'momo_order_id' => $existingTransaction->momo_order_id,
                        'order_code' => $order->code,
                        'amount' => $existingTransaction->amount,
                        'expires_at' => $existingTransaction->expires_at?->toIso8601String(),
                        'message' => 'Đang có giao dịch chờ thanh toán',
                    ]);
                }
            }

            // Kiểm tra MoMo API có được cấu hình không
            if (!$this->momoService->isApiConfigured()) {
                // Fallback: Tạo QR tĩnh
                return $this->createStaticQRPayment($order);
            }

            // Tạo thanh toán MoMo mới
            $result = $this->momoService->createPayment($order);

            if ($result['success']) {
                $transaction = MoMoTransaction::where('order_id', $order->id)
                    ->latest()
                    ->first();

                return response()->json([
                    'success' => true,
                    'pay_url' => $result['pay_url'],
                    'qr_code_url' => $result['qr_code_url'],
                    'deep_link' => $result['deep_link'],
                    'momo_order_id' => $result['momo_order_id'],
                    'order_code' => $order->code,
                    'amount' => $result['amount'],
                    'expires_at' => $transaction?->expires_at?->toIso8601String(),
                    'message' => $result['message'],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy đơn hàng',
            ], 404);
        } catch (\Exception $e) {
            Log::error('MoMo Create Payment Error', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo thanh toán MoMo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Tạo QR tĩnh (fallback khi không có API MoMo)
     */
    protected function createStaticQRPayment(Order $order): JsonResponse
    {
        $qrUrl = MoMoPaymentService::generateStaticQRUrl($order->code, $order->grand_total);
        $accountInfo = MoMoPaymentService::getAccountInfo();

        // Thời gian hết hạn: 15 phút từ bây giờ
        $expiryMinutes = config('momo.expiry_minutes', 15);
        $expiresAt = now()->addMinutes($expiryMinutes);

        // Tạo hoặc cập nhật giao dịch MoMo với QR tĩnh
        $transaction = MoMoTransaction::updateOrCreate(
            [
                'order_id' => $order->id,
                'status' => 'pending',
            ],
            [
                'momo_order_id' => $order->code . '_static_' . time(),
                'request_id' => \Illuminate\Support\Str::uuid()->toString(),
                'amount' => (int) $order->grand_total,
                'order_info' => "Thanh toán đơn hàng {$order->code}",
                'qr_code_url' => $qrUrl,
                'expires_at' => $expiresAt,
            ]
        );

        return response()->json([
            'success' => true,
            'is_static_qr' => true,
            'qr_code_url' => $qrUrl,
            'amount' => (int) $order->grand_total,
            'order_code' => $order->code,
            'transfer_content' => $order->code,
            'momo_info' => $accountInfo,
            'expires_at' => $expiresAt->toIso8601String(),
            'message' => 'Vui lòng quét mã QR hoặc chuyển tiền đến số điện thoại MoMo',
            'note' => 'Đây là QR tĩnh, admin cần xác nhận thanh toán thủ công',
        ]);
    }

    /**
     * @OA\Get(
     *     path="/orders/{orderId}/momo/status",
     *     tags={"MoMo Payments"},
     *     summary="Kiểm tra trạng thái thanh toán MoMo",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="orderId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Trạng thái thanh toán",
     *         @OA\JsonContent(
     *             @OA\Property(property="status", type="string"),
     *             @OA\Property(property="payment_status", type="string"),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="paid_at", type="string", nullable=true)
     *         )
     *     )
     * )
     */
    public function checkStatus(Request $request, $orderId): JsonResponse
    {
        try {
            // Admin/Staff có thể check status cho bất kỳ đơn nào
            $user = $request->user();
            $query = Order::where('id', $orderId);
            
            // Nếu là customer thì chỉ được check đơn của mình
            if ($user->isCustomer()) {
                $query->where('user_id', $user->id);
            }
            
            $order = $query->firstOrFail();

            // Kiểm tra đơn hàng đã thanh toán chưa
            if ($order->payment_status === 'paid') {
                return response()->json([
                    'status' => 'paid',
                    'payment_status' => $order->payment_status,
                    'message' => 'Đơn hàng đã được thanh toán',
                    'paid_at' => $order->paid_at?->toDateTimeString(),
                ]);
            }

            // Lấy giao dịch MoMo mới nhất
            $transaction = MoMoTransaction::where('order_id', $order->id)
                ->latest()
                ->first();

            if (!$transaction) {
                return response()->json([
                    'status' => 'no_transaction',
                    'payment_status' => $order->payment_status,
                    'message' => 'Chưa có giao dịch thanh toán',
                ]);
            }

            // Nếu giao dịch đang pending và MoMo API được cấu hình, kiểm tra trực tiếp
            if ($transaction->isPending() && $this->momoService->isApiConfigured()) {
                $queryResult = $this->momoService->checkTransactionStatus($transaction->momo_order_id);

                if (isset($queryResult['resultCode']) && $queryResult['resultCode'] == 0) {
                    // Cập nhật trạng thái
                    $transaction->update([
                        'status' => 'paid',
                        'trans_id' => $queryResult['transId'] ?? null,
                        'paid_at' => now(),
                    ]);

                    $order->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                    ]);

                    return response()->json([
                        'status' => 'paid',
                        'payment_status' => 'paid',
                        'message' => 'Thanh toán thành công',
                        'paid_at' => now()->toDateTimeString(),
                    ]);
                }
            }

            // Kiểm tra hết hạn
            if ($transaction->isExpired()) {
                return response()->json([
                    'status' => 'expired',
                    'payment_status' => $order->payment_status,
                    'message' => 'Giao dịch đã hết hạn, vui lòng tạo thanh toán mới',
                    'expires_at' => $transaction->expires_at?->toDateTimeString(),
                ]);
            }

            return response()->json([
                'status' => $transaction->status,
                'payment_status' => $order->payment_status,
                'message' => $this->getStatusMessage($transaction->status),
                'expires_at' => $transaction->expires_at?->toDateTimeString(),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Không tìm thấy đơn hàng',
            ], 404);
        }
    }

    /**
     * @OA\Post(
     *     path="/payments/momo/webhook",
     *     tags={"MoMo Payments"},
     *     summary="Webhook nhận kết quả thanh toán từ MoMo (IPN)",
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="partnerCode", type="string"),
     *             @OA\Property(property="orderId", type="string"),
     *             @OA\Property(property="requestId", type="string"),
     *             @OA\Property(property="amount", type="integer"),
     *             @OA\Property(property="transId", type="string"),
     *             @OA\Property(property="resultCode", type="integer"),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="signature", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Xử lý thành công"),
     *     @OA\Response(response=400, description="Lỗi xác thực")
     * )
     */
    public function webhook(Request $request): JsonResponse
    {
        $data = $request->all();

        Log::info('MoMo Webhook Incoming', [
            'ip' => $request->ip(),
            'data' => $data,
        ]);

        try {
            $result = $this->momoService->handleWebhook($data);

            if ($result['success']) {
                return response()->json([
                    'status' => 0,
                    'message' => 'OK',
                ]);
            }

            return response()->json([
                'status' => 1,
                'message' => $result['message'],
            ], 400);

        } catch (\Exception $e) {
            Log::error('MoMo Webhook Error', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return response()->json([
                'status' => 1,
                'message' => 'Internal error',
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/payments/momo/return",
     *     tags={"MoMo Payments"},
     *     summary="Xử lý redirect sau khi thanh toán MoMo",
     *     @OA\Parameter(name="orderId", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="resultCode", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect đến trang kết quả")
     * )
     */
    public function return(Request $request)
    {
        $orderId = $request->query('orderId');
        $resultCode = $request->query('resultCode');

        Log::info('MoMo Return', [
            'orderId' => $orderId,
            'resultCode' => $resultCode,
        ]);

        // Tìm giao dịch
        $transaction = MoMoTransaction::where('momo_order_id', $orderId)->first();

        if (!$transaction) {
            // Redirect đến trang lỗi
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            return redirect("{$frontendUrl}/payment/result?status=error&message=Không tìm thấy giao dịch");
        }

        $order = $transaction->order;
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        if ($resultCode == 0) {
            // Thanh toán thành công
            return redirect("{$frontendUrl}/payment/result?status=success&order_id={$order->id}&order_code={$order->code}");
        } else {
            // Thanh toán thất bại
            $message = urlencode($this->getMoMoResultMessage($resultCode));
            return redirect("{$frontendUrl}/payment/result?status=failed&order_id={$order->id}&message={$message}");
        }
    }

    /**
     * Lấy thông báo trạng thái
     */
    protected function getStatusMessage(string $status): string
    {
        return match ($status) {
            'pending' => 'Đang chờ thanh toán',
            'paid' => 'Đã thanh toán',
            'failed' => 'Thanh toán thất bại',
            'expired' => 'Giao dịch đã hết hạn',
            'cancelled' => 'Giao dịch đã bị hủy',
            default => 'Không xác định',
        };
    }

    /**
     * Lấy thông báo kết quả MoMo
     */
    protected function getMoMoResultMessage(int $resultCode): string
    {
        return match ($resultCode) {
            0 => 'Giao dịch thành công',
            9000 => 'Giao dịch được xác nhận thành công',
            8000 => 'Giao dịch đang được xử lý',
            7000 => 'Giao dịch đang được xử lý (trừ tiền)',
            1000 => 'Giao dịch đã khởi tạo, chờ người dùng xác nhận',
            11 => 'Truy cập bị từ chối',
            12 => 'Phiên bản API không được hỗ trợ',
            13 => 'Xác thực đối tác thất bại',
            20 => 'Yêu cầu không hợp lệ',
            21 => 'Số tiền không hợp lệ',
            40 => 'RequestId bị trùng',
            41 => 'OrderId bị trùng',
            42 => 'OrderId không hợp lệ hoặc không tìm thấy',
            43 => 'Yêu cầu bị hủy do xung đột',
            1001 => 'Thanh toán thất bại do tài khoản không đủ tiền',
            1002 => 'Giao dịch bị từ chối bởi nhà phát hành thẻ',
            1003 => 'Giao dịch bị hủy',
            1004 => 'Giao dịch thất bại do số tiền vượt hạn mức',
            1005 => 'URL hoặc QR code đã hết hạn',
            1006 => 'Người dùng từ chối xác nhận thanh toán',
            1007 => 'Tài khoản không tồn tại hoặc không hoạt động',
            default => 'Giao dịch thất bại',
        };
    }
}
