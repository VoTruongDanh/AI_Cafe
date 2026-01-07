<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VNPay Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | Cấu hình thanh toán VNPay với webhook tự động xác nhận
    |
    | Để sử dụng:
    | 1. Đăng ký tài khoản merchant tại: https://sandbox.vnpayment.vn/merchantv2/
    | 2. Lấy TMN Code và Secret Key từ dashboard
    | 3. Cập nhật file .env với các thông tin trên
    |
    | Tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
    |
    */

    'enabled' => env('VNPAY_ENABLED', true),

    // VNPay Merchant Credentials (Sandbox từ VNPay)
    'tmn_code' => env('VNPAY_TMN_CODE', '1ILAH3B1'), // Mã website tại VNPay
    'hash_secret' => env('VNPAY_HASH_SECRET', '10I2CTDUM0A63QP9UFU9MA6DUIEK3I74'), // Chuỗi bí mật

    // Môi trường: sandbox (test) hoặc production (thật)
    'environment' => env('VNPAY_ENVIRONMENT', 'sandbox'),

    // API Endpoints
    'endpoints' => [
        'sandbox' => 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        'production' => 'https://pay.vnpay.vn/vpcpay.html',
    ],

    // URL callback sau khi thanh toán (redirect về frontend)
    'return_url' => env('VNPAY_RETURN_URL', 'http://localhost:5173/payment/vnpay/return'),

    // URL nhận webhook từ VNPay (IPN - Instant Payment Notification)
    'ipn_url' => env('VNPAY_IPN_URL', 'http://localhost:8000/api/payments/vnpay/webhook'),

    // Phiên bản API
    'version' => '2.1.0',

    // Lệnh thanh toán
    'command' => 'pay',

    // Loại tiền tệ (VND)
    'currency' => 'VND',

    // Ngôn ngữ (vn hoặc en)
    'locale' => 'vn',

    // Loại đơn hàng
    // billpayment: Thanh toán hóa đơn
    // fashion: Thời trang
    // other: Khác
    'order_type' => 'other',

    // Thời gian hết hạn giao dịch (phút) - 5 phút, 15 phút, 30 phút
    'expiry_minutes' => env('VNPAY_EXPIRY_MINUTES', 15),

    // Mã ngân hàng mặc định (để trống = hiển thị tất cả)
    // NCB, VIETCOMBANK, VIETINBANK, BIDV, AGRIBANK, SACOMBANK, TECHCOMBANK, etc.
    'bank_code' => env('VNPAY_BANK_CODE', ''),
];
