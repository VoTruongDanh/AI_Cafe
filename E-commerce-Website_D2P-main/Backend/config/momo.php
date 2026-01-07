<?php

return [
    /*
    |--------------------------------------------------------------------------
    | MoMo Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | Cấu hình thanh toán MoMo với webhook tự động xác nhận
    |
    | Để sử dụng:
    | 1. Đăng ký tài khoản tại: https://business.momo.vn
    | 2. Lấy partnerCode, accessKey, secretKey từ dashboard
    | 3. Cập nhật file .env với các thông tin trên
    |
    */

    'enabled' => env('MOMO_ENABLED', true),

    // MoMo API Credentials (từ MoMo Business Dashboard)
    'partner_code' => env('MOMO_PARTNER_CODE', 'MOMO'),
    'access_key' => env('MOMO_ACCESS_KEY', ''),
    'secret_key' => env('MOMO_SECRET_KEY', ''),

    // Môi trường: sandbox (test) hoặc production (thật)
    'environment' => env('MOMO_ENVIRONMENT', 'sandbox'),

    // API Endpoints
    'endpoints' => [
        'sandbox' => 'https://test-payment.momo.vn/v2/gateway/api',
        'production' => 'https://payment.momo.vn/v2/gateway/api',
    ],

    // URL callback sau khi thanh toán
    'redirect_url' => env('MOMO_REDIRECT_URL', 'http://localhost:3000/payment/momo/return'),

    // URL nhận webhook từ MoMo (IPN - Instant Payment Notification)
    'ipn_url' => env('MOMO_IPN_URL', 'http://localhost:8000/api/payments/momo/webhook'),

    // Loại thanh toán
    // captureWallet: Quét QR bằng app MoMo
    // payWithATM: Thanh toán qua ATM
    // payWithCC: Thanh toán qua thẻ quốc tế
    'request_type' => env('MOMO_REQUEST_TYPE', 'captureWallet'),

    // Thời gian hết hạn giao dịch (phút)
    'expiry_minutes' => env('MOMO_EXPIRY_MINUTES', 15),

    // Thông tin tài khoản MoMo nhận tiền (fallback khi không dùng API)
    'account' => [
        'phone_number' => env('MOMO_PHONE_NUMBER', '0909123456'),
        'account_name' => env('MOMO_ACCOUNT_NAME', 'NGUYEN VAN A'),
    ],

    // Mẫu nội dung chuyển khoản
    'transfer_content_template' => env('MOMO_TRANSFER_CONTENT_TEMPLATE', '{order_code}'),
];
