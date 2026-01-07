<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'Samsung Việt Nam',
                'contact_person' => 'Nguyễn Minh Quân',
                'email' => 'sales@samsung.vn',
                'phone' => '028-7300-6789',
                'address_line' => 'Lô B1, Khu Công Nghệ Cao',
                'city' => 'Hồ Chí Minh',
                'district' => 'Quận 9',
                'tax_code' => '0303211234',
                'bank_account' => '123456789 - Vietcombank Thủ Đức',
                'notes' => 'Nhà phân phối chiến lược dòng TV, tủ lạnh Samsung.',
            ],
            [
                'name' => 'LG Electronics Việt Nam',
                'contact_person' => 'Trần Bảo An',
                'email' => 'contact@lg.com.vn',
                'phone' => '028-3823-1234',
                'address_line' => '19-21 Tôn Đức Thắng',
                'city' => 'Hồ Chí Minh',
                'district' => 'Quận 1',
                'tax_code' => '0302245678',
                'bank_account' => '9988776655 - Shinhan Bank',
                'notes' => 'Cung cấp máy giặt, tủ lạnh và TV LG chính hãng.',
            ],
            [
                'name' => 'Sony Electronics Việt Nam',
                'contact_person' => 'Lê Phương Nam',
                'email' => 'partners@sony.vn',
                'phone' => '024-3941-8000',
                'address_line' => 'Tầng 15, tòa nhà Lotte',
                'city' => 'Hà Nội',
                'district' => 'Ba Đình',
                'tax_code' => '0105678123',
                'bank_account' => '5566778899 - Mizuho Bank',
                'notes' => 'Đối tác cao cấp cung cấp TV, loa, thiết bị giải trí.',
            ],
            [
                'name' => 'TCL Việt Nam',
                'contact_person' => 'Đỗ Hồng Sơn',
                'email' => 'sales@tcl.com.vn',
                'phone' => '028-6267-7890',
                'address_line' => 'Số 1, đường Tân Hòa Đông',
                'city' => 'Hồ Chí Minh',
                'district' => 'Bình Tân',
                'tax_code' => '0312244668',
                'bank_account' => '1122334455 - BIDV Bình Tân',
                'notes' => 'Nhà phân phối chính thức các dòng smart TV TCL.',
            ],
            [
                'name' => 'Xiaomi Trading Việt Nam',
                'contact_person' => 'Phạm Mỹ Dung',
                'email' => 'xiaomi@mi.com',
                'phone' => '028-7300-0998',
                'address_line' => 'Tầng 10, 235 Nam Kỳ Khởi Nghĩa',
                'city' => 'Hồ Chí Minh',
                'district' => 'Quận 3',
                'tax_code' => '0314426789',
                'bank_account' => '6655443322 - Techcombank Sài Gòn',
                'notes' => 'Nhập khẩu TV, thiết bị nhà thông minh Xiaomi.',
            ],
            [
                'name' => 'Panasonic Việt Nam',
                'contact_person' => 'Vũ Hữu Phước',
                'email' => 'panasonic@vn.panasonic.com',
                'phone' => '024-3726-1777',
                'address_line' => 'Cụm Công nghiệp Bắc Thăng Long',
                'city' => 'Hà Nội',
                'district' => 'Đông Anh',
                'tax_code' => '0102288888',
                'bank_account' => '4455667788 - VietinBank Đông Anh',
                'notes' => 'Cung cấp tủ lạnh, máy giặt và thiết bị gia dụng.',
            ],
            [
                'name' => 'Toshiba Việt Nam',
                'contact_person' => 'Hoàng Thùy Linh',
                'email' => 'contact@toshiba.com.vn',
                'phone' => '028-3910-8866',
                'address_line' => 'Tầng 4, Tòa nhà Etown',
                'city' => 'Hồ Chí Minh',
                'district' => 'Tân Bình',
                'tax_code' => '0305566778',
                'bank_account' => '2211334455 - ACB Tân Sơn Nhì',
                'notes' => 'Nhà cung cấp máy giặt, tủ lạnh Toshiba.',
            ],
            [
                'name' => 'Sharp Việt Nam',
                'contact_person' => 'Phạm Tấn Quốc',
                'email' => 'sharp@sharp.vn',
                'phone' => '028-3948-7888',
                'address_line' => '35 Nguyễn Huệ',
                'city' => 'Hồ Chí Minh',
                'district' => 'Quận 1',
                'tax_code' => '0314455666',
                'bank_account' => '7788990011 - Vietcombank Bến Thành',
                'notes' => 'Đối tác chiến lược tủ lạnh Sharp, thiết bị lọc khí.',
            ],
            [
                'name' => 'Aqua Việt Nam',
                'contact_person' => 'Đặng Gia Hưng',
                'email' => 'sales@aqua.com.vn',
                'phone' => '0251-351-3888',
                'address_line' => 'KCN Long Đức',
                'city' => 'Đồng Nai',
                'district' => 'Long Thành',
                'tax_code' => '3602477777',
                'bank_account' => '1133557799 - Agribank Đồng Nai',
                'notes' => 'Nhà cung cấp máy giặt Aqua, tủ lạnh mini.',
            ],
            [
                'name' => 'Dell Việt Nam',
                'contact_person' => 'Ngô Phương Uyên',
                'email' => 'channel@dell.com',
                'phone' => '028-3944-6888',
                'address_line' => '37 Tôn Đức Thắng',
                'city' => 'Hồ Chí Minh',
                'district' => 'Quận 1',
                'tax_code' => '0315566779',
                'bank_account' => '8822113344 - HSBC Việt Nam',
                'notes' => 'Phân phối laptop Dell Inspiron, XPS.',
            ],
            [
                'name' => 'Asus Việt Nam',
                'contact_person' => 'Đinh Thị Khánh Vy',
                'email' => 'partners@asus.com',
                'phone' => '028-7300-2268',
                'address_line' => 'Số 1 Lê Duẩn',
                'city' => 'Hồ Chí Minh',
                'district' => 'Quận 1',
                'tax_code' => '0316677889',
                'bank_account' => '3344556677 - Standard Chartered',
                'notes' => 'Nhà phân phối dòng laptop Vivobook, Zenbook.',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::updateOrCreate(
                ['name' => $supplier['name']],
                $supplier
            );
        }
    }
}
