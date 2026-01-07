<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #d32f2f;
        }
        .content {
            background-color: white;
            padding: 25px;
            border-radius: 5px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #d32f2f;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #b71c1c;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚡ ElectroShop</div>
        </div>

        <div class="content">
            <h2>Yêu cầu đặt lại mật khẩu</h2>

            <p>Xin chào{{ isset($user->name) ? ' ' . $user->name : '' }},</p>

            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại ElectroShop.</p>

            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>

            <div style="text-align: center;">
                <a href="{{ $resetUrl }}" class="button">Đặt lại mật khẩu</a>
            </div>

            <p>Hoặc sao chép và dán link sau vào trình duyệt:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">
                {{ $resetUrl }}
            </p>

            <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Link này có hiệu lực trong <strong>1 giờ</strong></li>
                    <li>Chỉ sử dụng được <strong>một lần</strong></li>
                    <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                    <li>Không chia sẻ link này với bất kỳ ai</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; {{ date('Y') }} ElectroShop. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
