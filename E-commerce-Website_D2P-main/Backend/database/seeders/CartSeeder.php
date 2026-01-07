<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CartSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = User::where('role', 'customer')->orderBy('id')->get();

        if ($customers->isEmpty()) {
            $customers = collect([
                User::factory()->create([
                    'role' => 'customer',
                    'is_active' => true,
                ]),
            ]);
        }

        $cartBlueprints = [
            [
                'user' => $customers->get(0),
                'status' => 'active',
                'promotion_code' => 'SUMMER10',
                'expires_at' => Carbon::now()->addDays(5)->setTime(22, 30),
                'items' => [
                    [
                        'sku' => 'TV-SAM-55AU7700',
                        'quantity' => 1,
                        'discount_amount' => 1199000,
                        'metadata' => [
                            'preferred_installation_date' => Carbon::now()->addDays(6)->toDateString(),
                            'services' => ['wall_mount', 'calibration'],
                        ],
                    ],
                    [
                        'sku' => 'LAP-ASU-A1505VA',
                        'quantity' => 1,
                        'discount_amount' => 899500,
                        'metadata' => [
                            'extended_warranty' => '2-year-premium',
                            'added_at' => Carbon::now()->subDays(1)->toIso8601String(),
                        ],
                    ],
                ],
            ],
            [
                'user' => $customers->get(1),
                'status' => 'active',
                'promotion_code' => 'SAVE500',
                'expires_at' => Carbon::now()->addDays(2)->setTime(20, 0),
                'items' => [
                    [
                        'sku' => 'REF-PAN-NRDZ601',
                        'quantity' => 1,
                        'discount_amount' => 300000,
                        'metadata' => [
                            'delivery_window' => 'Morning',
                            'notes' => 'Request haul-away of old fridge',
                        ],
                    ],
                    [
                        'sku' => 'WM-LG-FV1411S4P',
                        'quantity' => 1,
                        'discount_amount' => 200000,
                        'metadata' => [
                            'bundle' => 'Install kit included',
                        ],
                    ],
                ],
            ],
            [
                'user' => $customers->get(2) ?? $customers->first(),
                'status' => 'abandoned',
                'promotion_code' => null,
                'expires_at' => Carbon::now()->subHours(6),
                'items' => [
                    [
                        'sku' => 'TV-TCL-55P755',
                        'quantity' => 1,
                        'discount_amount' => 0,
                        'metadata' => [
                            'price_watch' => true,
                            'compare_with' => 'Competitor A',
                        ],
                    ],
                    [
                        'sku' => 'WM-AQU-DR110FT',
                        'quantity' => 1,
                        'discount_amount' => 0,
                        'metadata' => [
                            'note' => 'User asked about noise level',
                        ],
                    ],
                ],
            ],
        ];

        foreach ($cartBlueprints as $blueprint) {
            $user = $blueprint['user'];

            if (!$user) {
                continue;
            }

            $promotion = null;
            if (!empty($blueprint['promotion_code'])) {
                $promotion = Promotion::where('code', $blueprint['promotion_code'])->first();
            }

            $cart = Cart::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'status' => $blueprint['status'],
                ],
                [
                    'promotion_id' => $promotion?->id,
                    'expires_at' => $blueprint['expires_at'],
                ]
            );

            $subtotal = 0;
            $discountTotal = 0;
            $totalQuantity = 0;
            $productIds = [];

            foreach ($blueprint['items'] as $itemData) {
                $product = Product::where('sku', $itemData['sku'])->first();

                if (!$product) {
                    continue;
                }

                $quantity = (int) $itemData['quantity'];
                $unitPrice = (float) $product->price;
                $lineSubtotal = $unitPrice * $quantity;
                $discountAmount = (float) ($itemData['discount_amount'] ?? 0);
                $lineTotal = max($lineSubtotal - $discountAmount, 0);

                CartItem::updateOrCreate(
                    [
                        'cart_id' => $cart->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'discount_amount' => $discountAmount,
                        'line_total' => $lineTotal,
                        'metadata' => $itemData['metadata'] ?? null,
                    ]
                );

                $productIds[] = $product->id;
                $subtotal += $lineSubtotal;
                $discountTotal += $discountAmount;
                $totalQuantity += $quantity;
            }

            if (!empty($productIds)) {
                $cart->items()->whereNotIn('product_id', $productIds)->delete();
            }

            $grandTotal = max($subtotal - $discountTotal, 0);

            $cart->update([
                'total_quantity' => $totalQuantity,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'grand_total' => $grandTotal,
                'promotion_id' => $promotion?->id,
                'expires_at' => $blueprint['expires_at'],
            ]);
        }
    }
}
