<?php

/**
 * Script để sửa lại đường dẫn avatar cho các users
 * Chạy: php fix-avatar-paths.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "🔧 Đang sửa đường dẫn avatar...\n\n";

$users = User::whereNotNull('avatar')
    ->where('avatar', '!=', '')
    ->get();

$fixed = 0;
$notFound = 0;

foreach ($users as $user) {
    $avatarPath = $user->avatar;
    
    // Nếu đường dẫn không bắt đầu bằng /uploads/avatars/
    if (!str_starts_with($avatarPath, '/uploads/avatars/')) {
        // Lấy tên file từ đường dẫn
        $filename = basename($avatarPath);
        
        // Kiểm tra file có tồn tại không
        $newPath = '/uploads/avatars/' . $filename;
        $fullPath = public_path($newPath);
        
        if (file_exists($fullPath)) {
            $user->avatar = $newPath;
            $user->save();
            echo "✓ Đã sửa: {$user->name} -> {$newPath}\n";
            $fixed++;
        } else {
            echo "✗ Không tìm thấy file: {$filename} (User: {$user->name})\n";
            $notFound++;
        }
    } else {
        // Kiểm tra file có tồn tại không
        $fullPath = public_path($avatarPath);
        if (!file_exists($fullPath)) {
            echo "⚠ File không tồn tại: {$avatarPath} (User: {$user->name})\n";
            $notFound++;
        }
    }
}

echo "\n✅ Hoàn thành!\n";
echo "   - Đã sửa: {$fixed} users\n";
echo "   - Không tìm thấy file: {$notFound} users\n";
