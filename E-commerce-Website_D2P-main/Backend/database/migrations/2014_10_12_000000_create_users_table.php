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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('customer'); // admin, staff, customer
            $table->string('phone')->nullable();
            $table->string('address_line')->nullable();
            $table->string('ward')->nullable(); // Phường/Xã
            $table->string('city')->nullable(); // Tỉnh/Thành phố
            $table->string('postal_code')->nullable(); // Mã bưu điện
            $table->string('loyalty_tier')->default('bronze'); // bronze, silver, gold, vip
            $table->unsignedInteger('loyalty_points')->default(0); // Điểm tích lũy
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
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
        Schema::dropIfExists('users');
    }
};
