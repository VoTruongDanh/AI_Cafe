<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tracking_number')->nullable()->after('status');
            $table->string('shipper_name')->nullable()->after('tracking_number');
            $table->string('shipper_phone')->nullable()->after('shipper_name');
            $table->timestamp('confirmed_at')->nullable()->after('shipper_phone');
            $table->timestamp('preparing_at')->nullable()->after('confirmed_at');
            $table->timestamp('shipped_at')->nullable()->after('preparing_at');
            $table->timestamp('delivered_at')->nullable()->after('shipped_at');
            $table->text('delivery_notes')->nullable()->after('delivered_at');
            
            $table->index('tracking_number');
        });

        // Create order tracking events table
        Schema::create('order_tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('status'); // confirmed, preparing, shipping, delivered, cancelled
            $table->text('description');
            $table->string('location')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_tracking_events');
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'tracking_number',
                'shipper_name',
                'shipper_phone',
                'confirmed_at',
                'preparing_at',
                'shipped_at',
                'delivered_at',
                'delivery_notes',
            ]);
        });
    }
};
