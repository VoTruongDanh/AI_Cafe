<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn đặt hàng - ElectroShop</title>
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
        .invoice-title {
            text-align: center;
            margin: 25px 0;
        }
        .invoice-title h2 {
            font-size: 20px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .invoice-title p {
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
        table td {
            vertical-align: top;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .summary-table {
            width: 50%;
            margin-left: auto;
            margin-top: 15px;
        }
        .summary-table td {
            border: none;
            padding: 5px 10px;
        }
        .summary-table .total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #000;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 13px;
            border-top: 1px solid #000;
            padding-top: 15px;
        }
        .signature {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            text-align: center;
        }
        .signature-box {
            width: 45%;
        }
        .signature-box p {
            margin-bottom: 60px;
            font-weight: bold;
        }
        .note {
            font-style: italic;
            margin-top: 20px;
            font-size: 13px;
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

        <!-- Invoice Title -->
        <div class="invoice-title">
            <h2>HÓA ĐƠN BÁN HÀNG</h2>
            <p>Mã đơn hàng: {{ $order->code }}</p>
            <p>Ngày: {{ $order_date }}</p>
        </div>

        <!-- Customer Info -->
        <div class="section">
            <div class="section-title">Thông tin khách hàng</div>
            <div class="info-row">
                <span class="info-label">Họ tên khách hàng:</span>
                <span>{{ $customer_name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Số điện thoại:</span>
                <span>{{ $customer_phone }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Địa chỉ giao hàng:</span>
                <span>{{ $shipping_address }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Phương thức thanh toán:</span>
                <span>{{ $payment_method }}</span>
            </div>
        </div>

        <!-- Products Table -->
        <div class="section">
            <div class="section-title">Chi tiết đơn hàng</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">STT</th>
                        <th style="width: 45%;">Tên sản phẩm</th>
                        <th style="width: 10%;">SL</th>
                        <th style="width: 20%;">Đơn giá</th>
                        <th style="width: 20%;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item->product->name ?? $item->product_name ?? 'Sản phẩm' }}</td>
                        <td class="text-center">{{ $item->quantity }}</td>
                        <td class="text-right">{{ number_format($item->unit_price ?? $item->price, 0, ',', '.') }}đ</td>
                        <td class="text-right">{{ number_format(($item->unit_price ?? $item->price) * $item->quantity, 0, ',', '.') }}đ</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <!-- Summary -->
            <table class="summary-table">
                <tr>
                    <td>Tạm tính:</td>
                    <td class="text-right">{{ number_format($subtotal, 0, ',', '.') }}đ</td>
                </tr>
                @if($discount > 0)
                <tr>
                    <td>Giảm giá:</td>
                    <td class="text-right">-{{ number_format($discount, 0, ',', '.') }}đ</td>
                </tr>
                @endif
                <tr>
                    <td>Thuế VAT (8%):</td>
                    <td class="text-right">{{ number_format($tax, 0, ',', '.') }}đ</td>
                </tr>
                <tr class="total">
                    <td><strong>TỔNG CỘNG:</strong></td>
                    <td class="text-right"><strong>{{ number_format($grand_total, 0, ',', '.') }}đ</strong></td>
                </tr>
                @if($is_paid)
                <tr>
                    <td colspan="2" style="text-align: center; padding-top: 15px;">
                        <span style="background-color: #4CAF50; color: white; padding: 8px 20px; font-weight: bold; border-radius: 4px;">
                            ✓ ĐÃ THANH TOÁN
                        </span>
                    </td>
                </tr>
                @elseif(isset($payment_method_code) && $payment_method_code == 'BANK_TRANSFER')
                <tr>
                    <td colspan="2" style="text-align: center; padding-top: 15px;">
                        <span style="background-color: #2196F3; color: white; padding: 8px 20px; font-weight: bold; border-radius: 4px;">
                            CHỜ XÁC NHẬN CHUYỂN KHOẢN
                        </span>
                    </td>
                </tr>
                @else
                <tr>
                    <td colspan="2" style="text-align: center; padding-top: 15px;">
                        <span style="background-color: #FF9800; color: white; padding: 8px 20px; font-weight: bold; border-radius: 4px;">
                            THANH TOÁN KHI NHẬN HÀNG
                        </span>
                    </td>
                </tr>
                @endif
            </table>
        </div>

        <!-- Note -->
        <div class="note">
            @if($is_paid)
                @if(isset($order_source) && $order_source == 'winform')
                <strong>Ghi chú:</strong> Đơn hàng đã được thanh toán thành công tại cửa hàng.
                Cảm ơn quý khách đã mua hàng!
                @else
                <strong>Ghi chú:</strong> Đơn hàng đã được thanh toán thành công.
                Đơn hàng sẽ được giao trong vòng 2-5 ngày làm việc.
                @endif
            @elseif(isset($payment_method_code) && $payment_method_code == 'BANK_TRANSFER')
            <strong>Ghi chú:</strong> Vui lòng chuyển khoản theo thông tin đã cung cấp.
            Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.
            @else
            <strong>Ghi chú:</strong> Đơn hàng sẽ được giao trong vòng 2-5 ngày làm việc.
            Quý khách vui lòng kiểm tra hàng trước khi thanh toán.
            @endif
        </div>

        <!-- Signature -->
        <div class="signature">
            <div class="signature-box">
                <p>Khách hàng</p>
                <span>(Ký, ghi rõ họ tên)</span>
            </div>
            <div class="signature-box">
                <p>Người bán hàng</p>
                <span>(Ký, ghi rõ họ tên)</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Cảm ơn Quý khách đã mua hàng tại ElectroShop!</p>
            <p>Mọi thắc mắc xin liên hệ: 0328316192 hoặc phamduy14032004@gmail.com</p>
        </div>
    </div>
</body>
</html>
