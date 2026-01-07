<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận thanh toán - ElectroShop</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header .icon {
            font-size: 50px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .success-box {
            background-color: #e8f5e9;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 25px;
        }
        .success-box h2 {
            color: #4CAF50;
            margin: 0 0 10px 0;
            font-size: 20px;
        }
        .order-info {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .order-info h3 {
            margin: 0 0 15px 0;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #666;
        }
        .info-value {
            font-weight: bold;
            color: #333;
        }
        .total-amount {
            font-size: 24px;
            color: #4CAF50;
        }
        .next-steps {
            background-color: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .next-steps h3 {
            margin: 0 0 15px 0;
            color: #1976D2;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin-bottom: 8px;
        }
        .footer {
            background-color: #f5f5f5;
            text-align: center;
            padding: 20px;
            font-size: 13px;
            color: #666;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="icon">✓</div>
            <h1>THANH TOÁN THÀNH CÔNG</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Xin chào <strong>{{ $customer_name }}</strong>,</p>
            
            <div class="success-box">
                <h2>🎉 Chúng tôi đã nhận được thanh toán của bạn!</h2>
                <p style="margin: 0; color: #666;">Đơn hàng của bạn đang được xử lý và sẽ sớm được giao.</p>
            </div>

            <!-- Order Info -->
            <div class="order-info">
                <h3>📋 Thông tin đơn hàng</h3>
                <div class="info-row">
                    <span class="info-label">Mã đơn hàng:</span>
                    <span class="info-value">{{ $order_code }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phương thức thanh toán:</span>
                    <span class="info-value">{{ $payment_method }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Thời gian xác nhận:</span>
                    <span class="info-value">{{ $confirmed_at }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tổng thanh toán:</span>
                    <span class="info-value total-amount">{{ number_format($grand_total, 0, ',', '.') }}đ</span>
                </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
                <h3>📦 Các bước tiếp theo</h3>
                <ul>
                    <li>Đơn hàng của bạn sẽ được đóng gói và giao cho đơn vị vận chuyển</li>
                    <li>Bạn sẽ nhận được thông báo khi đơn hàng được giao</li>
                    <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc</li>
                </ul>
            </div>

            <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua:</p>
            <p>
                📞 Hotline: <strong>0328316192</strong><br>
                📧 Email: <strong>phamduy14032004@gmail.com</strong>
            </p>

            <p>Cảm ơn bạn đã tin tưởng và mua sắm tại ElectroShop!</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>ELECTROSHOP</strong></p>
            <p>568 Lê Trọng Tấn, Phường Tây Thạnh, TP. Hồ Chí Minh</p>
            <p>© {{ date('Y') }} ElectroShop. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
