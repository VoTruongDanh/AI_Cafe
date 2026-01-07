<?php

namespace App\Services;

class VietQRService
{
    /**
     * Tạo URL mã QR VietQR miễn phí
     *
     * @param string $orderCode Mã đơn hàng
     * @param float $amount Số tiền
     * @param string|null $description Mô tả thêm
     * @return string URL của mã QR
     */
    public static function generateQRUrl(string $orderCode, float $amount, ?string $description = null): string
    {
        $config = config('bank_transfer');

        if (!$config['enabled']) {
            return '';
        }

        $bankCode = strtoupper($config['account']['bank_code']); // Phải viết HOA
        $accountNumber = $config['account']['account_number'];
        $accountName = $config['account']['account_name'];

        // Tạo nội dung chuyển khoản
        $transferContent = str_replace('{order_code}', $orderCode, $config['transfer_content_template']);
        if ($description) {
            $transferContent .= ' ' . $description;
        }

        // Build VietQR URL - Format mới (compact2)
        // https://img.vietqr.io/image/BANK-ACCOUNT-compact2.jpg?amount=X&addInfo=Y&accountName=Z
        $baseUrl = $config['vietqr']['api_url'];

        // Encode parameters properly
        $params = [
            'amount' => (int)$amount,
            'addInfo' => $transferContent,
            'accountName' => $accountName,
        ];

        $qrUrl = "{$baseUrl}/{$bankCode}-{$accountNumber}-compact2.jpg?" . http_build_query($params);

        return $qrUrl;
    }

    /**
     * Lấy thông tin ngân hàng
     *
     * @return array
     */
    public static function getBankInfo(): array
    {
        $config = config('bank_transfer');

        return [
            'bank_code' => $config['account']['bank_code'],
            'bank_name' => self::getBankName($config['account']['bank_code']),
            'account_number' => $config['account']['account_number'],
            'account_name' => $config['account']['account_name'],
        ];
    }

    /**
     * Chuyển mã ngân hàng thành tên đầy đủ
     *
     * @param string $code
     * @return string
     */
    private static function getBankName(string $code): string
    {
        $banks = [
            'MB' => 'Ngân hàng Quân Đội (MB Bank)',
            'VCB' => 'Ngân hàng Ngoại Thương (Vietcombank)',
            'TCB' => 'Ngân hàng Kỹ Thương (Techcombank)',
            'ACB' => 'Ngân hàng Á Châu (ACB)',
            'VPB' => 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)',
            'TPB' => 'Ngân hàng Tiên Phong (TPBank)',
            'STB' => 'Ngân hàng Sài Gòn Thương Tín (Sacombank)',
            'VIB' => 'Ngân hàng Quốc Tế (VIB)',
            'MSB' => 'Ngân hàng Hàng Hải (MSB)',
            'BIDV' => 'Ngân hàng Đầu Tư và Phát Triển (BIDV)',
            'AGR' => 'Ngân hàng Nông Nghiệp (Agribank)',
            'SCB' => 'Ngân hàng TMCP Sài Gòn (SCB)',
            'OCB' => 'Ngân hàng Phương Đông (OCB)',
        ];

        return $banks[strtoupper($code)] ?? $code;
    }

    /**
     * Tạo nội dung chuyển khoản từ mã đơn hàng
     *
     * @param string $orderCode
     * @return string
     */
    public static function generateTransferContent(string $orderCode): string
    {
        $template = config('bank_transfer.transfer_content_template');
        return str_replace('{order_code}', $orderCode, $template);
    }
}
