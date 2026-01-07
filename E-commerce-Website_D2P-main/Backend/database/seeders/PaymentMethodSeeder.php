<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            [
                'name' => 'Thanh toán khi nhận hàng (COD)',
                'code' => 'COD',
                'type' => 'offline',
                'description' => 'Khách hàng thanh toán trực tiếp khi nhận hàng.',
                'is_active' => true,
                'config' => [
                    'allow_partial' => false,
                    'support_return' => true,
                ],
            ],
            [
                'name' => 'Ví điện tử MoMo',
                'code' => 'MOMO',
                'type' => 'online',
                'description' => 'Thanh toán bằng ứng dụng MoMo thông qua QR.',
                'is_active' => true,
                'config' => [
                    'phone_number' => '0987026980',
                    'account_name' => 'PHAM MINH DUY',
                ],
            ],
            [
                'name' => 'VNPay',
                'code' => 'VNPAY',
                'type' => 'online',
                'description' => 'Thanh toán trực tuyến qua VNPay (ATM/Visa/MasterCard/JCB/QR).',
                'is_active' => true,
                'config' => [
                    'supported_banks' => ['NCB', 'VIETCOMBANK', 'VIETINBANK', 'AGRIBANK', 'BIDV', 'TECHCOMBANK', 'MBBANK', 'VPBANK', 'TPBANK', 'ACB', 'SACOMBANK', 'HDBANK', 'OCEANBANK', 'NAMABANK', 'EXIMBANK'],
                    'supported_cards' => ['VISA', 'MASTERCARD', 'JCB'],
                ],
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                ['code' => $method['code']],
                $method
            );
        }
    }
}
