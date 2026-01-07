<?php

namespace App\Services;

use App\Models\Order;
use App\Models\VNPayTransaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VNPayService
{
    private string $tmnCode;
    private string $hashSecret;
    private string $paymentUrl;
    private string $returnUrl;
    private string $ipnUrl;

    public function __construct()
    {
        $config = config('vnpay');
        $this->tmnCode = $config['tmn_code'];
        $this->hashSecret = $config['hash_secret'];
        $this->ipnUrl = $config['ipn_url'];

        // Tự động lấy return URL từ request Origin/Referer header
        $this->returnUrl = $this->getAutoReturnUrl($config['return_url']);

        $environment = $config['environment'];
        $this->paymentUrl = $config['endpoints'][$environment];
    }

    /**
     * Tự động lấy return URL dựa trên Origin của request
     */
    private function getAutoReturnUrl(string $defaultUrl): string
    {
        $request = request();

        // Lấy Origin từ header (frontend URL)
        $origin = $request->header('Origin');

        // Nếu không có Origin, thử lấy từ Referer
        if (empty($origin)) {
            $referer = $request->header('Referer');
            if (!empty($referer)) {
                $parsed = parse_url($referer);
                $origin = ($parsed['scheme'] ?? 'http') . '://' . ($parsed['host'] ?? 'localhost');
                if (!empty($parsed['port'])) {
                    $origin .= ':' . $parsed['port'];
                }
            }
        }

        // Nếu có Origin, sử dụng nó
        if (!empty($origin)) {
            return $origin . '/payment/vnpay/return';
        }

        // Fallback về default URL
        return $defaultUrl;
    }

    /**
     * Kiểm tra VNPay đã được cấu hình chưa
     */
    public static function isEnabled(): bool
    {
        return config('vnpay.enabled', false);
    }

    /**
     * Kiểm tra cấu hình đầy đủ
     */
    public function isConfigured(): bool
    {
        return !empty($this->tmnCode)
            && !empty($this->hashSecret)
            && $this->tmnCode !== 'YOUR_TMN_CODE';
    }

    /**
     * Tạo URL thanh toán VNPay
     *
     * @param Order $order
     * @return array ['success' => bool, 'payment_url' => string, 'error' => string]
     */
    public function createPaymentUrl(Order $order): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'VNPay chưa được cấu hình. Vui lòng kiểm tra file .env',
            ];
        }

        try {
            $config = config('vnpay');

            // Tạo mã giao dịch unique
            $txnRef = $order->code . '_' . time();

            // Thông tin đơn hàng
            $orderInfo = "Thanh toan don hang {$order->code}";
            $amount = (int) ($order->grand_total * 100); // VNPay yêu cầu nhân 100

            // Thời gian tạo và hết hạn (sử dụng timezone Việt Nam)
            $timezone = new \DateTimeZone('Asia/Ho_Chi_Minh');
            $now = new \DateTime('now', $timezone);
            $createDate = $now->format('YmdHis');

            $expireTime = clone $now;
            $expireTime->modify('+' . $config['expiry_minutes'] . ' minutes');
            $expireDate = $expireTime->format('YmdHis');

            // Build input data
            $inputData = [
                'vnp_Version' => $config['version'],
                'vnp_Command' => $config['command'],
                'vnp_TmnCode' => $this->tmnCode,
                'vnp_Locale' => $config['locale'],
                'vnp_CurrCode' => $config['currency'],
                'vnp_TxnRef' => $txnRef,
                'vnp_OrderInfo' => $orderInfo,
                'vnp_OrderType' => $config['order_type'],
                'vnp_Amount' => $amount,
                'vnp_ReturnUrl' => $this->returnUrl,
                'vnp_IpAddr' => request()->ip() ?? '127.0.0.1',
                'vnp_CreateDate' => $createDate,
                'vnp_ExpireDate' => $expireDate,
            ];

            // Thêm bank code nếu có
            if (!empty($config['bank_code'])) {
                $inputData['vnp_BankCode'] = $config['bank_code'];
            }

            // Sắp xếp theo key
            ksort($inputData);

            // Build query string và hash data (theo code demo VNPay)
            $query = '';
            $hashData = '';
            $i = 0;
            foreach ($inputData as $key => $value) {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . '=' . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . '=' . urlencode($value);
                    $i = 1;
                }
                $query .= urlencode($key) . '=' . urlencode($value) . '&';
            }

            // Tạo secure hash
            $secureHash = hash_hmac('sha512', $hashData, $this->hashSecret);
            $paymentUrl = $this->paymentUrl . '?' . $query . 'vnp_SecureHash=' . $secureHash;

            // Lưu transaction vào database
            VNPayTransaction::create([
                'order_id' => $order->id,
                'txn_ref' => $txnRef,
                'amount' => $order->grand_total,
                'order_info' => $orderInfo,
                'status' => 'pending',
                'expires_at' => $expireTime->format('Y-m-d H:i:s'),
                'created_at' => now(),
            ]);

            Log::info('VNPay payment URL created', [
                'order_id' => $order->id,
                'order_code' => $order->code,
                'txn_ref' => $txnRef,
                'amount' => $order->grand_total,
            ]);

            return [
                'success' => true,
                'payment_url' => $paymentUrl,
                'txn_ref' => $txnRef,
                'expires_at' => $expireTime->format('Y-m-d H:i:s'),
            ];

        } catch (\Exception $e) {
            Log::error('VNPay create payment URL failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Không thể tạo URL thanh toán: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Xác thực callback từ VNPay (Return URL)
     *
     * @param array $vnpData Dữ liệu từ VNPay
     * @return array
     */
    public function verifyReturnUrl(array $vnpData): array
    {
        try {
            $secureHash = $vnpData['vnp_SecureHash'] ?? '';

            // Loại bỏ các tham số hash để tính lại
            $inputData = [];
            foreach ($vnpData as $key => $value) {
                if (substr($key, 0, 4) == 'vnp_' && $key != 'vnp_SecureHash' && $key != 'vnp_SecureHashType') {
                    $inputData[$key] = $value;
                }
            }

            // Sắp xếp và tạo hash
            ksort($inputData);
            $hashData = '';
            $i = 0;
            foreach ($inputData as $key => $value) {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . '=' . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . '=' . urlencode($value);
                    $i = 1;
                }
            }

            $calculatedHash = hash_hmac('sha512', $hashData, $this->hashSecret);

            if ($secureHash !== $calculatedHash) {
                Log::warning('VNPay invalid signature', [
                    'received' => $secureHash,
                    'calculated' => $calculatedHash,
                ]);
                return [
                    'success' => false,
                    'error' => 'Chữ ký không hợp lệ',
                ];
            }

            $responseCode = $vnpData['vnp_ResponseCode'] ?? '';
            $txnRef = $vnpData['vnp_TxnRef'] ?? '';
            $amount = ($vnpData['vnp_Amount'] ?? 0) / 100; // VNPay trả về đã nhân 100
            $transactionNo = $vnpData['vnp_TransactionNo'] ?? '';
            $bankCode = $vnpData['vnp_BankCode'] ?? '';
            $payDate = $vnpData['vnp_PayDate'] ?? '';

            return [
                'success' => true,
                'response_code' => $responseCode,
                'txn_ref' => $txnRef,
                'amount' => $amount,
                'transaction_no' => $transactionNo,
                'bank_code' => $bankCode,
                'pay_date' => $payDate,
                'is_success' => $responseCode === '00',
                'message' => $this->getResponseMessage($responseCode),
            ];

        } catch (\Exception $e) {
            Log::error('VNPay verify return URL failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Lỗi xác thực: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Xử lý webhook IPN từ VNPay (tự động xác nhận)
     *
     * @param array $vnpData
     * @return array
     */
    public function handleIPN(array $vnpData): array
    {
        try {
            // Xác thực chữ ký
            $verifyResult = $this->verifyReturnUrl($vnpData);

            if (!$verifyResult['success']) {
                return [
                    'RspCode' => '97',
                    'Message' => 'Invalid Checksum',
                ];
            }

            $txnRef = $verifyResult['txn_ref'];
            $amount = $verifyResult['amount'];
            $responseCode = $verifyResult['response_code'];
            $transactionNo = $verifyResult['transaction_no'];

            // Tìm transaction
            $transaction = VNPayTransaction::where('txn_ref', $txnRef)->first();

            if (!$transaction) {
                Log::warning('VNPay IPN: Transaction not found', ['txn_ref' => $txnRef]);
                return [
                    'RspCode' => '01',
                    'Message' => 'Order not found',
                ];
            }

            // Kiểm tra số tiền
            if ((float) $transaction->amount !== (float) $amount) {
                Log::warning('VNPay IPN: Amount mismatch', [
                    'expected' => $transaction->amount,
                    'received' => $amount,
                ]);
                return [
                    'RspCode' => '04',
                    'Message' => 'Invalid amount',
                ];
            }

            // Kiểm tra đã xử lý chưa
            if ($transaction->status === 'success') {
                return [
                    'RspCode' => '02',
                    'Message' => 'Order already confirmed',
                ];
            }

            // Cập nhật transaction
            $transaction->update([
                'vnp_transaction_no' => $transactionNo,
                'vnp_response_code' => $responseCode,
                'bank_code' => $vnpData['vnp_BankCode'] ?? null,
                'pay_date' => $vnpData['vnp_PayDate'] ?? null,
                'status' => $responseCode === '00' ? 'success' : 'failed',
            ]);

            // Nếu thanh toán thành công, cập nhật order
            if ($responseCode === '00') {
                $order = $transaction->order;
                if ($order) {
                    $order->update([
                        'payment_status' => 'paid',
                        'paid_at' => now(),
                    ]);

                    Log::info('VNPay IPN: Payment confirmed', [
                        'order_id' => $order->id,
                        'order_code' => $order->code,
                        'amount' => $amount,
                    ]);

                    // Gửi email xác nhận thanh toán
                    try {
                        $mailService = app(\App\Services\MailService::class);
                        $mailService->sendInvoice($order);
                    } catch (\Exception $e) {
                        Log::error('Failed to send payment confirmation email', [
                            'order_id' => $order->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            return [
                'RspCode' => '00',
                'Message' => 'Confirm Success',
            ];

        } catch (\Exception $e) {
            Log::error('VNPay IPN handling failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'RspCode' => '99',
                'Message' => 'Unknown error',
            ];
        }
    }

    /**
     * Lấy thông tin thanh toán VNPay
     */
    public static function getPaymentInfo(): array
    {
        return [
            'name' => 'VNPay',
            'description' => 'Thanh toán qua cổng VNPay - Hỗ trợ ATM, Visa, MasterCard, JCB',
            'logo' => '/images/payments/vnpay.png',
            'supported_banks' => [
                'NCB', 'VIETCOMBANK', 'VIETINBANK', 'BIDV', 'AGRIBANK',
                'SACOMBANK', 'TECHCOMBANK', 'MBBANK', 'TPBANK', 'VPBANK',
            ],
        ];
    }

    /**
     * Lấy message từ response code
     */
    private function getResponseMessage(string $code): string
    {
        $messages = [
            '00' => 'Giao dịch thành công',
            '07' => 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
            '09' => 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
            '10' => 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11' => 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
            '12' => 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
            '13' => 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
            '24' => 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51' => 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
            '65' => 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
            '75' => 'Ngân hàng thanh toán đang bảo trì',
            '79' => 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
            '99' => 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
        ];

        return $messages[$code] ?? 'Lỗi không xác định';
    }
}
