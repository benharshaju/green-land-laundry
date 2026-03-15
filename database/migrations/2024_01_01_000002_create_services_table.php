<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_arabic')->nullable();
            $table->string('category');
            // BHD pricing (3 decimal places)
            $table->decimal('price', 10, 3);
            $table->decimal('price_express', 10, 3)->nullable();
            $table->string('unit')->default('piece'); // piece, kg, set
            $table->text('description')->nullable();
            $table->text('description_arabic')->nullable();
            $table->string('image_url')->nullable();
            $table->string('ai_image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
