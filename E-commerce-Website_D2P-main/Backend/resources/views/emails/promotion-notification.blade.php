@extends('emails.layout')

@section('title', 'Khuyến mãi mới')

@section('content')
    <h2 style="color: #333; margin-bottom: 20px;">
        @if($user)
            Xin chào {{ $user->name }}! 🎉
        @else
            Khuyến mãi đặc biệt! 🎉
        @endif
    </h2>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
        Chúng tôi có một chương trình khuyến mãi tuyệt vời dành cho bạn!
    </p>
    
    <div style="background: linear-gradient(135deg, #e63946 0%, #ff6b6b 100%); padding: 30px; border-radius: 8px; color: white; text-align: center; margin: 20px 0;">
        <h1 style="color: white; margin-bottom: 15px; font-size: 32px;">{{ $promotion->name }}</h1>
        
        @if($promotion->description)
        <p style="font-size: 16px; margin-bottom: 20px; opacity: 0.95;">
            {{ $promotion->description }}
        </p>
        @endif
        
        @if($promotion->discount_type === 'percentage')
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 48px; font-weight: bold; margin-bottom: 5px;">
                {{ $promotion->discount_value }}%
            </div>
            <div style="font-size: 18px;">GIẢM GIÁ</div>
        </div>
        @elseif($promotion->discount_type === 'fixed')
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">
                {{ number_format($promotion->discount_value) }}đ
            </div>
            <div style="font-size: 18px;">GIẢM NGAY</div>
        </div>
        @endif
        
        @if($promotion->code)
        <div style="margin: 25px 0;">
            <p style="font-size: 14px; margin-bottom: 10px; opacity: 0.9;">Mã khuyến mãi:</p>
            <div style="background: white; color: #e63946; padding: 15px 30px; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 24px; letter-spacing: 2px;">
                {{ $promotion->code }}
            </div>
        </div>
        @endif
        
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
            <p style="font-size: 14px; opacity: 0.9;">
                ⏰ Có hiệu lực từ {{ $promotion->start_date->format('d/m/Y') }} 
                đến {{ $promotion->end_date->format('d/m/Y') }}
            </p>
        </div>
    </div>
    
    @if($promotion->min_order_amount)
    <div class="info-box" style="border-left-color: #ffc107;">
        <p><strong>📋 Điều kiện áp dụng:</strong></p>
        <p>Đơn hàng tối thiểu: <strong>{{ number_format($promotion->min_order_amount) }}đ</strong></p>
    </div>
    @endif
    
    @if($promotion->max_discount_amount)
    <div class="info-box">
        <p><strong>💡 Lưu ý:</strong></p>
        <p>Giảm tối đa: <strong>{{ number_format($promotion->max_discount_amount) }}đ</strong></p>
    </div>
    @endif
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{ config('app.frontend_url') }}/promotions/{{ $promotion->id }}" class="button">
            Mua ngay
        </a>
    </div>
    
    <p style="margin-top: 30px; color: #6c757d; font-size: 14px; text-align: center;">
        Nhanh tay kẻo hết! Số lượng có hạn! 🔥
    </p>
@endsection
