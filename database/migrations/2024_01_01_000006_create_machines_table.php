<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('machine_id')->unique()->comment('Hardware/serial identifier');
            $table->enum('type', ['washer', 'dryer', 'ironer'])->default('washer');
            $table->enum('status', ['idle', 'running', 'paused', 'error', 'offline', 'maintenance'])->default('offline');
            $table->string('model_name')->nullable();
            $table->unsignedInteger('capacity_kg')->nullable();
            $table->unsignedInteger('current_temperature')->nullable();
            $table->unsignedInteger('target_temperature')->nullable();
            $table->string('current_program')->nullable();
            $table->unsignedInteger('cycle_duration_minutes')->nullable();
            $table->timestamp('cycle_started_at')->nullable();
            $table->timestamp('cycle_ends_at')->nullable();
            $table->unsignedInteger('cycle_progress')->default(0)->comment('0-100 percent');
            $table->foreignId('current_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('api_endpoint')->nullable()->comment('IoT device endpoint URL');
            $table->string('api_key')->nullable()->comment('Device auth token');
            $table->json('supported_programs')->nullable();
            $table->json('last_telemetry')->nullable();
            $table->timestamp('last_ping_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('machine_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('status_before')->nullable();
            $table->string('status_after')->nullable();
            $table->json('payload')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_logs');
        Schema::dropIfExists('machines');
    }
};
