<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận thanh toán bị từ chối - ElectroShop</title>
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
            color: #c0392b;
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
            border: 2px solid #c0392b;
            padding: 15px;
            margin: 15px 0;
            background-color: #fdedec;
        }
        .reason-box h4 {
            margin-bottom: 10px;
            font-weight: bold;
            color: #c0392b;
        }
        .action-box {
            border: 2px solid #27ae60;
            padding: 15px;
            margin: 15px 0;
            background-color: #e8f8f5;
        }
        .action-box h4 {
            margin-bottom: 10px;
            font-weight: bold;
            color: #1e8449;
        }
        .action-box ul {
            margin-left: 20px;
        }
        .action-box li {
            margin-bottom: 5px;
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
        .bank-info {
            background-color: #f9f9f9;
            padding: 15px;
            border: 1px solid #000;
            margin: 15px 0;
        }
        .bank-info h4 {
            margin-bottom: 10px;
            font-weight: bold;
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
            <h2>XÁC NHẬN THANH TOÁN BỊ TỪ CHỐI</h2>
            <p>Ngày: {{ $reject_date }}</p>
        </div>

        <!-- Greeting -->
        <div class="section">
            <p>Kính gửi: <strong>{{ $customer_name }}</strong>,</p>
            <p style="margin-top: 10px;">
                Chúng tôi xin thông báo rằng xác nhận thanh toán cho đơn hàng của Quý khách <strong>không thể được xác minh</strong>. Vui lòng kiểm tra lại thông tin thanh toán.
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
                <span class="info-label">Số tiền cần thanh toán:</span>
                <span><strong>{{ number_format($grand_total, 0, ',', '.') }}đ</strong></span>
            </div>
        </div>

        <!-- Reason Box -->
        <div class="reason-box">
            <h4>⚠️ LÝ DO TỪ CHỐI:</h4>
            <p>{{ $reject_reason }}</p>
        </div>

        <!-- Action Box -->
        <div class="action-box">
            <h4>✅ BẠN CẦN LÀM GÌ TIẾP THEO?</h4>
            <ul>
                <li>Kiểm tra lại giao dịch chuyển khoản của bạn</li>
                <li>Đảm bảo số tiền chuyển khớp với tổng đơn hàng: <strong>{{ number_format($grand_total, 0, ',', '.') }}đ</strong></li>
                <li>Đảm bảo nội dung chuyển khoản đúng: <strong>{{ $order->transfer_content ?? $order->code }}</strong></li>
                <li>Sau khi chuyển khoản thành công, bấm lại nút "Tôi đã thanh toán" trên trang đơn hàng</li>
                <li>Nếu bạn đã chuyển khoản đúng, vui lòng liên hệ với chúng tôi kèm hình ảnh biên lai</li>
            </ul>
        </div>

        <!-- Bank Info -->
        <div class="bank-info">
            <h4>🏦 THÔNG TIN CHUYỂN KHOẢN:</h4>
            <p><strong>Ngân hàng:</strong> MB Bank</p>
            <p><strong>Số tài khoản:</strong> 0328316192</p>
            <p><strong>Chủ tài khoản:</strong> PHAM DUY</p>
            <p><strong>Nội dung chuyển khoản:</strong> {{ $order->transfer_content ?? $order->code }}</p>
            <p><strong>Số tiền:</strong> {{ number_format($grand_total, 0, ',', '.') }}đ</p>
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
