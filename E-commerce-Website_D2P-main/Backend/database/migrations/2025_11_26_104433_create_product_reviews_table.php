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
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('rating'); // 1-5 sao
            $table->string('title')->nullable();
            $table->text('comment');
            $table->boolean('is_verified_purchase')->default(false); // Đã mua hàng chưa
            $table->json('images')->nullable(); // Ảnh đính kèm
            $table->unsignedInteger('helpful_count')->default(0); // Số người thấy hữu ích
            $table->boolean('is_approved')->default(false); // Admin duyệt chưa
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index(['product_id', 'rating']);
            $table->index(['user_id']);
            $table->index(['is_approved']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('product_reviews');
    }
};
