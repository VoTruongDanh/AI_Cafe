<?php

namespace Database\Seeders;

use App\Models\InventoryImport;
use App\Models\InventoryImportItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class InventoryImportSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $products = Product::all();
        $suppliers = Supplier::all();

        if ($products->isEmpty() || $suppliers->isEmpty()) {
            $this->command->error('Cần có sản phẩm và nhà cung cấp trước!');
            return;
        }

        // Tạo 20 phiếu nhập kho trong 6 tháng gần nhất
        $importCount = 0;
        $now = Carbon::now();

        for ($i = 0; $i < 20; $i++) {
            $importCount++;
            $supplier = $suppliers->random();
            
            // Ngày nhập ngẫu nhiên trong 6 tháng
            $importDate = $now->copy()->subDays(rand(0, 180));
            
            // 90% completed, 10% draft/approved
            $statusRand = rand(1, 100);
            if ($statusRand <= 90) {
                $status = 'completed';
                $completedAt = $importDate->copy()->addHours(rand(2, 8));
            } else {
                $status = rand(0, 1) ? 'draft' : 'approved';
                $completedAt = null;
            }

            $import = InventoryImport::create([
                'code' => 'IMP-' . $importDate->format('Ymd') . '-' . str_pad($importCount, 4, '0', STR_PAD_LEFT),
                'supplier_id' => $supplier->id,
                'created_by' => $admin?->id,
                'approved_by' => $status !== 'draft' ? $admin?->id : null,
                'status' => $status,
                'reference_number' => 'PO-' . $importDate->format('Ym') . '-' . rand(1000, 9999),
                'expected_at' => $importDate,
                'completed_at' => $completedAt,
                'subtotal' => 0,
                'tax_total' => 0,
                'discount_total' => 0,
                'grand_total' => 0,
                'notes' => 'Nhập hàng đợt ' . $importCount,
                'created_at' => $importDate,
                'updated_at' => $importDate,
            ]);

            // Mỗi phiếu nhập 3-8 sản phẩm ngẫu nhiên
            $itemCount = rand(3, 8);
            $importProducts = $products->random(min($itemCount, $products->count()));
            $subtotal = 0;

            foreach ($importProducts as $product) {
                $quantity = rand(10, 50);
                $unitCost = $product->original_price ?? $product->price * 0.7;
                $lineTotal = $quantity * $unitCost;
                $subtotal += $lineTotal;

                InventoryImportItem::create([
                    'inventory_import_id' => $import->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                    'batch_number' => 'BATCH-' . $importDate->format('Ym') . '-' . rand(100, 999),
                    'manufactured_at' => $importDate->copy()->subMonths(rand(1, 3)),
                    'expires_at' => null,
                    'metadata' => ['import_batch' => $importCount],
                ]);

                // Cộng số lượng tồn nếu status = completed
                if ($status === 'completed') {
                    $product->increment('quantity', $quantity);
                }
            }

            $import->update([
                'subtotal' => $subtotal,
                'grand_total' => $subtotal,
            ]);

            $this->command->info("✓ Tạo phiếu nhập {$import->code} - {$itemCount} sản phẩm - " . number_format($subtotal) . " VNĐ");
        }

        $this->command->info("✓ Tổng cộng: {$importCount} phiếu nhập kho");
    }
}
