<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MachineLog extends Model
{
    protected $fillable = [
        'machine_id',
        'user_id',
        'order_id',
        'action',
        'status_before',
        'status_after',
        'payload',
        'message',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
