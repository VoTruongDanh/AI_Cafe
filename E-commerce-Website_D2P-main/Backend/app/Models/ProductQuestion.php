<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'user_id',
        'question',
        'answer',
        'answered_by',
        'answered_at',
        'is_approved',
        'helpful_count',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'answered_at' => 'datetime',
        'helpful_count' => 'integer',
    ];

    protected $appends = ['user_name', 'admin_name'];

    /**
     * Get the product that owns the question.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user that asked the question.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin that answered the question.
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'answered_by');
    }

    /**
     * Get user name attribute
     */
    public function getUserNameAttribute()
    {
        return $this->user ? $this->user->name : 'Unknown';
    }

    /**
     * Get admin name attribute
     */
    public function getAdminNameAttribute()
    {
        return $this->admin ? $this->admin->name : null;
    }

    /**
     * Scope a query to only include approved questions.
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope a query to only include answered questions.
     */
    public function scopeAnswered($query)
    {
        return $query->whereNotNull('answer');
    }

    /**
     * Scope a query to only include unanswered questions.
     */
    public function scopeUnanswered($query)
    {
        return $query->whereNull('answer');
    }

    /**
     * Scope a query to only include questions for a specific product.
     */
    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }
}
