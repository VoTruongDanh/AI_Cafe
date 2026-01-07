@extends('emails.layout')

@section('title', 'Cập nhật đơn hàng')

@section('content')
    <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{ $customer->name }}!</h2>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
        Đơn hàng <strong>#{{ $order->order_number }}</strong> của bạn đã được cập nhật trạng thái.
    </p>
    
    <div class="info-box">
        <p><strong>Trạng thái cũ:</strong> <span style="color: #6c757d;">{{ $oldStatus }}</span></p>
        <p><strong>Trạng thái mới:</strong> <span style="color: #e63946; font-weight: bold;">{{ $newStatus }}</span></p>
    </div>
    
    @if($newStatus === 'processing')
    <div class="info-box" style="border-left-color: #17a2b8;">
        <p><strong>✅ Đơn hàng đang được xử lý</strong></p>
        <p>Chúng tôi đang chuẩn bị sản phẩm cho bạn. Đơn hàng sẽ sớm được giao cho đơn vị vận chuyển.</p>
    </div>
    @elseif($newStatus === 'shipping')
    <div class="info-box" style="border-left-color: #ffc107;">
        <p><strong>🚚 Đơn hàng đang được giao</strong></p>
        <p>Đơn hàng của bạn đang trên đường giao đến. Vui lòng chú ý điện thoại để nhận hàng.</p>
        @if($order->tracking_number)
        <p><strong>Mã vận đơn:</strong> {{ $order->tracking_number }}</p>
        @endif
    </div>
    @elseif($newStatus === 'delivered')
    <div class="info-box" style="border-left-color: #28a745;">
        <p><strong>✅ Đơn hàng đã giao thành công</strong></p>
        <p>Cảm ơn bạn đã mua hàng! Nếu có bất kỳ vấn đề gì, vui lòng liên hệ với chúng tôi.</p>
    </div>
    @elseif($newStatus === 'cancelled')
    <div class="info-box" style="border-left-color: #dc3545;">
        <p><strong>❌ Đơn hàng đã bị hủy</strong></p>
        <p>Đơn hàng của bạn đã được hủy. Nếu bạn đã thanh toán, số tiền sẽ được hoàn lại trong 3-5 ngày làm việc.</p>
    </div>
    @endif
    
    <h3 style="color: #333; margin: 25px 0 15px;">Thông tin đơn hàng</h3>
    
    <div class="info-box">
        <p><strong>Mã đơn hàng:</strong> #{{ $order->order_number }}</p>
        <p><strong>Ngày đặt:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
        <p><strong>Tổng tiền:</strong> <span style="color: #e63946; font-weight: bold;">{{ number_format($order->total_amount) }}đ</span></p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{ config('app.frontend_url') }}/orders/{{ $order->id }}" class="button">
            Xem chi tiết đơn hàng
        </a>
    </div>
    
    <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua hotline 
        <strong style="color: #e63946;">1900 1599</strong>
    </p>
@endsection
