<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo hủy đơn hàng - ElectroShop</title>
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
            border: 1px solid #000;
            padding: 15px;
            margin: 15px 0;
            background-color: #f9f9f9;
        }
        .reason-box h4 {
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
            <h2>THÔNG BÁO HỦY ĐƠN HÀNG</h2>
            <p>Ngày: {{ $cancelled_date }}</p>
        </div>

        <!-- Greeting -->
        <div class="section">
            <p>Kính gửi: <strong>{{ $customer_name }}</strong>,</p>
            <p style="margin-top: 10px;">
                Chúng tôi xin thông báo rằng đơn hàng của Quý khách đã bị hủy. Chi tiết như sau:
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
                <span class="info-label">Tổng giá trị đơn hàng:</span>
                <span><strong>{{ number_format($grand_total, 0, ',', '.') }}đ</strong></span>
            </div>
        </div>

        <!-- Products Table -->
        <div class="section">
            <div class="section-title">Sản phẩm trong đơn hàng</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">STT</th>
                        <th style="width: 55%;">Tên sản phẩm</th>
                        <th style="width: 15%;">Số lượng</th>
                        <th style="width: 25%;">Đơn giá</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item->product->name ?? $item->product_name ?? 'Sản phẩm' }}</td>
                        <td class="text-center">{{ $item->quantity }}</td>
                        <td class="text-right">{{ number_format($item->unit_price ?? $item->price, 0, ',', '.') }}đ</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Reason -->
        <div class="section">
            <div class="reason-box">
                <h4>Lý do hủy đơn hàng:</h4>
                <p>{{ $reason }}</p>
            </div>
        </div>

        <!-- Refund Info (if applicable) -->
        <div class="section">
            <div class="note">
                <strong>Lưu ý:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>Nếu Quý khách đã thanh toán trước, số tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.</li>
                    <li>Nếu có thắc mắc, vui lòng liên hệ với chúng tôi qua thông tin bên dưới.</li>
                </ul>
            </div>
        </div>

        <!-- Contact -->
        <div class="contact-info">
            <h4>Liên hệ hỗ trợ:</h4>
            <p>- Hotline: 0328316192</p>
            <p>- Email: phamduy14032004@gmail.com</p>
            <p>- Thời gian làm việc: 8:00 - 22:00 (Tất cả các ngày trong tuần)</p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Chúng tôi xin chân thành cáo lỗi vì sự bất tiện này.</p>
            <p>Trân trọng,</p>
            <p style="margin-top: 10px;"><strong>ELECTROSHOP</strong></p>
        </div>
    </div>
</body>
</html>
