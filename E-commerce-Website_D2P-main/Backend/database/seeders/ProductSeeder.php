<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::all()->keyBy('slug');
        $suppliers = Supplier::all()->keyBy(fn ($supplier) => Str::slug($supplier->name));

        $products = collect([
            // ===========================
            // MÓN NƯỚC - CÀ PHÊ
            // ===========================
            [
                'name' => 'Cà phê đen đá',
                'sku' => 'CF-DEN-DA',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cà phê đen đá truyền thống, đậm đà hương vị.',
                'description' => 'Cà phê đen đá được pha từ hạt cà phê rang xay, phục vụ với đá viên, vị đắng đậm đà đặc trưng của cà phê Việt Nam.',
                'original_price' => 15000,
                'price' => 25000,
                'quantity' => 1000,
                'reorder_point' => 50,
                'sold_count' => 450,
                'view_count' => 1200,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Cà phê sữa đá',
                'sku' => 'CF-SUA-DA',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cà phê sữa đá thơm ngon, béo ngậy.',
                'description' => 'Cà phê sữa đá kết hợp giữa vị đắng của cà phê và vị ngọt béo của sữa đặc, thêm đá viên mát lạnh.',
                'original_price' => 18000,
                'price' => 30000,
                'quantity' => 1000,
                'reorder_point' => 50,
                'sold_count' => 680,
                'view_count' => 1500,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Cà phê đen nóng',
                'sku' => 'CF-DEN-NONG',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cà phê đen nóng thơm lừng, ấm áp.',
                'description' => 'Cà phê đen nóng phục vụ nóng hổi, giữ nguyên hương vị đậm đà của cà phê rang xay.',
                'original_price' => 15000,
                'price' => 25000,
                'quantity' => 1000,
                'reorder_point' => 50,
                'sold_count' => 320,
                'view_count' => 980,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Vừa',
                    'temperature' => 'Nóng',
                ],
            ],
            [
                'name' => 'Cà phê sữa nóng',
                'sku' => 'CF-SUA-NONG',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cà phê sữa nóng ấm áp, thơm ngon.',
                'description' => 'Cà phê sữa nóng phục vụ nóng, kết hợp hoàn hảo giữa cà phê đậm đà và sữa đặc ngọt ngào.',
                'original_price' => 18000,
                'price' => 30000,
                'quantity' => 1000,
                'reorder_point' => 50,
                'sold_count' => 280,
                'view_count' => 850,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Vừa',
                    'temperature' => 'Nóng',
                ],
            ],
            [
                'name' => 'Espresso',
                'sku' => 'CF-ESPRESSO',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Espresso đậm đà, nguyên bản Ý.',
                'description' => 'Espresso được pha từ máy pha cà phê chuyên nghiệp, vị đậm đà, đắng nhẹ, thơm nồng.',
                'original_price' => 20000,
                'price' => 35000,
                'quantity' => 500,
                'reorder_point' => 30,
                'sold_count' => 150,
                'view_count' => 420,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 8,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Nhỏ',
                    'temperature' => 'Nóng',
                ],
            ],
            [
                'name' => 'Cappuccino',
                'sku' => 'CF-CAPPUCCINO',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cappuccino với lớp bọt sữa dày, thơm ngon.',
                'description' => 'Cappuccino kết hợp espresso, sữa nóng và lớp bọt sữa dày phía trên, trang trí với bột cacao.',
                'original_price' => 25000,
                'price' => 45000,
                'quantity' => 500,
                'reorder_point' => 30,
                'sold_count' => 220,
                'view_count' => 580,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 8,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Vừa',
                    'temperature' => 'Nóng',
                ],
            ],
            [
                'name' => 'Latte',
                'sku' => 'CF-LATTE',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Latte mềm mại với nhiều sữa, vị nhẹ nhàng.',
                'description' => 'Latte với tỷ lệ nhiều sữa hơn espresso, vị nhẹ nhàng, có thể vẽ latte art trên bề mặt.',
                'original_price' => 25000,
                'price' => 45000,
                'quantity' => 500,
                'reorder_point' => 30,
                'sold_count' => 190,
                'view_count' => 520,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 8,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Vừa',
                    'temperature' => 'Nóng',
                ],
            ],
            [
                'name' => 'Americano',
                'sku' => 'CF-AMERICANO',
                'category_slug' => 'coffee',
                'supplier' => 'Nhà cung cấp cà phê',
                'thumbnail' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Americano - espresso pha loãng với nước nóng.',
                'description' => 'Americano là espresso được pha loãng với nước nóng, vị nhẹ hơn espresso nhưng vẫn giữ được hương vị đậm đà.',
                'original_price' => 20000,
                'price' => 35000,
                'quantity' => 500,
                'reorder_point' => 30,
                'sold_count' => 120,
                'view_count' => 380,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 8,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Vừa',
                    'temperature' => 'Nóng',
                ],
            ],

            // ===========================
            // MÓN NƯỚC - TRÀ
            // ===========================
            [
                'name' => 'Trà đen đá',
                'sku' => 'TRA-DEN-DA',
                'category_slug' => 'tea',
                'supplier' => 'Nhà cung cấp trà',
                'thumbnail' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Trà đen đá mát lạnh, thanh mát.',
                'description' => 'Trà đen đá được pha từ lá trà đen chất lượng, phục vụ với đá viên, vị chát nhẹ, thanh mát.',
                'original_price' => 12000,
                'price' => 20000,
                'quantity' => 800,
                'reorder_point' => 40,
                'sold_count' => 380,
                'view_count' => 950,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 6,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Trà sữa',
                'sku' => 'TRA-SUA',
                'category_slug' => 'tea',
                'supplier' => 'Nhà cung cấp trà',
                'thumbnail' => 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Trà sữa thơm ngon, ngọt ngào.',
                'description' => 'Trà sữa kết hợp giữa trà đen và sữa, thêm trân châu, vị ngọt ngào, thơm ngon.',
                'original_price' => 20000,
                'price' => 35000,
                'quantity' => 800,
                'reorder_point' => 40,
                'sold_count' => 520,
                'view_count' => 1300,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 6,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Trà xanh đá',
                'sku' => 'TRA-XANH-DA',
                'category_slug' => 'tea',
                'supplier' => 'Nhà cung cấp trà',
                'thumbnail' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Trà xanh đá thanh mát, giải nhiệt.',
                'description' => 'Trà xanh đá được pha từ lá trà xanh tươi, vị thanh mát, giải nhiệt hiệu quả.',
                'original_price' => 12000,
                'price' => 20000,
                'quantity' => 800,
                'reorder_point' => 40,
                'sold_count' => 290,
                'view_count' => 720,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 6,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Trà thảo mộc',
                'sku' => 'TRA-THAO-MOC',
                'category_slug' => 'tea',
                'supplier' => 'Nhà cung cấp trà',
                'thumbnail' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Trà thảo mộc tốt cho sức khỏe, thơm dịu.',
                'description' => 'Trà thảo mộc được pha từ các loại thảo mộc tự nhiên, tốt cho sức khỏe, hương thơm dịu nhẹ.',
                'original_price' => 15000,
                'price' => 25000,
                'quantity' => 600,
                'reorder_point' => 30,
                'sold_count' => 180,
                'view_count' => 450,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 7,
                'attributes' => [
                    'type' => 'Đồ uống nóng',
                    'size' => 'Vừa',
                    'temperature' => 'Nóng',
                ],
            ],

            // ===========================
            // MÓN NƯỚC - NƯỚC ÉP & SINH TỐ
            // ===========================
            [
                'name' => 'Nước ép cam',
                'sku' => 'NE-CAM',
                'category_slug' => 'juice-smoothie',
                'supplier' => 'Nhà cung cấp trái cây',
                'thumbnail' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Nước ép cam tươi, giàu vitamin C.',
                'description' => 'Nước ép cam được ép từ cam tươi, không thêm đường, giàu vitamin C, tốt cho sức khỏe.',
                'original_price' => 25000,
                'price' => 40000,
                'quantity' => 300,
                'reorder_point' => 20,
                'sold_count' => 210,
                'view_count' => 580,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Nước ép dưa hấu',
                'sku' => 'NE-DUA-HAU',
                'category_slug' => 'juice-smoothie',
                'supplier' => 'Nhà cung cấp trái cây',
                'thumbnail' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Nước ép dưa hấu mát lạnh, giải nhiệt.',
                'description' => 'Nước ép dưa hấu tươi ngon, mát lạnh, giải nhiệt hiệu quả trong mùa hè.',
                'original_price' => 20000,
                'price' => 35000,
                'quantity' => 300,
                'reorder_point' => 20,
                'sold_count' => 180,
                'view_count' => 480,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Sinh tố bơ',
                'sku' => 'ST-BO',
                'category_slug' => 'juice-smoothie',
                'supplier' => 'Nhà cung cấp trái cây',
                'thumbnail' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Sinh tố bơ béo ngậy, thơm ngon.',
                'description' => 'Sinh tố bơ được xay từ bơ tươi, thêm sữa đặc và đá xay, vị béo ngậy, thơm ngon.',
                'original_price' => 30000,
                'price' => 50000,
                'quantity' => 300,
                'reorder_point' => 20,
                'sold_count' => 250,
                'view_count' => 650,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Sinh tố dâu tây',
                'sku' => 'ST-DAU-TAY',
                'category_slug' => 'juice-smoothie',
                'supplier' => 'Nhà cung cấp trái cây',
                'thumbnail' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Sinh tố dâu tây chua ngọt, tươi mát.',
                'description' => 'Sinh tố dâu tây được xay từ dâu tây tươi, thêm sữa và đá xay, vị chua ngọt tự nhiên.',
                'original_price' => 35000,
                'price' => 55000,
                'quantity' => 300,
                'reorder_point' => 20,
                'sold_count' => 190,
                'view_count' => 520,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Sinh tố xoài',
                'sku' => 'ST-XOAI',
                'category_slug' => 'juice-smoothie',
                'supplier' => 'Nhà cung cấp trái cây',
                'thumbnail' => 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Sinh tố xoài ngọt ngào, thơm lừng.',
                'description' => 'Sinh tố xoài được xay từ xoài chín, thêm sữa và đá xay, vị ngọt ngào, thơm lừng.',
                'original_price' => 30000,
                'price' => 50000,
                'quantity' => 300,
                'reorder_point' => 20,
                'sold_count' => 220,
                'view_count' => 580,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Vừa',
                    'temperature' => 'Lạnh',
                ],
            ],

            // ===========================
            // MÓN NƯỚC - NƯỚC NGỌT
            // ===========================
            [
                'name' => 'Coca Cola',
                'sku' => 'NG-COCA',
                'category_slug' => 'soft-drinks',
                'supplier' => 'Nhà cung cấp nước ngọt',
                'thumbnail' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Coca Cola lon 330ml, mát lạnh.',
                'description' => 'Coca Cola lon 330ml, mát lạnh, vị ngọt đặc trưng.',
                'original_price' => 8000,
                'price' => 15000,
                'quantity' => 500,
                'reorder_point' => 50,
                'sold_count' => 380,
                'view_count' => 850,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 3,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Lon 330ml',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => 'Pepsi',
                'sku' => 'NG-PEPSI',
                'category_slug' => 'soft-drinks',
                'supplier' => 'Nhà cung cấp nước ngọt',
                'thumbnail' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Pepsi lon 330ml, mát lạnh.',
                'description' => 'Pepsi lon 330ml, mát lạnh, vị ngọt thanh.',
                'original_price' => 8000,
                'price' => 15000,
                'quantity' => 500,
                'reorder_point' => 50,
                'sold_count' => 320,
                'view_count' => 720,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 3,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Lon 330ml',
                    'temperature' => 'Lạnh',
                ],
            ],
            [
                'name' => '7Up',
                'sku' => 'NG-7UP',
                'category_slug' => 'soft-drinks',
                'supplier' => 'Nhà cung cấp nước ngọt',
                'thumbnail' => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop'
                ],
                'short_description' => '7Up lon 330ml, mát lạnh.',
                'description' => '7Up lon 330ml, mát lạnh, vị chanh thanh mát.',
                'original_price' => 8000,
                'price' => 15000,
                'quantity' => 500,
                'reorder_point' => 50,
                'sold_count' => 250,
                'view_count' => 580,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 3,
                'attributes' => [
                    'type' => 'Đồ uống lạnh',
                    'size' => 'Lon 330ml',
                    'temperature' => 'Lạnh',
                ],
            ],

            // ===========================
            // MÓN ĂN - BÁNH NGỌT
            // ===========================
            [
                'name' => 'Bánh kem chocolate',
                'sku' => 'BK-CHOCOLATE',
                'category_slug' => 'cakes',
                'supplier' => 'Nhà cung cấp bánh',
                'thumbnail' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Bánh kem chocolate đậm đà, ngọt ngào.',
                'description' => 'Bánh kem chocolate với lớp kem chocolate đậm đà, bánh mềm mịn, vị ngọt ngào.',
                'original_price' => 40000,
                'price' => 65000,
                'quantity' => 50,
                'reorder_point' => 10,
                'sold_count' => 85,
                'view_count' => 320,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Bánh ngọt',
                    'size' => '1 miếng',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Cheesecake',
                'sku' => 'BK-CHEESECAKE',
                'category_slug' => 'cakes',
                'supplier' => 'Nhà cung cấp bánh',
                'thumbnail' => 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cheesecake béo ngậy, mềm mịn.',
                'description' => 'Cheesecake với lớp phô mai béo ngậy, đế bánh giòn, vị ngọt vừa phải.',
                'original_price' => 45000,
                'price' => 70000,
                'quantity' => 50,
                'reorder_point' => 10,
                'sold_count' => 120,
                'view_count' => 450,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Bánh ngọt',
                    'size' => '1 miếng',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Tiramisu',
                'sku' => 'BK-TIRAMISU',
                'category_slug' => 'cakes',
                'supplier' => 'Nhà cung cấp bánh',
                'thumbnail' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Tiramisu Ý, thơm cà phê, béo ngậy.',
                'description' => 'Tiramisu truyền thống Ý với lớp mascarpone béo ngậy, thấm đẫm hương cà phê, rắc bột cacao.',
                'original_price' => 50000,
                'price' => 75000,
                'quantity' => 50,
                'reorder_point' => 10,
                'sold_count' => 95,
                'view_count' => 380,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Bánh ngọt',
                    'size' => '1 miếng',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Bánh mousse dâu',
                'sku' => 'BK-MOUSSE-DAU',
                'category_slug' => 'cakes',
                'supplier' => 'Nhà cung cấp bánh',
                'thumbnail' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Bánh mousse dâu tây tươi mát, ngọt ngào.',
                'description' => 'Bánh mousse dâu tây với lớp mousse mềm mịn, vị chua ngọt tự nhiên từ dâu tây tươi.',
                'original_price' => 40000,
                'price' => 65000,
                'quantity' => 50,
                'reorder_point' => 10,
                'sold_count' => 75,
                'view_count' => 290,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Bánh ngọt',
                    'size' => '1 miếng',
                    'serving' => '1 người',
                ],
            ],

            // ===========================
            // MÓN ĂN - BÁNH MẶN
            // ===========================
            [
                'name' => 'Bánh mì sandwich thịt nguội',
                'sku' => 'BM-SANDWICH-TN',
                'category_slug' => 'savory-cakes',
                'supplier' => 'Nhà cung cấp bánh mì',
                'thumbnail' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Bánh mì sandwich với thịt nguội, rau tươi.',
                'description' => 'Bánh mì sandwich với thịt nguội, rau xà lách, cà chua, sốt mayonnaise, bánh mì giòn.',
                'original_price' => 30000,
                'price' => 50000,
                'quantity' => 100,
                'reorder_point' => 20,
                'sold_count' => 180,
                'view_count' => 520,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Bánh mặn',
                    'size' => '1 phần',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Bánh mì nướng bơ tỏi',
                'sku' => 'BM-NUONG-BO-TOI',
                'category_slug' => 'savory-cakes',
                'supplier' => 'Nhà cung cấp bánh mì',
                'thumbnail' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Bánh mì nướng bơ tỏi thơm lừng, giòn tan.',
                'description' => 'Bánh mì nướng với bơ tỏi, thơm lừng, giòn tan, vị béo ngậy.',
                'original_price' => 25000,
                'price' => 40000,
                'quantity' => 100,
                'reorder_point' => 20,
                'sold_count' => 150,
                'view_count' => 420,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Bánh mặn',
                    'size' => '1 phần',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Croissant',
                'sku' => 'BM-CROISSANT',
                'category_slug' => 'savory-cakes',
                'supplier' => 'Nhà cung cấp bánh mì',
                'thumbnail' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Croissant Pháp, giòn tan, béo ngậy.',
                'description' => 'Croissant truyền thống Pháp, nhiều lớp bơ, giòn tan, béo ngậy, thơm lừng.',
                'original_price' => 20000,
                'price' => 35000,
                'quantity' => 100,
                'reorder_point' => 20,
                'sold_count' => 220,
                'view_count' => 580,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 4,
                'attributes' => [
                    'type' => 'Bánh mặn',
                    'size' => '1 cái',
                    'serving' => '1 người',
                ],
            ],

            // ===========================
            // MÓN ĂN - MÓN ĂN NHANH
            // ===========================
            [
                'name' => 'Khoai tây chiên',
                'sku' => 'MN-KTC',
                'category_slug' => 'fast-food',
                'supplier' => 'Nhà cung cấp thực phẩm',
                'thumbnail' => 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Khoai tây chiên giòn tan, vàng ruộm.',
                'description' => 'Khoai tây chiên giòn tan, vàng ruộm, ăn kèm sốt cà chua hoặc sốt mayonnaise.',
                'original_price' => 25000,
                'price' => 40000,
                'quantity' => 200,
                'reorder_point' => 30,
                'sold_count' => 320,
                'view_count' => 850,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 3,
                'attributes' => [
                    'type' => 'Món ăn nhanh',
                    'size' => '1 phần',
                    'serving' => '1-2 người',
                ],
            ],
            [
                'name' => 'Gà rán',
                'sku' => 'MN-GA-RAN',
                'category_slug' => 'fast-food',
                'supplier' => 'Nhà cung cấp thực phẩm',
                'thumbnail' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Gà rán giòn, thơm ngon.',
                'description' => 'Gà rán giòn, thịt mềm, thơm ngon, ăn kèm khoai tây chiên và sốt.',
                'original_price' => 50000,
                'price' => 80000,
                'quantity' => 100,
                'reorder_point' => 20,
                'sold_count' => 180,
                'view_count' => 520,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 3,
                'attributes' => [
                    'type' => 'Món ăn nhanh',
                    'size' => '1 phần',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Burger bò',
                'sku' => 'MN-BURGER-BO',
                'category_slug' => 'fast-food',
                'supplier' => 'Nhà cung cấp thực phẩm',
                'thumbnail' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Burger bò với thịt bò tươi, rau tươi.',
                'description' => 'Burger bò với thịt bò tươi, phô mai, rau xà lách, cà chua, sốt đặc biệt, bánh mì burger mềm.',
                'original_price' => 60000,
                'price' => 95000,
                'quantity' => 80,
                'reorder_point' => 15,
                'sold_count' => 150,
                'view_count' => 480,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 3,
                'attributes' => [
                    'type' => 'Món ăn nhanh',
                    'size' => '1 phần',
                    'serving' => '1 người',
                ],
            ],

            // ===========================
            // MÓN ĂN - MÓN CHÍNH
            // ===========================
            [
                'name' => 'Cơm gà nướng',
                'sku' => 'MC-COM-GA-NUONG',
                'category_slug' => 'main-dishes',
                'supplier' => 'Nhà cung cấp thực phẩm',
                'thumbnail' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Cơm gà nướng thơm lừng, đầy đủ dinh dưỡng.',
                'description' => 'Cơm gà nướng với gà nướng thơm lừng, cơm trắng, rau sống, nước mắm pha chua ngọt.',
                'original_price' => 50000,
                'price' => 85000,
                'quantity' => 60,
                'reorder_point' => 15,
                'sold_count' => 120,
                'view_count' => 380,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Món chính',
                    'size' => '1 phần',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Pasta Carbonara',
                'sku' => 'MC-PASTA-CARBONARA',
                'category_slug' => 'main-dishes',
                'supplier' => 'Nhà cung cấp thực phẩm',
                'thumbnail' => 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Pasta Carbonara béo ngậy, thơm ngon.',
                'description' => 'Pasta Carbonara với sốt kem, thịt xông khói, phô mai Parmesan, mì pasta al dente.',
                'original_price' => 60000,
                'price' => 95000,
                'quantity' => 50,
                'reorder_point' => 10,
                'sold_count' => 95,
                'view_count' => 320,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Món chính',
                    'size' => '1 phần',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Phở bò',
                'sku' => 'MC-PHO-BO',
                'category_slug' => 'main-dishes',
                'supplier' => 'Nhà cung cấp thực phẩm',
                'thumbnail' => 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Phở bò truyền thống, nước dùng đậm đà.',
                'description' => 'Phở bò với nước dùng đậm đà, thịt bò tái, bánh phở mềm, rau thơm, chanh, ớt.',
                'original_price' => 45000,
                'price' => 75000,
                'quantity' => 70,
                'reorder_point' => 15,
                'sold_count' => 180,
                'view_count' => 520,
                'is_featured' => true,
                'warranty_months' => 0,
                'published_days_ago' => 5,
                'attributes' => [
                    'type' => 'Món chính',
                    'size' => '1 tô',
                    'serving' => '1 người',
                ],
            ],

            // ===========================
            // MÓN ĂN - SNACK
            // ===========================
            [
                'name' => 'Bánh quy bơ',
                'sku' => 'SN-BANH-QUY-BO',
                'category_slug' => 'snacks',
                'supplier' => 'Nhà cung cấp snack',
                'thumbnail' => 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Bánh quy bơ giòn tan, thơm bơ.',
                'description' => 'Bánh quy bơ giòn tan, thơm mùi bơ, vị ngọt vừa phải.',
                'original_price' => 15000,
                'price' => 25000,
                'quantity' => 200,
                'reorder_point' => 30,
                'sold_count' => 280,
                'view_count' => 650,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 2,
                'attributes' => [
                    'type' => 'Snack',
                    'size' => '1 gói',
                    'serving' => '1 người',
                ],
            ],
            [
                'name' => 'Hạt điều rang muối',
                'sku' => 'SN-HAT-DIEU',
                'category_slug' => 'snacks',
                'supplier' => 'Nhà cung cấp snack',
                'thumbnail' => 'https://images.unsplash.com/photo-1606312619070-d48b4bc75ec5?w=800&h=600&fit=crop',
                'gallery' => [
                    'https://images.unsplash.com/photo-1606312619070-d48b4bc75ec5?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop'
                ],
                'short_description' => 'Hạt điều rang muối giòn, béo ngậy.',
                'description' => 'Hạt điều rang muối giòn, béo ngậy, vị mặn vừa phải.',
                'original_price' => 30000,
                'price' => 50000,
                'quantity' => 150,
                'reorder_point' => 20,
                'sold_count' => 120,
                'view_count' => 380,
                'is_featured' => false,
                'warranty_months' => 0,
                'published_days_ago' => 2,
                'attributes' => [
                    'type' => 'Snack',
                    'size' => '1 gói',
                    'serving' => '1-2 người',
                ],
            ],
        ]);

        $products->each(function (array $data) use ($categories, $suppliers) {
            $category = $categories->get(Str::slug($data['category_slug']));
            $supplier = $suppliers->get(Str::slug($data['supplier']));

            if (!$category) {
                return;
            }

            // Đảm bảo giá nhập (original_price) < giá bán (price)
            $originalPrice = $data['original_price'];
            $sellingPrice = $data['price'];
            if ($originalPrice > $sellingPrice) {
                $temp = $originalPrice;
                $originalPrice = $sellingPrice;
                $sellingPrice = $temp;
            }

            $product = Product::updateOrCreate(
                ['sku' => $data['sku']],
                [
                    'category_id' => $category->id,
                    'supplier_id' => $supplier?->id,
                    'sku' => $data['sku'],
                    'name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'thumbnail' => $data['thumbnail'] ?? 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
                    'short_description' => $data['short_description'] ?? substr($data['description'] ?? '', 0, 150),
                    'description' => $data['description'] ?? '',
                    'attributes' => $data['attributes'] ?? [],
                    'original_price' => $originalPrice,
                    'price' => $sellingPrice,
                    'quantity' => $data['quantity'] ?? 100,
                    'reorder_point' => $data['reorder_point'] ?? 10,
                    'sold_count' => $data['sold_count'] ?? 0,
                    'view_count' => $data['view_count'] ?? 0,
                    'is_featured' => $data['is_featured'] ?? false,
                    'status' => 'published',
                    'warranty_months' => $data['warranty_months'] ?? 0,
                    'weight' => $data['weight'] ?? null,
                    'dimensions' => $data['dimensions'] ?? null,
                    'published_at' => Carbon::now()->subDays($data['published_days_ago'] ?? 7),
                ]
            );

            if (!empty($data['gallery'])) {
                foreach ($data['gallery'] as $index => $imageUrl) {
                    ProductImage::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'path' => $imageUrl,
                        ],
                        [
                            'is_primary' => $index === 0,
                            'position' => $index,
                        ]
                    );
                }
            }
        });
    }
}
