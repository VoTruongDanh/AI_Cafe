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
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('transaction_code')->unique();
            $table->string('bank_name');
            $table->string('account_name');
            $table->string('account_number');
            $table->decimal('amount', 12, 2);
            $table->string('content'); // Nội dung chuyển khoản (mã đơn hàng)
            $table->text('qr_code_data')->nullable(); // Dữ liệu QR code
            $table->string('qr_code_image_path')->nullable(); // Đường dẫn file QR code image
            $table->string('status')->default('pending'); // pending, paid, expired, cancelled
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->text('bank_transaction_reference')->nullable(); // Mã giao dịch từ ngân hàng
            $table->json('metadata')->nullable(); // Thông tin bổ sung
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('bank_transactions');
    }
};

