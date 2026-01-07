<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use OpenApi\Annotations as OA;

/**
 * @OA\Schema(
 *     schema="Category",
 *     type="object",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Điện thoại"),
 *     @OA\Property(property="slug", type="string", example="dien-thoai"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="parent_id", type="integer", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="position", type="integer", example=1),
 *     @OA\Property(property="created_at", type="string", format="date-time", nullable=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="CategoryStoreRequest",
 *     type="object",
 *     required={"name"},
 *     @OA\Property(property="name", type="string", example="Điện thoại"),
 *     @OA\Property(property="slug", type="string", nullable=true),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="parent_id", type="integer", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="position", type="integer", nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="CategoryUpdateRequest",
 *     type="object",
 *     @OA\Property(property="name", type="string", example="Điện thoại"),
 *     @OA\Property(property="slug", type="string", nullable=true),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="parent_id", type="integer", nullable=true),
 *     @OA\Property(property="is_active", type="boolean", example=true),
 *     @OA\Property(property="position", type="integer", nullable=true)
 * )
 */
class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'is_active',
        'position',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'position' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get total products count including children categories
     * 
     * @return int
     */
    public function getTotalProductsCountAttribute()
    {
        // Count products in this category
        $count = $this->products()->count();
        
        // Add products from all children categories
        if ($this->children()->exists()) {
            foreach ($this->children as $child) {
                $count += $child->total_products_count;
            }
        }
        
        return $count;
    }

    /**
     * Scope to load products count including children
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithTotalProductsCount($query)
    {
        return $query->withCount('products')
            ->with(['children' => function ($q) {
                $q->withCount('products');
            }]);
    }
}
