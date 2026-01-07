<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->words(3, true);
        
        return [
            'category_id' => Category::inRandomOrder()->first()?->id ?? Category::factory(),
            'supplier_id' => Supplier::inRandomOrder()->first()?->id ?? Supplier::factory(),
            'sku' => 'SKU-' . strtoupper(Str::random(8)),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'thumbnail' => 'https://via.placeholder.com/300',
            'short_description' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'original_price' => $this->faker->numberBetween(1000000, 50000000),
            'price' => $this->faker->numberBetween(1000000, 50000000),
            'quantity' => $this->faker->numberBetween(0, 100),
            'reorder_point' => 10,
            'sold_count' => 0,
            'view_count' => 0,
            'is_featured' => false,
            'status' => 'published',
            'warranty_months' => 12,
            'published_at' => now(),
        ];
    }
}
