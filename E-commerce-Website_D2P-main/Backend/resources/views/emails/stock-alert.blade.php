@extends('emails.layout')

@section('title', 'Sản phẩm đã có hàng')

@section('content')
    <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{ $user->name }}! 🎉</h2>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
        Tin vui! Sản phẩm bạn quan tâm đã có hàng trở lại!
    </p>
    
    <div style="border: 2px solid #e63946; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%;">
            <tr>
                <td style="width: 120px; vertical-align: top;">
                    @if($product->image)
                    <img src="{{ $product->image }}" alt="{{ $product->name }}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                    @endif
                </td>
                <td style="vertical-align: top; padding-left: 15px;">
                    <h3 style="color: #333; margin: 0 0 10px 0;">{{ $product->name }}</h3>
                    <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">{{ $product->category->name ?? '' }}</p>
                    <div style="margin-top: 15px;">
                        @if($product->original_price && $product->original_price > $product->price)
                        <span style="text-decoration: line-through; color: #6c757d; font-size: 14px; margin-right: 10px;">
                            {{ number_format($product->original_price) }}đ
                        </span>
                        @endif
                        <span style="color: #e63946; font-size: 24px; font-weight: bold;">
                            {{ number_format($product->price) }}đ
                        </span>
                    </div>
                    @if($product->stock_quantity)
                    <p style="color: #28a745; font-weight: bold; margin-top: 10px;">
                        ✅ Còn {{ $product->stock_quantity }} sản phẩm
                    </p>
                    @endif
                </td>
            </tr>
        </table>
    </div>
    
    <div class="info-box" style="border-left-color: #ffc107; background-color: #fff3cd;">
        <p style="color: #856404; margin: 0;">
            <strong>⚡ Nhanh tay đặt hàng!</strong> Sản phẩm có thể hết hàng bất cứ lúc nào.
        </p>
    </div>
    
    @if($product->promotion)
    <div class="info-box" style="border-left-color: #e63946;">
        <p><strong>🎁 Khuyến mãi đặc biệt:</strong></p>
        <p>{{ $product->promotion->name }}</p>
    </div>
    @endif
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="{{ config('app.frontend_url') }}/products/{{ $product->id }}" class="button">
            Mua ngay
        </a>
    </div>
    
    <p style="margin-top: 30px; color: #6c757d; font-size: 14px; text-align: center;">
        Bạn nhận được email này vì đã đăng ký nhận thông báo khi sản phẩm có hàng trở lại.
    </p>
@endsection
