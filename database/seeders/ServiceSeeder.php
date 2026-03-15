<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            // Wash & Fold (BHD pricing)
            ['name' => 'Wash & Fold', 'name_arabic' => 'غسيل وطي', 'category' => 'wash_fold', 'price' => 0.500, 'unit' => 'kg', 'sort_order' => 1],
            ['name' => 'Wash & Iron', 'name_arabic' => 'غسيل وكوي', 'category' => 'wash_iron', 'price' => 0.800, 'unit' => 'piece', 'sort_order' => 2],

            // Ironing
            ['name' => 'Shirt Ironing', 'name_arabic' => 'كوي قميص', 'category' => 'iron', 'price' => 0.300, 'unit' => 'piece', 'sort_order' => 3],
            ['name' => 'Trouser Ironing', 'name_arabic' => 'كوي بنطلون', 'category' => 'iron', 'price' => 0.350, 'unit' => 'piece', 'sort_order' => 4],
            ['name' => 'Thobe Ironing', 'name_arabic' => 'كوي ثوب', 'category' => 'iron', 'price' => 0.500, 'unit' => 'piece', 'sort_order' => 5],
            ['name' => 'Abaya Ironing', 'name_arabic' => 'كوي عباية', 'category' => 'iron', 'price' => 0.600, 'unit' => 'piece', 'sort_order' => 6],

            // Dry Cleaning
            ['name' => 'Suit Dry Clean', 'name_arabic' => 'تنظيف جاف بدلة', 'category' => 'dry_clean', 'price' => 3.000, 'unit' => 'piece', 'sort_order' => 7],
            ['name' => 'Dress Dry Clean', 'name_arabic' => 'تنظيف جاف فستان', 'category' => 'dry_clean', 'price' => 2.500, 'unit' => 'piece', 'sort_order' => 8],
            ['name' => 'Coat Dry Clean', 'name_arabic' => 'تنظيف جاف معطف', 'category' => 'dry_clean', 'price' => 3.500, 'unit' => 'piece', 'sort_order' => 9],
            ['name' => 'Blanket Dry Clean', 'name_arabic' => 'تنظيف جاف بطانية', 'category' => 'dry_clean', 'price' => 4.000, 'unit' => 'piece', 'sort_order' => 10],

            // Specialty
            ['name' => 'Wedding Dress', 'name_arabic' => 'فستان زفاف', 'category' => 'specialty', 'price' => 15.000, 'unit' => 'piece', 'sort_order' => 11],
            ['name' => 'Curtain Wash', 'name_arabic' => 'غسيل ستائر', 'category' => 'specialty', 'price' => 2.000, 'unit' => 'set', 'sort_order' => 12],
            ['name' => 'Carpet Cleaning', 'name_arabic' => 'تنظيف سجادة', 'category' => 'specialty', 'price' => 3.000, 'unit' => 'sqm', 'sort_order' => 13],

            // Express (24hr)
            ['name' => 'Express Wash & Fold', 'name_arabic' => 'غسيل سريع', 'category' => 'express', 'price' => 0.750, 'price_express' => 1.000, 'unit' => 'kg', 'sort_order' => 14],
            ['name' => 'Express Dry Clean', 'name_arabic' => 'تنظيف جاف سريع', 'category' => 'express', 'price' => 4.000, 'price_express' => 5.000, 'unit' => 'piece', 'sort_order' => 15],
        ];

        foreach ($services as $service) {
            Service::firstOrCreate(
                ['name' => $service['name']],
                array_merge($service, ['is_active' => true])
            );
        }
    }
}
