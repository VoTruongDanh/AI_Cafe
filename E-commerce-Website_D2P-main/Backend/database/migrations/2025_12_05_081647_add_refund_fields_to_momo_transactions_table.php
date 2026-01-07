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
        Schema::table('momo_transactions', function (Blueprint $table) {
            $table->string('refund_trans_id')->nullable()->after('response_data')->comment('Mã giao dịch hoàn tiền từ MoMo');
            $table->timestamp('refunded_at')->nullable()->after('refund_trans_id')->comment('Thời điểm hoàn tiền');
            $table->text('refund_response')->nullable()->after('refunded_at')->comment('Response JSON từ API refund');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('momo_transactions', function (Blueprint $table) {
            $table->dropColumn(['refund_trans_id', 'refunded_at', 'refund_response']);
        });
    }
};
