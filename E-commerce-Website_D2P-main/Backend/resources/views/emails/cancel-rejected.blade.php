<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yêu cầu hủy đơn hàng bị từ chối - ElectroShop</title>
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
            color: #e67e22;
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
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table th, table td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
        }
        table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .reason-box {
            border: 2px solid #e67e22;
            padding: 15px;
            margin: 15px 0;
            background-color: #fff5eb;
        }
        .reason-box h4 {
            margin-bottom: 10px;
            font-weight: bold;
            color: #e67e22;
        }
        .info-box {
            border: 1px solid #3498db;
            padding: 15px;
            margin: 15px 0;
            background-color: #ebf5fb;
        }
        .info-box h4 {
            margin-bottom: 10px;
            font-weight: bold;
            color: #2980b9;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 13px;
            border-top: 1px solid #000;
            padding-top: 15px;
        }
        .note {
            font-style: italic;
            margin-top: 20px;
            font-size: 13px;
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
            <h2>YÊU CẦU HỦY ĐƠN ĐÃ BỊ TỪ CHỐI</h2>
            <p>Ngày: {{ now()->format('d/m/Y H:i') }}</p>
        </div>

        <!-- Greeting -->
        <div class="section">
            <p>Kính gửi: <strong>{{ $customer_name }}</strong>,</p>
            <p style="margin-top: 10px;">
                Chúng tôi xin thông báo rằng yêu cầu hủy đơn hàng của Quý khách <strong>đã bị từ chối</strong>. Đơn hàng sẽ tiếp tục được xử lý như bình thường.
            </p>
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
                <span>{{ $order_date }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phương thức thanh toán:</span>
                <span>{{ $payment_method }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Số điện thoại:</span>
                <span>{{ $customer_phone }}</span>
            </div>
        </div>

        <!-- Reason Box -->
        <div class="reason-box">
            <h4>📋 LÝ DO TỪ CHỐI HỦY ĐƠN:</h4>
            <p>{{ $reject_reason }}</p>
        </div>

        <!-- Info Box -->
        <div class="info-box">
            <h4>📌 ĐƠN HÀNG SẼ TIẾP TỤC ĐƯỢC XỬ LÝ:</h4>
            <p>Đơn hàng của bạn sẽ được tiếp tục xử lý và giao đến địa chỉ đã đăng ký. Vui lòng chuẩn bị nhận hàng.</p>
            <p style="margin-top: 10px;">Nếu bạn có thắc mắc, xin vui lòng liên hệ với chúng tôi qua Hotline hoặc Email bên dưới.</p>
        </div>

        <!-- Order Details -->
        <div class="section">
            <div class="section-title">Chi tiết sản phẩm</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">STT</th>
                        <th>Sản phẩm</th>
                        <th style="width: 80px;">SL</th>
                        <th style="width: 120px;">Đơn giá</th>
                        <th style="width: 130px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item->product->name ?? 'Sản phẩm' }}</td>
                        <td class="text-center">{{ $item->quantity }}</td>
                        <td class="text-right">{{ number_format($item->price, 0, ',', '.') }}đ</td>
                        <td class="text-right">{{ number_format($item->price * $item->quantity, 0, ',', '.') }}đ</td>
                    </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="text-right"><strong>TỔNG CỘNG:</strong></td>
                        <td class="text-right"><strong>{{ number_format($grand_total, 0, ',', '.') }}đ</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- Contact Info -->
        <div class="contact-info">
            <h4>📞 Liên hệ hỗ trợ:</h4>
            <p>- Hotline: 0328316192 (8:00 - 21:00 hàng ngày)</p>
            <p>- Email: phamduy14032004@gmail.com</p>
            <p>- Website: electroshop.vn</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Cảm ơn Quý khách đã tin tưởng và sử dụng dịch vụ của ElectroShop!</p>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
                Đây là email tự động, vui lòng không trả lời trực tiếp email này.
            </p>
        </div>
    </div>
</body>
</html>
