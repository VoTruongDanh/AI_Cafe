<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OpenApi\Annotations as OA;
/**
 * @OA\Schema(
 *     schema="Product",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="category_id", type="integer", example=2),
 *     @OA\Property(property="supplier_id", type="integer", example=3),
 *     @OA\Property(property="sku", type="string", example="SKU-001"),
 *     @OA\Property(property="name", type="string", example="iPhone 15"),
 *     @OA\Property(property="slug", type="string", example="iphone-15"),
 *     @OA\Property(property="thumbnail", type="string", example="https://cdn.example.com/iphone.jpg"),
 *     @OA\Property(property="short_description", type="string"),
 *     @OA\Property(property="description", type="string"),
 *     @OA\Property(property="attributes", type="object"),
 *     @OA\Property(property="original_price", type="number", format="float"),
 *     @OA\Property(property="price", type="number", format="float"),
 *     @OA\Property(property="quantity", type="integer"),
 *     @OA\Property(property="status", type="string", example="published"),
 *     @OA\Property(property="is_featured", type="boolean"),
 *     @OA\Property(property="published_at", type="string", format="date-time", nullable=true)
 * )
 */
class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'supplier_id',
        'sku',
        'name',
        'slug',
        'thumbnail',
        'short_description',
        'description',
        'attributes',
        'original_price',
        'price',
        'quantity',
        'reorder_point',
        'sold_count',
        'view_count',
        'is_featured',
        'status',
        'warranty_months',
        'weight',
        'dimensions',
        'published_at',
    ];

    protected $casts = [
    'original_price' => 'float',
    'price' => 'float',
        'quantity' => 'integer',
        'reorder_point' => 'integer',
        'sold_count' => 'integer',
        'view_count' => 'integer',
        'is_featured' => 'boolean',
        'warranty_months' => 'integer',
    'weight' => 'float',
        'published_at' => 'datetime',
    ];

    // Only append when specifically requested to avoid performance issues
    // Use $product->append(['average_rating', 'total_reviews', 'rating_breakdown'])
    // protected $appends = [
    //     'average_rating',
    //     'total_reviews',
    //     'rating_breakdown',
    // ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'promotion_product')
            ->withPivot(['priority'])
            ->withTimestamps();
    }

    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function inventoryImportItems()
    {
        return $this->hasMany(InventoryImportItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    public function approvedReviews()
    {
        return $this->hasMany(ProductReview::class)->where('is_approved', true);
    }

    public function questions()
    {
        return $this->hasMany(ProductQuestion::class);
    }

    public function approvedQuestions()
    {
        return $this->hasMany(ProductQuestion::class)->where('is_approved', true);
    }

    public function warrantyItems()
    {
        return $this->hasMany(WarrantyItem::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'published')->where('quantity', '>', 0);
    }

    /**
     * Set the attributes value.
     * Converts string to array if needed, preserving original format
     */
    public function setAttributesAttribute($value)
    {
        if (is_string($value)) {
            // Store the string directly in JSON format to preserve original text
            $this->attributes['attributes'] = json_encode(['specs' => $value]);
        } elseif (is_array($value)) {
            $this->attributes['attributes'] = json_encode($value);
        } else {
            $this->attributes['attributes'] = null;
        }
    }

    /**
     * Get the attributes value.
     * Returns original string format
     */
    public function getAttributesAttribute($value)
    {
        if (!$value) {
            return null;
        }

        $decoded = json_decode($value, true);

        // If it's in the new format with 'specs' key, return the string
        if (is_array($decoded) && isset($decoded['specs'])) {
            return $decoded['specs'];
        }

        // For old format (array), convert back to string
        if (is_array($decoded)) {
            return implode("\n", $decoded);
        }

        return $value;
    }

    /**
     * Get average rating for the product
     */
    public function getAverageRatingAttribute()
    {
        return $this->approvedReviews()->avg('rating');
    }

    /**
     * Get total reviews count
     */
    public function getTotalReviewsAttribute()
    {
        return $this->approvedReviews()->count();
    }

    /**
     * Get rating breakdown
     */
    public function getRatingBreakdownAttribute()
    {
        $breakdown = [];
        for ($i = 5; $i >= 1; $i--) {
            $breakdown[$i] = $this->approvedReviews()->where('rating', $i)->count();
        }
        return $breakdown;
    }

    /**
     * Lấy khuyến mãi đang hoạt động cho sản phẩm (Flash Sale hoặc Khuyến mãi đặc biệt)
     * Không bao gồm Mã giảm giá (coupon) - mã này chỉ áp dụng khi checkout
     */
    public function getActivePromotionAttribute()
    {
        // Ưu tiên Flash Sale trước
        $flashSale = $this->promotions()
            ->where('is_active', true)
            ->where('promotion_category', 'flash_sale')
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('value')
            ->first();

        if ($flashSale) {
            return $flashSale;
        }

        // Nếu không có Flash Sale, kiểm tra Khuyến mãi đặc biệt
        $specialOffer = $this->promotions()
            ->where('is_active', true)
            ->where('promotion_category', 'special_offer')
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('value')
            ->first();

        return $specialOffer;
    }

    /**
     * Lấy khuyến mãi Flash Sale
     */
    public function getFlashSalePromotionAttribute()
    {
        return $this->promotions()
            ->where('is_active', true)
            ->where('promotion_category', 'flash_sale')
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('value')
            ->first();
    }

    /**
     * Lấy khuyến mãi đặc biệt (Special Offer)
     */
    public function getSpecialOfferPromotionAttribute()
    {
        return $this->promotions()
            ->where('is_active', true)
            ->where('promotion_category', 'special_offer')
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('value')
            ->first();
    }

    /**
     * Tính giá sau khuyến mãi (Flash Sale hoặc Khuyến mãi đặc biệt)
     * Lưu ý:
     * - price = giá bán (giá khách hàng trả)
     * - original_price = giá nhập (từ nhà cung cấp, dùng để tính lợi nhuận)
     */
    public function getEffectivePriceAttribute()
    {
        // Dùng price làm base (giá bán), không phải original_price (giá nhập)
        $basePrice = $this->price;
        $promotion = $this->active_promotion;

        if (!$promotion) {
            // Không có khuyến mãi → trả về giá bán hiện tại
            return $basePrice;
        }

        // Tính giá sau khuyến mãi
        if ($promotion->promotion_type === 'percentage') {
            $discount = $basePrice * ($promotion->value / 100);
            // Áp dụng giới hạn giảm tối đa
            if ($promotion->max_discount_value && $discount > $promotion->max_discount_value) {
                $discount = $promotion->max_discount_value;
            }
            return $basePrice - $discount;
        } else {
            // Giảm số tiền cố định
            return max(0, $basePrice - $promotion->value);
        }
    }

    /**
     * Kiểm tra sản phẩm có đang được khuyến mãi không
     */
    public function getHasActivePromotionAttribute()
    {
        return $this->active_promotion !== null;
    }

    /**
     * Kiểm tra sản phẩm có Flash Sale không
     */
    public function getIsFlashSaleAttribute()
    {
        return $this->flash_sale_promotion !== null;
    }

    /**
     * Kiểm tra sản phẩm có Khuyến mãi đặc biệt không
     */
    public function getIsSpecialOfferAttribute()
    {
        return $this->special_offer_promotion !== null;
    }

    /**
     * Lấy loại khuyến mãi đang áp dụng
     */
    public function getPromotionCategoryAttribute()
    {
        $promo = $this->active_promotion;
        return $promo ? $promo->promotion_category : null;
    }
}
