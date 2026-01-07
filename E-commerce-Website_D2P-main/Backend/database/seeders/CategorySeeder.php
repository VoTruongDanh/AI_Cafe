<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $groups = [
            [
                'name' => 'Món nước',
                'slug' => 'drinks',
                'description' => 'Các loại đồ uống tại quán cà phê.',
                'position' => 1,
                'children' => [
                    [
                        'name' => 'Cà phê',
                        'slug' => 'coffee',
                        'description' => 'Cà phê đen, cà phê sữa, cà phê phin, espresso, cappuccino, latte.',
                        'position' => 1,
                    ],
                    [
                        'name' => 'Trà',
                        'slug' => 'tea',
                        'description' => 'Trà đen, trà xanh, trà thảo mộc, trà sữa.',
                        'position' => 2,
                    ],
                    [
                        'name' => 'Nước ép & Sinh tố',
                        'slug' => 'juice-smoothie',
                        'description' => 'Nước ép trái cây tươi, sinh tố, smoothie.',
                        'position' => 3,
                    ],
                    [
                        'name' => 'Nước ngọt & Nước có ga',
                        'slug' => 'soft-drinks',
                        'description' => 'Coca Cola, Pepsi, 7Up, nước ngọt các loại.',
                        'position' => 4,
                    ],
                    [
                        'name' => 'Đồ uống đặc biệt',
                        'slug' => 'special-drinks',
                        'description' => 'Mocktail, cocktail không cồn, đồ uống theo mùa.',
                        'position' => 5,
                    ],
                ],
            ],
            [
                'name' => 'Món ăn',
                'slug' => 'food',
                'description' => 'Các món ăn vặt và món chính tại quán cà phê.',
                'position' => 2,
                'children' => [
                    [
                        'name' => 'Bánh ngọt',
                        'slug' => 'cakes',
                        'description' => 'Bánh kem, bánh mousse, cheesecake, tiramisu.',
                        'position' => 1,
                    ],
                    [
                        'name' => 'Bánh mặn',
                        'slug' => 'savory-cakes',
                        'description' => 'Bánh mì sandwich, bánh mì nướng, croissant.',
                        'position' => 2,
                    ],
            [
                        'name' => 'Món ăn nhanh',
                        'slug' => 'fast-food',
                        'description' => 'Khoai tây chiên, gà rán, burger, hot dog.',
                'position' => 3,
                    ],
                    [
                        'name' => 'Món chính',
                        'slug' => 'main-dishes',
                        'description' => 'Cơm, mì, phở, bún, pasta.',
                        'position' => 4,
                    ],
                    [
                        'name' => 'Snack & Đồ ăn vặt',
                        'slug' => 'snacks',
                        'description' => 'Bánh quy, hạt, snack các loại.',
                        'position' => 5,
                    ],
                ],
            ],
        ];

        foreach ($groups as $groupIndex => $group) {
            $parent = Category::updateOrCreate(
                ['slug' => Str::slug($group['slug'])],
                [
                    'name' => $group['name'],
                    'slug' => Str::slug($group['slug']),
                    'description' => $group['description'] ?? null,
                    'parent_id' => null,
                    'is_active' => true,
                    'position' => $group['position'] ?? ($groupIndex + 1),
                ]
            );

            foreach ($group['children'] as $childIndex => $child) {
                Category::updateOrCreate(
                    ['slug' => Str::slug($child['slug'])],
                    [
                        'name' => $child['name'],
                        'slug' => Str::slug($child['slug']),
                        'description' => $child['description'] ?? null,
                        'parent_id' => $parent->id,
                        'is_active' => true,
                        'position' => $child['position'] ?? ($childIndex + 1),
                    ]
                );
            }
        }

        $standaloneCategories = [
            [
                'name' => 'Combo',
                'slug' => 'combo',
                'description' => 'Combo đồ uống và món ăn với giá ưu đãi.',
                'position' => 10,
            ],
            [
                'name' => 'Đồ uống nóng',
                'slug' => 'hot-drinks',
                'description' => 'Cà phê nóng, trà nóng, sô cô la nóng.',
                'position' => 11,
            ],
        ];

        foreach ($standaloneCategories as $index => $category) {
            Category::updateOrCreate(
                ['slug' => Str::slug($category['slug'])],
                [
                    'name' => $category['name'],
                    'slug' => Str::slug($category['slug']),
                    'description' => $category['description'] ?? null,
                    'parent_id' => null,
                    'is_active' => true,
                    'position' => $category['position'] ?? ($index + 20),
                ]
            );
        }
    }
}
