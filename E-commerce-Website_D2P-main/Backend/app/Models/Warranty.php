<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warranty extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_id',
        'order_item_id',
        'product_id',
        'user_id',
        'processed_by',
        'supplier_id',
        'code',
        'status',
        'result',
        'result_notes',
        'issued_at',
        'expires_at',
        'start_date',
        'warranty_months',
        'end_date',
        'notes',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_REPAIRED = 'repaired';
    const STATUS_WAITING_FOR_CUSTOMER = 'waiting_for_customer';
    const STATUS_COMPLETED = 'completed';
    const STATUS_DENIED = 'denied';
    const STATUS_CANCELLED = 'cancelled';

    // Result constants
    const RESULT_REPAIRED = 'repaired';
    const RESULT_REPLACED = 'replaced';
    const RESULT_REFUNDED = 'refunded';

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Check if warranty is still valid
     */
    public function isValid(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING, self::STATUS_REPAIRED, self::STATUS_WAITING_FOR_CUSTOMER])
            && $this->end_date
            && $this->end_date->isFuture();
    }

    /**
     * Calculate end_date based on start_date and warranty_months
     */
    public function calculateEndDate(): void
    {
        if ($this->start_date && $this->warranty_months) {
            $this->end_date = $this->start_date->copy()->addMonths($this->warranty_months);
        }
    }

    /**
     * Generate unique warranty code
     */
    public static function generateCode()
    {
        do {
            $code = 'WR-' . now()->format('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 6));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Boot method to auto-calculate end_date
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($warranty) {
            if ($warranty->start_date && $warranty->warranty_months && !$warranty->end_date) {
                $warranty->end_date = $warranty->start_date->copy()->addMonths($warranty->warranty_months);
            }
        });
    }
}

