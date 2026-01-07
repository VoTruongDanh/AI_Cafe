<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tạo bảng lưu trữ giao dịch MoMo
     */
    public function up(): void
    {
        Schema::create('momo_transactions', function (Blueprint $table) {
            $table->id();

            // Liên kết với đơn hàng
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');

            // Thông tin giao dịch MoMo
            $table->string('momo_order_id')->unique()->comment('Mã đơn hàng gửi đến MoMo');
            $table->string('request_id')->comment('Request ID gửi đến MoMo');
            $table->unsignedBigInteger('amount')->comment('Số tiền thanh toán (VND)');
            $table->string('order_info')->nullable()->comment('Thông tin đơn hàng');

            // URL thanh toán
            $table->text('pay_url')->nullable()->comment('URL thanh toán web');
            $table->text('qr_code_url')->nullable()->comment('URL mã QR');
            $table->text('deep_link')->nullable()->comment('Deep link mở app MoMo');

            // Kết quả thanh toán
            $table->string('trans_id')->nullable()->comment('Mã giao dịch MoMo');
            $table->string('pay_type')->nullable()->comment('Loại thanh toán (qr, webApp, credit, etc.)');
            $table->enum('status', ['pending', 'paid', 'failed', 'expired', 'cancelled'])->default('pending');
            $table->integer('result_code')->nullable()->comment('Mã kết quả từ MoMo');
            $table->text('response_data')->nullable()->comment('Dữ liệu response từ MoMo (JSON)');

            // Thời gian
            $table->timestamp('expires_at')->nullable()->comment('Thời gian hết hạn giao dịch');
            $table->timestamp('paid_at')->nullable()->comment('Thời gian thanh toán thành công');

            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index('expires_at');
            $table->index('trans_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('momo_transactions');
    }
};
