<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'name_arabic',
        'phone',
        'whatsapp',
        'email',
        'address',
        'address_arabic',
        'area',
        'cpr_number',
        'loyalty_points',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'loyalty_points' => 'integer',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function getWhatsAppNumberAttribute(): string
    {
        $phone = $this->whatsapp ?? $this->phone;
        // Normalize Bahrain phone to E.164
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (!str_starts_with($phone, '973')) {
            $phone = '973' . $phone;
        }
        return '+' . $phone;
    }

    public function getTotalSpentAttribute(): float
    {
        return $this->orders()->where('status', Order::STATUS_DELIVERED)->sum('total');
    }
}
