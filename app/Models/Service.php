<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_arabic',
        'category',
        'price',
        'price_express',
        'unit',
        'description',
        'description_arabic',
        'image_url',
        'ai_image_url',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price'         => 'decimal:3',
        'price_express' => 'decimal:3',
        'is_active'     => 'boolean',
        'sort_order'    => 'integer',
    ];

    // Service categories
    const CATEGORY_WASH_FOLD    = 'wash_fold';
    const CATEGORY_DRY_CLEAN    = 'dry_clean';
    const CATEGORY_IRON         = 'iron';
    const CATEGORY_WASH_IRON    = 'wash_iron';
    const CATEGORY_SPECIALTY    = 'specialty';
    const CATEGORY_EXPRESS      = 'express';

    const CATEGORIES = [
        self::CATEGORY_WASH_FOLD  => 'Wash & Fold',
        self::CATEGORY_DRY_CLEAN  => 'Dry Cleaning',
        self::CATEGORY_IRON       => 'Ironing',
        self::CATEGORY_WASH_IRON  => 'Wash & Iron',
        self::CATEGORY_SPECIALTY  => 'Specialty',
        self::CATEGORY_EXPRESS    => 'Express',
    ];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getFormattedPriceAttribute(): string
    {
        return 'BD ' . number_format($this->price, 3) . ' / ' . $this->unit;
    }
}
