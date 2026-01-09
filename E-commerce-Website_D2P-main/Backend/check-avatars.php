<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "📋 Kiểm tra users với avatar:\n\n";

$users = User::whereNotNull('avatar')
    ->where('avatar', '!=', '')
    ->where('role', 'customer')
    ->get(['id', 'name', 'email', 'avatar']);

$valid = 0;
$invalid = 0;

foreach ($users as $user) {
    $avatarPath = $user->avatar;
    
    // Đảm bảo đường dẫn bắt đầu bằng /
    if (!str_starts_with($avatarPath, '/')) {
        $avatarPath = '/' . $avatarPath;
    }
    
    $fullPath = public_path($avatarPath);
    $exists = file_exists($fullPath);
    
    if ($exists) {
        echo "✓ {$user->name} - {$avatarPath}\n";
        $valid++;
        
        // Sửa đường dẫn nếu chưa đúng format
        if ($user->avatar !== $avatarPath) {
            $user->avatar = $avatarPath;
            $user->save();
        }
    } else {
        echo "✗ {$user->name} - {$avatarPath} (FILE KHÔNG TỒN TẠI)\n";
        $invalid++;
    }
}

echo "\n✅ Tổng kết:\n";
echo "   - Valid: {$valid} users\n";
echo "   - Invalid: {$invalid} users\n";
