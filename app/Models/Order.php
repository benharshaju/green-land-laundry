<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'customer_id',
        'staff_id',
        'status',
        'pickup_date',
        'delivery_date',
        'subtotal',
        'vat_amount',
        'vat_rate',
        'total',
        'currency',
        'notes',
        'qr_code',
        'whatsapp_sent_at',
        'paid_at',
        'payment_method',
    ];

    protected $casts = [
        'pickup_date'      => 'datetime',
        'delivery_date'    => 'datetime',
        'whatsapp_sent_at' => 'datetime',
        'paid_at'          => 'datetime',
        'subtotal'         => 'decimal:3',
        'vat_amount'       => 'decimal:3',
        'vat_rate'         => 'decimal:4',
        'total'            => 'decimal:3',
    ];

    const STATUS_PENDING    = 'pending';
    const STATUS_RECEIVED   = 'received';
    const STATUS_WASHING    = 'washing';
    const STATUS_DRYING     = 'drying';
    const STATUS_IRONING    = 'ironing';
    const STATUS_READY      = 'ready';
    const STATUS_DELIVERED  = 'delivered';
    const STATUS_CANCELLED  = 'cancelled';

    const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_RECEIVED,
        self::STATUS_WASHING,
        self::STATUS_DRYING,
        self::STATUS_IRONING,
        self::STATUS_READY,
        self::STATUS_DELIVERED,
        self::STATUS_CANCELLED,
    ];

    // Default VAT rate for Bahrain (10%)
    const VAT_RATE = 0.10;
    const CURRENCY = 'BHD';

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->order_number)) {
                $order->order_number = 'GLL-' . date('Ymd') . '-' . str_pad(
                    (self::whereDate('created_at', today())->count() + 1),
                    4,
                    '0',
                    STR_PAD_LEFT
                );
            }
            $order->vat_rate = $order->vat_rate ?? self::VAT_RATE;
            $order->currency = $order->currency ?? self::CURRENCY;
        });
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function machines()
    {
        return $this->hasMany(Machine::class, 'current_order_id');
    }

    public function calculateTotals(): void
    {
        $subtotal = $this->items->sum(fn($item) => $item->quantity * $item->unit_price);
        $vatAmount = round($subtotal * $this->vat_rate, 3);

        $this->subtotal   = $subtotal;
        $this->vat_amount = $vatAmount;
        $this->total      = $subtotal + $vatAmount;
    }

    public function getFormattedTotalAttribute(): string
    {
        return 'BD ' . number_format($this->total, 3);
    }

    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }
}
