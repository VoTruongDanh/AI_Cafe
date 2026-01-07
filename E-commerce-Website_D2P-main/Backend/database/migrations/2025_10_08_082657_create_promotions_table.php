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
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('promotion_type');
            $table->decimal('value', 12, 2);
            $table->decimal('max_discount_value', 12, 2)->nullable();
            $table->decimal('min_order_value', 12, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->json('applies_to')->nullable();
            $table->json('channels')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_stackable')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_flash_sale')->default(false);
            $table->enum('promotion_category', ['flash_sale', 'special_offer', 'coupon'])
                ->default('coupon')
                ->comment('flash_sale: Flash Sale, special_offer: Khuyến mãi đặc biệt, coupon: Mã giảm giá checkout');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
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
        Schema::dropIfExists('promotions');
    }
};
