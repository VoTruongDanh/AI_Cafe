<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('shipping_address_line')->nullable();
            $table->string('shipping_city')->nullable();
            $table->string('shipping_ward')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed, processing, shipped, delivered, completed, returned, cancelled
            $table->string('payment_status')->default('unpaid'); // unpaid, pending, paid, refunded
            $table->foreignId('payment_method_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('promotion_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('tax_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('channel')->default('online');
            $table->timestamp('placed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            // Bank transfer fields
            $table->text('qr_code_url')->nullable();
            $table->string('transfer_content')->nullable();
            $table->timestamp('transfer_confirmed_at')->nullable();
            $table->text('transfer_note')->nullable();
            // MoMo fields
            $table->text('momo_qr_url')->nullable();
            $table->string('momo_transfer_content', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('orders');
    }
};
