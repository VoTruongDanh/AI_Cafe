<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title')</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, #e63946 0%, #ff6b6b 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .email-header h1 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .email-header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .email-body {
            padding: 30px 20px;
        }
        
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #e63946;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        
        .button:hover {
            background-color: #d62839;
        }
        
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #e63946;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .order-details {
            margin: 20px 0;
        }
        
        .order-details table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .order-details th,
        .order-details td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        .order-details th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        .total-row {
            font-weight: bold;
            font-size: 16px;
            color: #e63946;
        }
        
        .social-links {
            margin: 15px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #6c757d;
            text-decoration: none;
        }
        
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 20px 15px;
            }
            
            .email-header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>{{ config('app.name', 'TechStore') }}</h1>
            <p>Điện máy - Điện tử - Công nghệ</p>
        </div>
        
        <div class="email-body">
            @yield('content')
        </div>
        
        <div class="email-footer">
            <p><strong>{{ config('app.name') }}</strong></p>
            <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
            <p>Hotline: 1900 1599 | Email: support@techstore.vn</p>
            
            <div class="social-links">
                <a href="#">Facebook</a> |
                <a href="#">Instagram</a> |
                <a href="#">YouTube</a>
            </div>
            
            <p style="margin-top: 15px; font-size: 11px;">
                Email này được gửi tự động, vui lòng không trả lời.<br>
                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
