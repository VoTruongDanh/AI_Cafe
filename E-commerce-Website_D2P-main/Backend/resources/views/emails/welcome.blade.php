@extends('emails.layout')

@section('title', 'Chào mừng bạn')

@section('content')
    <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{ $user->name }}! 👋</h2>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
        Chào mừng bạn đến với <strong>{{ config('app.name') }}</strong> - Nơi mua sắm điện máy, điện tử uy tín hàng đầu!
    </p>
    
    <div class="info-box" style="border-left-color: #28a745;">
        <p><strong>✅ Tài khoản của bạn đã được tạo thành công!</strong></p>
        <p>Email: {{ $user->email }}</p>
    </div>
    
    <h3 style="color: #333; margin: 25px 0 15px;">🎁 Ưu đãi dành cho bạn</h3>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center; margin: 20px 0;">
        <h2 style="color: white; margin-bottom: 10px;">GIẢM 10%</h2>
        <p style="font-size: 18px; margin-bottom: 15px;">Cho đơn hàng đầu tiên</p>
        <div style="background: white; color: #333; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 20px;">
            WELCOME10
        </div>
        <p style="font-size: 12px; margin-top: 10px; opacity: 0.9;">Áp dụng cho đơn hàng từ 500.000đ</p>
    </div>
    
    <h3 style="color: #333; margin: 25px 0 15px;">🌟 Tại sao chọn chúng tôi?</h3>
    
    <table style="width: 100%; margin: 20px 0;">
        <tr>
            <td style="padding: 15px; vertical-align: top;">
                <div style="font-size: 30px; margin-bottom: 10px;">🚚</div>
                <strong>Giao hàng nhanh 2h</strong>
                <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">Nội thành TP.HCM</p>
            </td>
            <td style="padding: 15px; vertical-align: top;">
                <div style="font-size: 30px; margin-bottom: 10px;">🛡️</div>
                <strong>Bảo hành chính hãng</strong>
                <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">Hỗ trợ 24/7</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 15px; vertical-align: top;">
                <div style="font-size: 30px; margin-bottom: 10px;">💰</div>
                <strong>Giá tốt nhất</strong>
                <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">Hoàn tiền nếu rẻ hơn</p>
            </td>
            <td style="padding: 15px; vertical-align: top;">
                <div style="font-size: 30px; margin-bottom: 10px;">🎁</div>
                <strong>Ưu đãi độc quyền</strong>
                <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">Dành cho thành viên</p>
            </td>
        </tr>
    </table>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{ config('app.frontend_url') }}" class="button">
            Khám phá ngay
        </a>
    </div>
    
    <p style="margin-top: 30px; color: #6c757d; font-size: 14px; text-align: center;">
        Cảm ơn bạn đã tin tưởng {{ config('app.name') }}! ❤️
    </p>
@endsection
