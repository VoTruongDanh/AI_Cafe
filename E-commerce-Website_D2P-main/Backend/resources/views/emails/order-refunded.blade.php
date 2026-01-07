<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận hoàn tiền đơn hàng - ElectroShop</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #000;
            background-color: #fff;
            font-size: 14px;
        }
        .container {
            max-width: 700px;
            margin: 20px auto;
            background-color: #fff;
            padding: 30px;
            border: 1px solid #000;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 22px;
            text-transform: uppercase;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .header p {
            font-size: 13px;
        }
        .notice-title {
            text-align: center;
            margin: 25px 0;
        }
        .notice-title h2 {
            font-size: 20px;
            text-transform: uppercase;
            font-weight: bold;
            color: #2e7d32;
        }
        .notice-title p {
            font-size: 13px;
            font-style: italic;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
        }
        .info-row {
            margin-bottom: 8px;
        }
        .info-row span {
            display: inline-block;
        }
        .info-label {
            width: 180px;
        }
        .success-box {
            border: 2px solid #2e7d32;
            padding: 20px;
            margin: 20px 0;
            background-color: #e8f5e9;
            text-align: center;
        }
        .success-box h3 {
            color: #2e7d32;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .success-box .amount {
            font-size: 24px;
            font-weight: bold;
            color: #1b5e20;
            margin: 10px 0;
        }
        .refund-note {
            border: 1px solid #000;
            padding: 15px;
            margin: 15px 0;
            background-color: #f9f9f9;
        }
        .refund-note h4 {
            margin-bottom: 10px;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 13px;
            border-top: 1px solid #000;
            padding-top: 15px;
        }
        .contact-info {
            margin-top: 20px;
            padding: 15px;
            border: 1px dashed #000;
        }
        .contact-info h4 {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>ELECTROSHOP</h1>
            <p>Địa chỉ: 568 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh</p>
            <p>Hotline: 0328316192 | Email: phamduy14032004@gmail.com</p>
        </div>

        <!-- Notice Title -->
        <div class="notice-title">
            <h2>✓ XÁC NHẬN HOÀN TIỀN THÀNH CÔNG</h2>
            <p>Ngày: {{ $order->refunded_at ? $order->refunded_at->format('d/m/Y H:i') : now()->format('d/m/Y H:i') }}</p>
        </div>

        <!-- Greeting -->
        <div class="section">
            <p>Kính gửi: <strong>{{ $order->receiver_name }}</strong>,</p>
            <p style="margin-top: 10px;">
                Chúng tôi xin thông báo rằng yêu cầu hoàn tiền cho đơn hàng của Quý khách đã được xử lý thành công.
            </p>
        </div>

        <!-- Success Box -->
        <div class="success-box">
            <h3>✓ HOÀN TIỀN THÀNH CÔNG</h3>
            <p>Mã đơn hàng: <strong>{{ $order->code }}</strong></p>
            <p class="amount">{{ number_format($order->grand_total, 0, ',', '.') }} VNĐ</p>
            <p>Số tiền đã được hoàn vào tài khoản của Quý khách</p>
        </div>

        <!-- Order Info -->
        <div class="section">
            <div class="section-title">Thông tin đơn hàng</div>
            <div class="info-row">
                <span class="info-label">Mã đơn hàng:</span>
                <span><strong>{{ $order->code }}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Ngày đặt hàng:</span>
                <span>{{ $order->created_at->format('d/m/Y H:i') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ngày hủy đơn:</span>
                <span>{{ $order->cancelled_at ? $order->cancelled_at->format('d/m/Y H:i') : 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Lý do hủy:</span>
                <span>{{ $order->cancel_reason ?: 'Không có lý do cụ thể' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phương thức thanh toán:</span>
                <span>{{ $order->paymentMethod->name ?? 'N/A' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Số tiền hoàn:</span>
                <span><strong>{{ number_format($order->grand_total, 0, ',', '.') }} VNĐ</strong></span>
            </div>
        </div>

        @if($refundNote)
        <!-- Refund Note -->
        <div class="refund-note">
            <h4>📝 Ghi chú từ ElectroShop:</h4>
            <p>{{ $refundNote }}</p>
        </div>
        @endif

        <!-- Note -->
        <div class="section">
            <p><strong>Lưu ý:</strong></p>
            <ul style="margin-left: 20px; margin-top: 10px;">
                <li>Tiền hoàn thường mất từ 1-3 ngày làm việc để hiển thị trong tài khoản của bạn, tùy thuộc vào ngân hàng.</li>
                <li>Nếu sau 5 ngày làm việc mà Quý khách chưa nhận được tiền, vui lòng liên hệ với chúng tôi.</li>
                <li>Quý khách có thể kiểm tra lịch sử giao dịch tại ngân hàng hoặc ví điện tử của mình.</li>
            </ul>
        </div>

        <!-- Contact Info -->
        <div class="contact-info">
            <h4>Cần hỗ trợ? Liên hệ ngay:</h4>
            <p>📞 Hotline: 0328316192</p>
            <p>📧 Email: phamduy14032004@gmail.com</p>
            <p>🏠 Địa chỉ: 568 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ của ElectroShop!</p>
            <p>Chúng tôi rất mong được phục vụ Quý khách trong tương lai.</p>
            <p style="margin-top: 10px;"><em>ElectroShop - Điện tử chính hãng, giá tốt nhất!</em></p>
        </div>
    </div>
</body>
</html>
