<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            PaymentMethodSeeder::class,
            ProductSeeder::class,
            PromotionSeeder::class,
            CartSeeder::class,
            InventoryImportSeeder::class, // Nhập kho trước để có quantity
            OrderSeeder::class,
            ReportDataSeeder::class, // Sau đó mới tạo đơn hàng và trừ quantity
            CompleteDataSeeder::class, // Thêm reviews, questions, returns, warranties
        ]);
    }
}
