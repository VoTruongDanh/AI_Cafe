<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Thêm indexes để tối ưu query performance
     */
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            // ✅ Index cho các cột thường query (chỉ thêm nếu chưa có)
            if (!$this->indexExists('products', 'idx_products_status')) {
                $table->index('status', 'idx_products_status');
            }
            if (!$this->indexExists('products', 'idx_products_featured')) {
                $table->index('is_featured', 'idx_products_featured');
            }
            if (!$this->indexExists('products', 'idx_products_sold')) {
                $table->index('sold_count', 'idx_products_sold');
            }
            if (!$this->indexExists('products', 'idx_products_views')) {
                $table->index('view_count', 'idx_products_views');
            }
            if (!$this->indexExists('products', 'idx_products_created')) {
                $table->index('created_at', 'idx_products_created');
            }
            if (!$this->indexExists('products', 'idx_products_published')) {
                $table->index('published_at', 'idx_products_published');
            }
            
            // ✅ Composite index cho filter + sort
            if (!$this->indexExists('products', 'idx_products_cat_status')) {
                $table->index(['category_id', 'status'], 'idx_products_cat_status');
            }
            if (!$this->indexExists('products', 'idx_products_status_featured')) {
                $table->index(['status', 'is_featured'], 'idx_products_status_featured');
            }
            if (!$this->indexExists('products', 'idx_products_status_sold')) {
                $table->index(['status', 'sold_count'], 'idx_products_status_sold');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            // ✅ Index cho orders
            if (!$this->indexExists('orders', 'idx_orders_status')) {
                $table->index('status', 'idx_orders_status');
            }
            if (!$this->indexExists('orders', 'idx_orders_payment_status')) {
                $table->index('payment_status', 'idx_orders_payment_status');
            }
            if (!$this->indexExists('orders', 'idx_orders_created')) {
                $table->index('created_at', 'idx_orders_created');
            }
            
            // ✅ Composite index
            if (!$this->indexExists('orders', 'idx_orders_user_status')) {
                $table->index(['user_id', 'status'], 'idx_orders_user_status');
            }
            if (!$this->indexExists('orders', 'idx_orders_status_created')) {
                $table->index(['status', 'created_at'], 'idx_orders_status_created');
            }
        });

        Schema::table('promotions', function (Blueprint $table) {
            // ✅ Index cho promotions
            if (!$this->indexExists('promotions', 'idx_promotions_active')) {
                $table->index('is_active', 'idx_promotions_active');
            }
            if (!$this->indexExists('promotions', 'idx_promotions_starts')) {
                $table->index('starts_at', 'idx_promotions_starts');
            }
            if (!$this->indexExists('promotions', 'idx_promotions_ends')) {
                $table->index('ends_at', 'idx_promotions_ends');
            }
            
            // ✅ Composite index cho active promotions
            if (!$this->indexExists('promotions', 'idx_promotions_active_dates')) {
                $table->index(['is_active', 'starts_at', 'ends_at'], 'idx_promotions_active_dates');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            // ✅ Index cho categories
            if (!$this->indexExists('categories', 'idx_categories_active')) {
                $table->index('is_active', 'idx_categories_active');
            }
            if (!$this->indexExists('categories', 'idx_categories_position')) {
                $table->index('position', 'idx_categories_position');
            }
        });

        Schema::table('wishlists', function (Blueprint $table) {
            // ✅ Composite index
            if (!$this->indexExists('wishlists', 'idx_wishlists_user_product')) {
                $table->index(['user_id', 'product_id'], 'idx_wishlists_user_product');
            }
        });

        Schema::table('recently_viewed', function (Blueprint $table) {
            // ✅ Index cho recently viewed
            if (!$this->indexExists('recently_viewed', 'idx_recently_viewed_viewed')) {
                $table->index('viewed_at', 'idx_recently_viewed_viewed');
            }
        });
    }

    /**
     * Helper function to check if index exists
     */
    private function indexExists($table, $index)
    {
        $connection = \DB::connection();
        $database = $connection->getDatabaseName();
        
        $result = $connection->select(
            "SELECT COUNT(*) as count FROM information_schema.statistics 
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$database, $table, $index]
        );
        
        return $result[0]->count > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            if ($this->indexExists('products', 'idx_products_status')) {
                $table->dropIndex('idx_products_status');
            }
            if ($this->indexExists('products', 'idx_products_featured')) {
                $table->dropIndex('idx_products_featured');
            }
            if ($this->indexExists('products', 'idx_products_sold')) {
                $table->dropIndex('idx_products_sold');
            }
            if ($this->indexExists('products', 'idx_products_views')) {
                $table->dropIndex('idx_products_views');
            }
            if ($this->indexExists('products', 'idx_products_created')) {
                $table->dropIndex('idx_products_created');
            }
            if ($this->indexExists('products', 'idx_products_published')) {
                $table->dropIndex('idx_products_published');
            }
            if ($this->indexExists('products', 'idx_products_cat_status')) {
                $table->dropIndex('idx_products_cat_status');
            }
            if ($this->indexExists('products', 'idx_products_status_featured')) {
                $table->dropIndex('idx_products_status_featured');
            }
            if ($this->indexExists('products', 'idx_products_status_sold')) {
                $table->dropIndex('idx_products_status_sold');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if ($this->indexExists('orders', 'idx_orders_status')) {
                $table->dropIndex('idx_orders_status');
            }
            if ($this->indexExists('orders', 'idx_orders_payment_status')) {
                $table->dropIndex('idx_orders_payment_status');
            }
            if ($this->indexExists('orders', 'idx_orders_created')) {
                $table->dropIndex('idx_orders_created');
            }
            if ($this->indexExists('orders', 'idx_orders_user_status')) {
                $table->dropIndex('idx_orders_user_status');
            }
            if ($this->indexExists('orders', 'idx_orders_status_created')) {
                $table->dropIndex('idx_orders_status_created');
            }
        });

        Schema::table('promotions', function (Blueprint $table) {
            if ($this->indexExists('promotions', 'idx_promotions_active')) {
                $table->dropIndex('idx_promotions_active');
            }
            if ($this->indexExists('promotions', 'idx_promotions_starts')) {
                $table->dropIndex('idx_promotions_starts');
            }
            if ($this->indexExists('promotions', 'idx_promotions_ends')) {
                $table->dropIndex('idx_promotions_ends');
            }
            if ($this->indexExists('promotions', 'idx_promotions_active_dates')) {
                $table->dropIndex('idx_promotions_active_dates');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if ($this->indexExists('categories', 'idx_categories_active')) {
                $table->dropIndex('idx_categories_active');
            }
            if ($this->indexExists('categories', 'idx_categories_position')) {
                $table->dropIndex('idx_categories_position');
            }
        });

        Schema::table('wishlists', function (Blueprint $table) {
            if ($this->indexExists('wishlists', 'idx_wishlists_user_product')) {
                $table->dropIndex('idx_wishlists_user_product');
            }
        });

        Schema::table('recently_viewed', function (Blueprint $table) {
            if ($this->indexExists('recently_viewed', 'idx_recently_viewed_viewed')) {
                $table->dropIndex('idx_recently_viewed_viewed');
            }
        });
    }
};
