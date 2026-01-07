@extends('emails.layout')

@section('title', 'Xác nhận đơn hàng')

@section('content')
    <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{ $customer->name }}!</h2>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
        Cảm ơn bạn đã đặt hàng tại <strong>{{ config('app.name') }}</strong>. 
        Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
    </p>
    
    <div class="info-box">
        <p><strong>Mã đơn hàng:</strong> #{{ $order->order_number }}</p>
        <p><strong>Ngày đặt:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
        <p><strong>Trạng thái:</strong> <span style="color: #e63946;">{{ $order->status_text }}</span></p>
        <p><strong>Phương thức thanh toán:</strong> {{ $order->payment_method_name }}</p>
    </div>
    
    <h3 style="color: #333; margin: 25px 0 15px;">Chi tiết đơn hàng</h3>
    
    <div class="order-details">
        <table>
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th style="text-align: center;">SL</th>
                    <th style="text-align: right;">Đơn giá</th>
                    <th style="text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td style="text-align: center;">{{ $item->quantity }}</td>
                    <td style="text-align: right;">{{ number_format($item->price) }}đ</td>
                    <td style="text-align: right;">{{ number_format($item->price * $item->quantity) }}đ</td>
                </tr>
                @endforeach
                
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Tạm tính:</strong></td>
                    <td style="text-align: right;">{{ number_format($order->subtotal) }}đ</td>
                </tr>
                
                @if($order->discount_amount > 0)
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Giảm giá:</strong></td>
                    <td style="text-align: right; color: #28a745;">-{{ number_format($order->discount_amount) }}đ</td>
                </tr>
                @endif
                
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Phí vận chuyển:</strong></td>
                    <td style="text-align: right;">{{ number_format($order->shipping_fee) }}đ</td>
                </tr>
                
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">TỔNG CỘNG:</td>
                    <td style="text-align: right;">{{ number_format($order->total_amount) }}đ</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <h3 style="color: #333; margin: 25px 0 15px;">Thông tin giao hàng</h3>
    
    <div class="info-box">
        <p><strong>Người nhận:</strong> {{ $order->shipping_name }}</p>
        <p><strong>Số điện thoại:</strong> {{ $order->shipping_phone }}</p>
        <p><strong>Địa chỉ:</strong> {{ $order->shipping_address }}</p>
    </div>
    
    @if($order->notes)
    <div class="info-box" style="border-left-color: #ffc107;">
        <p><strong>Ghi chú:</strong></p>
        <p>{{ $order->notes }}</p>
    </div>
    @endif
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{ config('app.frontend_url') }}/orders/{{ $order->id }}" class="button">
            Xem chi tiết đơn hàng
        </a>
    </div>
    
    <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua hotline 
        <strong style="color: #e63946;">1900 1599</strong> hoặc email 
        <strong style="color: #e63946;">support@techstore.vn</strong>
    </p>
    
    <p style="margin-top: 15px; color: #6c757d; font-size: 14px;">
        Cảm ơn bạn đã tin tưởng và lựa chọn {{ config('app.name') }}! ❤️
    </p>
@endsection
