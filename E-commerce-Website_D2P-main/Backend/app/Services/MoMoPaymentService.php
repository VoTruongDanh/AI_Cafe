<?php

namespace App\Services;

use App\Models\Order;
use App\Models\MoMoTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * MoMo Payment Gateway Service
 *
 * Tích hợp thanh toán MoMo với webhook tự động xác nhận
 *
 * @see https://developers.momo.vn/v3/vi/docs/payment/api/wallet/create
 */
class MoMoPaymentService
{
    protected string $partnerCode;
    protected string $accessKey;
    protected string $secretKey;
    protected string $endpoint;
    protected string $redirectUrl;
    protected string $ipnUrl;
    protected string $requestType;
    protected int $expiryMinutes;

    public function __construct()
    {
        $config = config('momo');

        $this->partnerCode = $config['partner_code'];
        $this->accessKey = $config['access_key'];
        $this->secretKey = $config['secret_key'];
        $this->redirectUrl = $config['redirect_url'];
        $this->ipnUrl = $config['ipn_url'];
        $this->requestType = $config['request_type'];
        $this->expiryMinutes = $config['expiry_minutes'];

        // Chọn endpoint dựa vào môi trường
        $environment = $config['environment'];
        $this->endpoint = $config['endpoints'][$environment] ?? $config['endpoints']['sandbox'];
    }

    /**
     * Tạo thanh toán MoMo
     *
     * @param Order $order
     * @return array
     */
    public function createPayment(Order $order): array
    {
        $requestId = Str::uuid()->toString();
        $orderId = $order->code . '_' . time();
        $amount = (int) $order->grand_total;
        $orderInfo = "Thanh toán đơn hàng {$order->code}";
        $extraData = base64_encode(json_encode([
            'order_id' => $order->id,
            'order_code' => $order->code,
        ]));

        // Tạo raw signature string theo thứ tự của MoMo
        $rawSignature = "accessKey={$this->accessKey}"
            . "&amount={$amount}"
            . "&extraData={$extraData}"
            . "&ipnUrl={$this->ipnUrl}"
            . "&orderId={$orderId}"
            . "&orderInfo={$orderInfo}"
            . "&partnerCode={$this->partnerCode}"
            . "&redirectUrl={$this->redirectUrl}"
            . "&requestId={$requestId}"
            . "&requestType={$this->requestType}";

        // Tạo chữ ký HMAC SHA256
        $signature = hash_hmac('sha256', $rawSignature, $this->secretKey);

        // Dữ liệu gửi đến MoMo
        $data = [
            'partnerCode' => $this->partnerCode,
            'partnerName' => 'ElectroShop',
            'storeId' => $this->partnerCode,
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $orderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $this->redirectUrl,
            'ipnUrl' => $this->ipnUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => $this->requestType,
            'signature' => $signature,
        ];

        Log::info('MoMo Payment Request', [
            'order_code' => $order->code,
            'amount' => $amount,
            'momo_order_id' => $orderId,
        ]);

        try {
            // Gọi API tạo thanh toán
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->endpoint}/create", $data);

            $result = $response->json();

            Log::info('MoMo Payment Response', [
                'order_code' => $order->code,
                'result_code' => $result['resultCode'] ?? 'unknown',
                'message' => $result['message'] ?? 'No message',
                'pay_url' => $result['payUrl'] ?? null,
                'qr_code_url' => $result['qrCodeUrl'] ?? null,
                'deep_link' => $result['deeplink'] ?? $result['deeplinkMiniApp'] ?? null,
            ]);

            // Kiểm tra kết quả
            if (isset($result['resultCode']) && $result['resultCode'] == 0) {
                // MoMo trả về qrCodeUrl là EMVCo string (không phải URL ảnh)
                // Cần tạo QR image URL từ payUrl hoặc qrCodeUrl string
                $qrData = $result['qrCodeUrl'] ?? $result['payUrl'] ?? null;
                $qrCodeUrl = null;

                if ($qrData) {
                    // Kiểm tra xem qrData có phải URL không
                    if (filter_var($qrData, FILTER_VALIDATE_URL)) {
                        // Nếu là URL thì tạo QR từ URL đó
                        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qrData);
                    } else {
                        // Nếu là EMVCo string thì tạo QR từ string đó
                        $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qrData);
                    }
                }

                // Lưu giao dịch MoMo
                MoMoTransaction::create([
                    'order_id' => $order->id,
                    'momo_order_id' => $orderId,
                    'request_id' => $requestId,
                    'amount' => $amount,
                    'order_info' => $orderInfo,
                    'pay_url' => $result['payUrl'] ?? null,
                    'qr_code_url' => $qrCodeUrl,
                    'deep_link' => $result['deeplink'] ?? $result['deeplinkMiniApp'] ?? null,
                    'status' => 'pending',
                    'expires_at' => now()->addMinutes($this->expiryMinutes),
                ]);

                return [
                    'success' => true,
                    'pay_url' => $result['payUrl'] ?? null,
                    'qr_code_url' => $qrCodeUrl,
                    'deep_link' => $result['deeplink'] ?? $result['deeplinkMiniApp'] ?? null,
                    'momo_order_id' => $orderId,
                    'amount' => $amount,
                    'message' => 'Tạo thanh toán thành công',
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Không thể tạo thanh toán MoMo',
                'result_code' => $result['resultCode'] ?? -1,
            ];

        } catch (\Exception $e) {
            Log::error('MoMo Payment Error', [
                'order_code' => $order->code,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi kết nối đến MoMo: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Xác thực webhook từ MoMo
     *
     * @param array $data
     * @return bool
     */
    public function verifyWebhook(array $data): bool
    {
        if (!isset($data['signature'])) {
            return false;
        }

        // Tạo raw signature để xác thực
        $rawSignature = "accessKey={$this->accessKey}"
            . "&amount={$data['amount']}"
            . "&extraData={$data['extraData']}"
            . "&message={$data['message']}"
            . "&orderId={$data['orderId']}"
            . "&orderInfo={$data['orderInfo']}"
            . "&orderType={$data['orderType']}"
            . "&partnerCode={$data['partnerCode']}"
            . "&payType={$data['payType']}"
            . "&requestId={$data['requestId']}"
            . "&responseTime={$data['responseTime']}"
            . "&resultCode={$data['resultCode']}"
            . "&transId={$data['transId']}";

        $expectedSignature = hash_hmac('sha256', $rawSignature, $this->secretKey);

        return hash_equals($expectedSignature, $data['signature']);
    }

    /**
     * Xử lý webhook callback từ MoMo
     *
     * @param array $data
     * @return array
     */
    public function handleWebhook(array $data): array
    {
        Log::info('MoMo Webhook Received', $data);

        // Xác thực chữ ký
        if (!$this->verifyWebhook($data)) {
            Log::warning('MoMo Webhook Invalid Signature', ['orderId' => $data['orderId'] ?? 'unknown']);
            return [
                'success' => false,
                'message' => 'Invalid signature',
            ];
        }

        // Tìm giao dịch
        $momoOrderId = $data['orderId'] ?? null;
        $transaction = MoMoTransaction::where('momo_order_id', $momoOrderId)->first();

        if (!$transaction) {
            Log::warning('MoMo Webhook Transaction Not Found', ['momo_order_id' => $momoOrderId]);
            return [
                'success' => false,
                'message' => 'Transaction not found',
            ];
        }

        // Cập nhật trạng thái giao dịch
        $resultCode = $data['resultCode'] ?? -1;
        $transId = $data['transId'] ?? null;

        if ($resultCode == 0) {
            // Thanh toán thành công
            $transaction->update([
                'status' => 'paid',
                'trans_id' => $transId,
                'pay_type' => $data['payType'] ?? null,
                'paid_at' => now(),
                'response_data' => json_encode($data),
            ]);

            // Cập nhật đơn hàng
            $order = $transaction->order;
            if ($order) {
                $order->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                ]);

                // Gửi email hóa đơn sau khi thanh toán MoMo thành công
                try {
                    $mailService = app(OrderMailService::class);
                    $mailService->sendInvoice($order);
                } catch (\Exception $e) {
                    Log::error("Failed to send invoice after MoMo payment: " . $e->getMessage());
                }

                Log::info('MoMo Payment Confirmed', [
                    'order_code' => $order->code,
                    'trans_id' => $transId,
                    'amount' => $data['amount'],
                ]);
            }

            return [
                'success' => true,
                'message' => 'Payment confirmed',
            ];

        } else {
            // Thanh toán thất bại
            $transaction->update([
                'status' => 'failed',
                'result_code' => $resultCode,
                'response_data' => json_encode($data),
            ]);

            Log::warning('MoMo Payment Failed', [
                'momo_order_id' => $momoOrderId,
                'result_code' => $resultCode,
                'message' => $data['message'] ?? 'Unknown error',
            ]);

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Payment failed',
            ];
        }
    }

    /**
     * Kiểm tra trạng thái giao dịch
     *
     * @param string $momoOrderId
     * @return array
     */
    public function checkTransactionStatus(string $momoOrderId): array
    {
        $requestId = Str::uuid()->toString();

        $rawSignature = "accessKey={$this->accessKey}"
            . "&orderId={$momoOrderId}"
            . "&partnerCode={$this->partnerCode}"
            . "&requestId={$requestId}";

        $signature = hash_hmac('sha256', $rawSignature, $this->secretKey);

        $data = [
            'partnerCode' => $this->partnerCode,
            'requestId' => $requestId,
            'orderId' => $momoOrderId,
            'signature' => $signature,
            'lang' => 'vi',
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->endpoint}/query", $data);

            $result = $response->json();

            Log::info('MoMo Query Status Response', [
                'momo_order_id' => $momoOrderId,
                'result' => $result,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('MoMo Query Status Error', [
                'momo_order_id' => $momoOrderId,
                'error' => $e->getMessage(),
            ]);

            return [
                'resultCode' => -1,
                'message' => 'Không thể kiểm tra trạng thái giao dịch',
            ];
        }
    }

    /**
     * Tạo QR Code URL tĩnh (fallback khi không dùng API)
     *
     * @param string $orderCode
     * @param float $amount
     * @return string
     */
    public static function generateStaticQRUrl(string $orderCode, float $amount): string
    {
        $config = config('momo');

        if (!$config['enabled']) {
            return '';
        }

        $phoneNumber = $config['account']['phone_number'];
        $accountName = $config['account']['account_name'];
        $transferContent = str_replace('{order_code}', $orderCode, $config['transfer_content_template']);

        // MoMo Deep Link format
        $momoData = "2|99|{$phoneNumber}|{$accountName}||0|0|" . (int)$amount . "|{$transferContent}";

        // Tạo QR code
        $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($momoData);

        return $qrUrl;
    }

    /**
     * Lấy thông tin tài khoản MoMo
     *
     * @return array
     */
    public static function getAccountInfo(): array
    {
        $config = config('momo');

        return [
            'phone_number' => $config['account']['phone_number'],
            'account_name' => $config['account']['account_name'],
            'payment_method' => 'MoMo E-Wallet',
        ];
    }

    /**
     * Kiểm tra API MoMo có được cấu hình hay không
     *
     * @return bool
     */
    public function isApiConfigured(): bool
    {
        return !empty($this->accessKey) && !empty($this->secretKey);
    }

    /**
     * Hoàn tiền giao dịch MoMo
     *
     * @param Order $order
     * @param string|null $description Lý do hoàn tiền
     * @return array
     */
    public function refundPayment(Order $order, ?string $description = null): array
    {
        // Tìm giao dịch MoMo của đơn hàng
        $transaction = MoMoTransaction::where('order_id', $order->id)
            ->where('status', 'paid')
            ->first();

        if (!$transaction) {
            return [
                'success' => false,
                'message' => 'Không tìm thấy giao dịch MoMo đã thanh toán cho đơn hàng này',
            ];
        }

        if (!$transaction->trans_id) {
            return [
                'success' => false,
                'message' => 'Không có mã giao dịch MoMo (transId) để hoàn tiền',
            ];
        }

        $requestId = Str::uuid()->toString();
        $orderId = $transaction->momo_order_id . '_refund_' . time();
        $amount = (int) $transaction->amount;
        $transId = $transaction->trans_id;
        $desc = $description ?? "Hoàn tiền đơn hàng {$order->code}";

        // Tạo raw signature string theo thứ tự của MoMo Refund API
        $rawSignature = "accessKey={$this->accessKey}"
            . "&amount={$amount}"
            . "&description={$desc}"
            . "&orderId={$orderId}"
            . "&partnerCode={$this->partnerCode}"
            . "&requestId={$requestId}"
            . "&transId={$transId}";

        // Tạo chữ ký HMAC SHA256
        $signature = hash_hmac('sha256', $rawSignature, $this->secretKey);

        // Dữ liệu gửi đến MoMo
        $data = [
            'partnerCode' => $this->partnerCode,
            'orderId' => $orderId,
            'requestId' => $requestId,
            'amount' => $amount,
            'transId' => $transId,
            'lang' => 'vi',
            'description' => $desc,
            'signature' => $signature,
        ];

        Log::info('MoMo Refund Request', [
            'order_code' => $order->code,
            'amount' => $amount,
            'trans_id' => $transId,
        ]);

        try {
            // Gọi API hoàn tiền
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->endpoint}/refund", $data);

            $result = $response->json();

            Log::info('MoMo Refund Response', [
                'order_code' => $order->code,
                'result_code' => $result['resultCode'] ?? 'unknown',
                'message' => $result['message'] ?? 'No message',
            ]);

            // resultCode = 0 là thành công
            if (isset($result['resultCode']) && $result['resultCode'] == 0) {
                // Cập nhật giao dịch
                $transaction->update([
                    'status' => 'refunded',
                    'refund_trans_id' => $result['transId'] ?? null,
                    'refunded_at' => now(),
                    'refund_response' => json_encode($result),
                ]);

                return [
                    'success' => true,
                    'message' => 'Hoàn tiền MoMo thành công',
                    'refund_trans_id' => $result['transId'] ?? null,
                ];
            }

            // Các mã lỗi phổ biến:
            // 11: Giao dịch không tồn tại
            // 13: Giao dịch đã hoàn tiền
            // 21: Số tiền hoàn không hợp lệ
            return [
                'success' => false,
                'message' => $result['message'] ?? 'Hoàn tiền MoMo thất bại',
                'result_code' => $result['resultCode'] ?? -1,
            ];

        } catch (\Exception $e) {
            Log::error('MoMo Refund Error', [
                'order_code' => $order->code,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Lỗi kết nối đến MoMo: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Kiểm tra đơn hàng có thể hoàn tiền MoMo không
     *
     * @param Order $order
     * @return bool
     */
    public function canRefund(Order $order): bool
    {
        $transaction = MoMoTransaction::where('order_id', $order->id)
            ->where('status', 'paid')
            ->whereNotNull('trans_id')
            ->first();

        return $transaction !== null;
    }
}
