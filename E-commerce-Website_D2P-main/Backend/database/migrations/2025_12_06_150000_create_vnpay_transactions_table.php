<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tạo bảng lưu trữ giao dịch VNPay
     */
    public function up(): void
    {
        Schema::create('vnpay_transactions', function (Blueprint $table) {
            $table->id();

            // Liên kết với đơn hàng
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');

            // Thông tin giao dịch VNPay
            $table->string('txn_ref')->unique()->comment('Mã tham chiếu giao dịch (OrderCode_Timestamp)');
            $table->decimal('amount', 15, 2)->comment('Số tiền thanh toán (VND)');
            $table->string('order_info')->nullable()->comment('Thông tin đơn hàng');

            // Kết quả từ VNPay
            $table->string('vnp_transaction_no')->nullable()->comment('Mã giao dịch tại VNPay');
            $table->string('vnp_response_code')->nullable()->comment('Mã phản hồi từ VNPay (00=thành công)');
            $table->string('bank_code')->nullable()->comment('Mã ngân hàng');
            $table->string('bank_tran_no')->nullable()->comment('Mã giao dịch tại ngân hàng');
            $table->string('card_type')->nullable()->comment('Loại thẻ (ATM, VISA, MASTER, JCB)');
            $table->string('pay_date')->nullable()->comment('Thời gian thanh toán (YYYYMMDDHHmmss)');

            // Trạng thái
            $table->enum('status', ['pending', 'success', 'failed', 'cancelled'])->default('pending');

            // Response data đầy đủ
            $table->json('response_data')->nullable()->comment('Dữ liệu response đầy đủ từ VNPay');

            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index('vnp_transaction_no');
            $table->index('vnp_response_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vnpay_transactions');
    }
};
