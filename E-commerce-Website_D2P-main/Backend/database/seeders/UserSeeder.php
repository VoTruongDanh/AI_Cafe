<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPassword = 'Password@123';

        // Admin account 1 - Email
        $admin = User::updateOrCreate(
            ['email' => 'admin@electroshop.vn'],
            [
                'name' => 'Nguyễn Văn Quản',
                'password' => Hash::make($defaultPassword),
                'role' => 'admin',
                'phone' => '0901234567',
                'address_line' => '123 Nguyễn Huệ',
                'ward' => 'Phường Bến Nghé',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'vip',
                'loyalty_points' => 10000,
                'is_active' => true,
                'email_verified_at' => now(),
                'last_login_at' => now()->subDay(),
                'remember_token' => Str::random(20),
            ]
        );

        // Admin account 2 - Simple for testing
        User::updateOrCreate(
            ['email' => '1@1.1'],
            [
                'name' => 'Admin Test',
                'password' => Hash::make('1'),
                'role' => 'admin',
                'phone' => '0900000001',
                'address_line' => '1 Test Street',
                'ward' => 'Phường 1',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'vip',
                'loyalty_points' => 0,
                'is_active' => true,
                'email_verified_at' => now(),
                'last_login_at' => now(),
                'remember_token' => Str::random(20),
            ]
        );

        // Staff account
        User::updateOrCreate(
            ['email' => 'support@electroshop.vn'],
            [
                'name' => 'Trần Thị Hỗ Trợ',
                'password' => Hash::make($defaultPassword),
                'role' => 'staff',
                'phone' => '0907654321',
                'address_line' => '456 Lê Lợi',
                'ward' => 'Phường Bến Thành',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'gold',
                'loyalty_points' => 5000,
                'is_active' => true,
                'email_verified_at' => now(),
                'last_login_at' => now()->subHours(12),
                'remember_token' => Str::random(20),
            ]
        );

        // Staff account 2 - Simple for testing (1@1 / 1)
        User::updateOrCreate(
            ['email' => '1@1'],
            [
                'name' => 'Nhân Viên Test',
                'password' => Hash::make('1'),
                'role' => 'staff',
                'phone' => '0900000002',
                'address_line' => '2 Test Street',
                'ward' => 'Phường 2',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'bronze',
                'loyalty_points' => 0,
                'is_active' => true,
                'email_verified_at' => now(),
                'last_login_at' => now(),
                'remember_token' => Str::random(20),
            ]
        );

        // Customer accounts với tên tiếng Việt
        $customers = [
            [
                'name' => 'Lê Văn Minh',
                'email' => 'levanminh@gmail.com',
                'phone' => '0912345678',
                'address_line' => '789 Trần Hưng Đạo',
                'ward' => 'Phường Cầu Kho',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'gold',
                'loyalty_points' => 3500,
            ],
            [
                'name' => 'Phạm Thị Hương',
                'email' => 'phamhuong@gmail.com',
                'phone' => '0923456789',
                'address_line' => '234 Hai Bà Trưng',
                'ward' => 'Phường Đa Kao',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'silver',
                'loyalty_points' => 1800,
            ],
            [
                'name' => 'Hoàng Văn Tuấn',
                'email' => 'hoangvantuan@gmail.com',
                'phone' => '0934567890',
                'address_line' => '567 Lý Thường Kiệt',
                'ward' => 'Phường 14',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'bronze',
                'loyalty_points' => 500,
            ],
            [
                'name' => 'Vũ Thị Lan',
                'email' => 'vuthilan@gmail.com',
                'phone' => '0945678901',
                'address_line' => '890 Võ Văn Tần',
                'ward' => 'Phường 6',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'gold',
                'loyalty_points' => 4200,
            ],
            [
                'name' => 'Đặng Văn Hải',
                'email' => 'dangvanhai@gmail.com',
                'phone' => '0956789012',
                'address_line' => '123 Cách Mạng Tháng 8',
                'ward' => 'Phường 7',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'silver',
                'loyalty_points' => 2100,
            ],
            [
                'name' => 'Bùi Thị Mai',
                'email' => 'buithimai@gmail.com',
                'phone' => '0967890123',
                'address_line' => '456 Điện Biên Phủ',
                'ward' => 'Phường 21',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'bronze',
                'loyalty_points' => 800,
            ],
            [
                'name' => 'Trịnh Văn Đức',
                'email' => 'trinhvanduc@gmail.com',
                'phone' => '0978901234',
                'address_line' => '789 Nguyễn Thị Minh Khai',
                'ward' => 'Phường Đa Kao',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'gold',
                'loyalty_points' => 5500,
            ],
            [
                'name' => 'Ngô Thị Thanh',
                'email' => 'ngothithanh@gmail.com',
                'phone' => '0989012345',
                'address_line' => '321 Pasteur',
                'ward' => 'Phường Bến Nghé',
                'city' => 'Hồ Chí Minh',
                'postal_code' => '70000',
                'loyalty_tier' => 'silver',
                'loyalty_points' => 1500,
            ],
        ];

        foreach ($customers as $customer) {
            User::updateOrCreate(
                ['email' => $customer['email']],
                array_merge($customer, [
                    'password' => Hash::make($defaultPassword),
                    'role' => 'customer',
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'last_login_at' => now()->subDays(rand(1, 30)),
                    'remember_token' => Str::random(20),
                ])
            );
        }

        // Tạo thêm 20 customer ngẫu nhiên với factory
        User::factory()
            ->count(20)
            ->create([
                'role' => 'customer',
                'is_active' => true,
            ]);

        if ($admin) {
            $this->command?->info('Admin account 1: admin@electroshop.vn / ' . $defaultPassword);
            $this->command?->info('Admin account 2 (Test): 1@1.1 / 1');
            $this->command?->info('Staff account (Test): 1@1 / 1');
        }
    }
}
