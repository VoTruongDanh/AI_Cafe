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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('cancel_reason')->nullable()->after('notes');
            $table->timestamp('cancelled_at')->nullable()->after('cancel_reason');
            $table->unsignedBigInteger('cancelled_by')->nullable()->after('cancelled_at');
            $table->boolean('refund_required')->default(false)->after('cancelled_by');
            $table->string('refund_status')->nullable()->after('refund_required'); // pending, completed, rejected
            $table->timestamp('refunded_at')->nullable()->after('refund_status');
            $table->string('refund_note')->nullable()->after('refunded_at');

            $table->foreign('cancelled_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['cancelled_by']);
            $table->dropColumn([
                'cancel_reason',
                'cancelled_at',
                'cancelled_by',
                'refund_required',
                'refund_status',
                'refunded_at',
                'refund_note'
            ]);
        });
    }
};
