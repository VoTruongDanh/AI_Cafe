<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FaceRecognitionTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Thêm các users với avatar từ ảnh người thật online để test nhận diện khuôn mặt
     */
    public function run(): void
    {
        $this->command->info('🌐 Đang tải avatar từ Random User API...');

        // Sử dụng Random User Generator API để lấy ảnh người thật
        // API này trả về ảnh người thật từ các nguồn công khai
        $count = 15; // Số lượng users muốn tạo
        $users = [];

        try {
            // Gọi API để lấy danh sách users với avatar
            $response = Http::timeout(30)->get("https://randomuser.me/api/?results={$count}&nat=us,gb,au,ca");
            
            if ($response->successful()) {
                $data = $response->json();
                $results = $data['results'] ?? [];

                foreach ($results as $index => $randomUser) {
                    $avatarUrl = $randomUser['picture']['large'] ?? $randomUser['picture']['medium'] ?? null;
                    
                    if ($avatarUrl) {
                        $users[] = [
                            'name' => $randomUser['name']['first'] . ' ' . $randomUser['name']['last'],
                            'email' => $randomUser['email'],
                            'phone' => $randomUser['phone'],
                            'avatar_url' => $avatarUrl,
                            'gender' => $randomUser['gender'],
                        ];
                    }
                }
            }
        } catch (\Exception $e) {
            $this->command->warn('⚠️ Không thể tải từ API, sử dụng avatar mặc định...');
            $this->command->error($e->getMessage());
        }

        // Nếu API fail, sử dụng danh sách avatar từ các nguồn khác
        if (empty($users)) {
            $this->command->info('📸 Sử dụng avatar từ nguồn dự phòng...');
            $users = $this->getFallbackAvatars();
        }

        $this->command->info("✅ Đã tải được " . count($users) . " avatar. Đang tạo users...");

        $defaultPassword = 'Password@123';
        $created = 0;

        foreach ($users as $index => $userData) {
            try {
                // Download avatar về local
                $avatarPath = $this->downloadAvatar($userData['avatar_url'], $index + 1);
                
                if ($avatarPath) {
                    $user = User::updateOrCreate(
                        ['email' => $userData['email']],
                        [
                            'name' => $userData['name'],
                            'password' => Hash::make($defaultPassword),
                            'role' => 'customer',
                            'phone' => $userData['phone'] ?? '09' . str_pad(rand(10000000, 99999999), 8, '0', STR_PAD_LEFT),
                            'avatar' => $avatarPath,
                            'address_line' => $this->getRandomAddress(),
                            'ward' => 'Phường ' . rand(1, 20),
                            'city' => 'Hồ Chí Minh',
                            'postal_code' => '70000',
                            'loyalty_tier' => $this->getRandomTier(),
                            'loyalty_points' => rand(0, 5000),
                            'is_active' => true,
                            'email_verified_at' => now(),
                            'last_login_at' => now()->subDays(rand(1, 30)),
                            'remember_token' => Str::random(20),
                        ]
                    );

                    $created++;
                    $this->command->info("  ✓ Đã tạo: {$user->name} ({$user->email})");
                } else {
                    $this->command->warn("  ✗ Không thể download avatar cho: {$userData['name']}");
                }
            } catch (\Exception $e) {
                $this->command->error("  ✗ Lỗi khi tạo user {$userData['name']}: " . $e->getMessage());
            }
        }

        $this->command->info("\n✅ Hoàn thành! Đã tạo {$created} users với avatar để test nhận diện khuôn mặt.");
        $this->command->info("📝 Password mặc định cho tất cả users: {$defaultPassword}");
    }

    /**
     * Download avatar từ URL và lưu vào storage
     */
    private function downloadAvatar(string $url, int $index): ?string
    {
        try {
            $response = Http::timeout(15)->get($url);
            
            if ($response->successful()) {
                $imageData = $response->body();
                $extension = 'jpg'; // Random User API trả về JPG
                $filename = 'face_test_' . $index . '_' . time() . '.' . $extension;
                
                // Đảm bảo thư mục tồn tại
                $avatarDir = public_path('uploads/avatars');
                if (!is_dir($avatarDir)) {
                    mkdir($avatarDir, 0755, true);
                }
                
                // Lưu vào public/uploads/avatars
                $fullPath = $avatarDir . '/' . $filename;
                file_put_contents($fullPath, $imageData);
                
                // Trả về path với dấu / ở đầu (giống format trong AdminUserController)
                return '/uploads/avatars/' . $filename;
            }
        } catch (\Exception $e) {
            $this->command->warn("  ⚠️ Không thể download avatar từ {$url}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Danh sách avatar dự phòng nếu API fail
     */
    private function getFallbackAvatars(): array
    {
        // Sử dụng các URL avatar từ các dịch vụ công khai
        // Các URL này là ảnh người thật từ các nguồn công khai
        return [
            [
                'name' => 'Nguyễn Văn An',
                'email' => 'nguyenvanan.test@example.com',
                'phone' => '0912345678',
                'avatar_url' => 'https://i.pravatar.cc/300?img=1',
            ],
            [
                'name' => 'Trần Thị Bình',
                'email' => 'tranthibinh.test@example.com',
                'phone' => '0923456789',
                'avatar_url' => 'https://i.pravatar.cc/300?img=2',
            ],
            [
                'name' => 'Lê Văn Cường',
                'email' => 'levancuong.test@example.com',
                'phone' => '0934567890',
                'avatar_url' => 'https://i.pravatar.cc/300?img=3',
            ],
            [
                'name' => 'Phạm Thị Dung',
                'email' => 'phamthidung.test@example.com',
                'phone' => '0945678901',
                'avatar_url' => 'https://i.pravatar.cc/300?img=4',
            ],
            [
                'name' => 'Hoàng Văn Em',
                'email' => 'hoangvanem.test@example.com',
                'phone' => '0956789012',
                'avatar_url' => 'https://i.pravatar.cc/300?img=5',
            ],
            [
                'name' => 'Vũ Thị Phương',
                'email' => 'vuthiphuong.test@example.com',
                'phone' => '0967890123',
                'avatar_url' => 'https://i.pravatar.cc/300?img=6',
            ],
            [
                'name' => 'Đặng Văn Giang',
                'email' => 'dangvangiang.test@example.com',
                'phone' => '0978901234',
                'avatar_url' => 'https://i.pravatar.cc/300?img=7',
            ],
            [
                'name' => 'Bùi Thị Hoa',
                'email' => 'buithihoa.test@example.com',
                'phone' => '0989012345',
                'avatar_url' => 'https://i.pravatar.cc/300?img=8',
            ],
            [
                'name' => 'Trịnh Văn Hùng',
                'email' => 'trinhvanhung.test@example.com',
                'phone' => '0990123456',
                'avatar_url' => 'https://i.pravatar.cc/300?img=9',
            ],
            [
                'name' => 'Ngô Thị Lan',
                'email' => 'ngothilan.test@example.com',
                'phone' => '0901234567',
                'avatar_url' => 'https://i.pravatar.cc/300?img=10',
            ],
        ];
    }

    /**
     * Lấy địa chỉ ngẫu nhiên
     */
    private function getRandomAddress(): string
    {
        $streets = [
            '123 Nguyễn Huệ',
            '456 Lê Lợi',
            '789 Trần Hưng Đạo',
            '234 Hai Bà Trưng',
            '567 Lý Thường Kiệt',
            '890 Võ Văn Tần',
            '321 Pasteur',
            '654 Điện Biên Phủ',
            '987 Cách Mạng Tháng 8',
            '147 Nguyễn Thị Minh Khai',
        ];
        
        return $streets[array_rand($streets)];
    }

    /**
     * Lấy tier ngẫu nhiên
     */
    private function getRandomTier(): string
    {
        $tiers = ['bronze', 'silver', 'gold', 'vip'];
        $weights = [40, 30, 20, 10]; // Tỷ lệ: 40% bronze, 30% silver, 20% gold, 10% vip
        
        $rand = rand(1, 100);
        $cumulative = 0;
        
        foreach ($tiers as $index => $tier) {
            $cumulative += $weights[$index];
            if ($rand <= $cumulative) {
                return $tier;
            }
        }
        
        return 'bronze';
    }
}
