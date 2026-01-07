<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Liên hệ mới</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #e63946 0%, #d62839 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .info-row {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
        .label {
            font-weight: bold;
            color: #e63946;
            margin-bottom: 5px;
        }
        .value {
            color: #333;
        }
        .message-box {
            background: white;
            padding: 20px;
            border-left: 4px solid #e63946;
            border-radius: 4px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">📧 Liên hệ mới từ khách hàng</h1>
    </div>
    
    <div class="content">
        <p>Bạn có một liên hệ mới từ website ElectroShop:</p>
        
        <div class="info-row">
            <div class="label">👤 Họ tên:</div>
            <div class="value">{{ $contact->name }}</div>
        </div>
        
        <div class="info-row">
            <div class="label">📧 Email:</div>
            <div class="value"><a href="mailto:{{ $contact->email }}">{{ $contact->email }}</a></div>
        </div>
        
        @if($contact->phone)
        <div class="info-row">
            <div class="label">📞 Số điện thoại:</div>
            <div class="value"><a href="tel:{{ $contact->phone }}">{{ $contact->phone }}</a></div>
        </div>
        @endif
        
        <div class="info-row">
            <div class="label">📋 Chủ đề:</div>
            <div class="value">{{ $contact->subject }}</div>
        </div>
        
        <div class="message-box">
            <div class="label">💬 Nội dung:</div>
            <div class="value" style="white-space: pre-wrap;">{{ $contact->message }}</div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
            <strong>⏰ Thời gian:</strong> {{ $contact->created_at->format('d/m/Y H:i:s') }}<br>
            <strong>🌐 IP:</strong> {{ $contact->ip_address ?? 'N/A' }}
        </div>
    </div>
    
    <div class="footer">
        <p>Email này được gửi tự động từ hệ thống ElectroShop</p>
        <p>Vui lòng trả lời trực tiếp email của khách hàng: {{ $contact->email }}</p>
    </div>
</body>
</html>
