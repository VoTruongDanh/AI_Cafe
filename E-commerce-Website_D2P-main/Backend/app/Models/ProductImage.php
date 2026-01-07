<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'product_id',
        'path',
        'is_primary',
        'position',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'position' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
