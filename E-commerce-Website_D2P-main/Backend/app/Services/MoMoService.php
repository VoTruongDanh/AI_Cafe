<?php

namespace App\Services;

class MoMoService
{
    /**
     * Tạo URL mã QR MoMo
     *
     * @param string $orderCode Mã đơn hàng
     * @param float $amount Số tiền
     * @param string|null $description Mô tả thêm
     * @return string URL của mã QR
     */
    public static function generateQRUrl(string $orderCode, float $amount, ?string $description = null): string
    {
        $config = config('momo');

        if (!$config['enabled']) {
            return '';
        }

        $phoneNumber = $config['account']['phone_number'];
        $accountName = $config['account']['account_name'];

        // Tạo nội dung chuyển khoản
        $transferContent = str_replace('{order_code}', $orderCode, $config['transfer_content_template']);
        if ($description) {
            $transferContent .= ' ' . $description;
        }

        // Build MoMo Deep Link
        // Format: 2|99|{PHONE}|{NAME}|{EMAIL}|0|0|{AMOUNT}|{CONTENT}
        // Email có thể để trống, 0|0 là các tham số mặc định
        $momoData = "2|99|{$phoneNumber}|{$accountName}||0|0|" . (int)$amount . "|{$transferContent}";

        // Tạo QR code sử dụng API khác (ví dụ: api.qrserver.com)
        // Hoặc có thể dùng Google Charts API
        $qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/";
        $size = 300; // Fixed size
        $qrUrl = $qrApiUrl . "?size={$size}x{$size}&data=" . urlencode($momoData);

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
     * Tạo nội dung chuyển khoản từ mã đơn hàng
     *
     * @param string $orderCode
     * @return string
     */
    public static function generateTransferContent(string $orderCode): string
    {
        $template = config('momo.transfer_content_template');
        return str_replace('{order_code}', $orderCode, $template);
    }

    /**
     * Kiểm tra cấu hình MoMo
     *
     * @return bool
     */
    public static function isEnabled(): bool
    {
        return config('momo.enabled', false);
    }
}
