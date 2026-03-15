<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('pickup_date')->nullable();
            $table->timestamp('delivery_date')->nullable();
            // BHD pricing with 3 decimal places
            $table->decimal('subtotal', 10, 3)->default(0);
            $table->decimal('vat_rate', 5, 4)->default(0.1000); // 10% VAT
            $table->decimal('vat_amount', 10, 3)->default(0);
            $table->decimal('total', 10, 3)->default(0);
            $table->string('currency', 3)->default('BHD');
            $table->text('notes')->nullable();
            $table->string('qr_code')->nullable();
            $table->timestamp('whatsapp_sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
