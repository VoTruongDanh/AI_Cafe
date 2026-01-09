<?php

/**
 * Script để xóa các users có avatar không tồn tại
 * Chạy: php cleanup-invalid-avatars.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "🧹 Đang dọn dẹp users có avatar không tồn tại...\n\n";

$users = User::whereNotNull('avatar')
    ->where('avatar', '!=', '')
    ->where('role', 'customer')
    ->get();

$deleted = 0;
$kept = 0;

foreach ($users as $user) {
    $avatarPath = $user->avatar;
    
    // Chuẩn hóa đường dẫn
    if (!str_starts_with($avatarPath, '/')) {
        $avatarPath = '/' . $avatarPath;
    }
    
    // Kiểm tra file có tồn tại không
    $fullPath = public_path($avatarPath);
    
    if (!file_exists($fullPath)) {
        echo "✗ Xóa user: {$user->name} (Avatar không tồn tại: {$avatarPath})\n";
        $user->delete();
        $deleted++;
    } else {
        // Đảm bảo đường dẫn đúng format
        if (!str_starts_with($user->avatar, '/uploads/avatars/')) {
            $filename = basename($avatarPath);
            $user->avatar = '/uploads/avatars/' . $filename;
            $user->save();
            echo "✓ Sửa đường dẫn: {$user->name} -> {$user->avatar}\n";
        }
        $kept++;
    }
}

echo "\n✅ Hoàn thành!\n";
echo "   - Đã xóa: {$deleted} users\n";
echo "   - Giữ lại: {$kept} users\n";
