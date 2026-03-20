<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Machine extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'machine_id',
        'type',
        'status',
        'model_name',
        'capacity_kg',
        'current_temperature',
        'target_temperature',
        'current_program',
        'cycle_duration_minutes',
        'cycle_started_at',
        'cycle_ends_at',
        'cycle_progress',
        'current_order_id',
        'api_endpoint',
        'api_key',
        'supported_programs',
        'last_telemetry',
        'last_ping_at',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'cycle_started_at'   => 'datetime',
        'cycle_ends_at'      => 'datetime',
        'last_ping_at'       => 'datetime',
        'supported_programs' => 'array',
        'last_telemetry'     => 'array',
        'is_active'          => 'boolean',
        'capacity_kg'        => 'integer',
        'cycle_progress'     => 'integer',
    ];

    protected $hidden = ['api_key', 'api_endpoint'];

    const TYPE_WASHER  = 'washer';
    const TYPE_DRYER   = 'dryer';
    const TYPE_IRONER  = 'ironer';

    const TYPES = [
        self::TYPE_WASHER => 'Washer',
        self::TYPE_DRYER  => 'Dryer',
        self::TYPE_IRONER => 'Ironer',
    ];

    const STATUS_IDLE        = 'idle';
    const STATUS_RUNNING     = 'running';
    const STATUS_PAUSED      = 'paused';
    const STATUS_ERROR       = 'error';
    const STATUS_OFFLINE     = 'offline';
    const STATUS_MAINTENANCE = 'maintenance';

    const STATUSES = [
        self::STATUS_IDLE,
        self::STATUS_RUNNING,
        self::STATUS_PAUSED,
        self::STATUS_ERROR,
        self::STATUS_OFFLINE,
        self::STATUS_MAINTENANCE,
    ];

    const WASHER_PROGRAMS = [
        'quick_wash'   => ['name' => 'Quick Wash',   'duration' => 30, 'temp' => 30],
        'normal_wash'  => ['name' => 'Normal Wash',   'duration' => 45, 'temp' => 40],
        'heavy_wash'   => ['name' => 'Heavy Wash',    'duration' => 60, 'temp' => 60],
        'delicate'     => ['name' => 'Delicate',      'duration' => 40, 'temp' => 30],
        'whites'       => ['name' => 'Whites',        'duration' => 55, 'temp' => 90],
        'colors'       => ['name' => 'Colors',        'duration' => 50, 'temp' => 40],
    ];

    const DRYER_PROGRAMS = [
        'low_heat'     => ['name' => 'Low Heat',     'duration' => 40, 'temp' => 40],
        'medium_heat'  => ['name' => 'Medium Heat',  'duration' => 35, 'temp' => 55],
        'high_heat'    => ['name' => 'High Heat',    'duration' => 30, 'temp' => 70],
        'air_dry'      => ['name' => 'Air Dry',      'duration' => 60, 'temp' => 25],
    ];

    const IRONER_PROGRAMS = [
        'cotton'       => ['name' => 'Cotton',       'duration' => 20, 'temp' => 200],
        'synthetic'    => ['name' => 'Synthetic',     'duration' => 15, 'temp' => 150],
        'silk'         => ['name' => 'Silk',          'duration' => 10, 'temp' => 110],
        'linen'        => ['name' => 'Linen',         'duration' => 25, 'temp' => 220],
    ];

    public function currentOrder()
    {
        return $this->belongsTo(Order::class, 'current_order_id');
    }

    public function logs()
    {
        return $this->hasMany(MachineLog::class)->latest();
    }

    public function getPrograms(): array
    {
        if ($this->supported_programs) {
            return $this->supported_programs;
        }

        return match ($this->type) {
            self::TYPE_WASHER => self::WASHER_PROGRAMS,
            self::TYPE_DRYER  => self::DRYER_PROGRAMS,
            self::TYPE_IRONER => self::IRONER_PROGRAMS,
            default           => [],
        };
    }

    public function isOnline(): bool
    {
        return !in_array($this->status, [self::STATUS_OFFLINE, self::STATUS_MAINTENANCE]);
    }

    public function isRunning(): bool
    {
        return $this->status === self::STATUS_RUNNING;
    }

    public function getRemainingMinutesAttribute(): ?int
    {
        if (!$this->cycle_ends_at || !$this->isRunning()) {
            return null;
        }

        return max(0, (int) now()->diffInMinutes($this->cycle_ends_at, false));
    }
}
