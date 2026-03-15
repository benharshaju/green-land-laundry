<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role_type',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
        'is_active'         => 'boolean',
        'password'          => 'hashed',
    ];

    // Portal access helpers
    public function isAdmin(): bool
    {
        return $this->hasRole(['admin', 'super-admin']);
    }

    public function isStaff(): bool
    {
        return $this->hasRole('staff');
    }

    public function isDeveloper(): bool
    {
        return $this->hasRole('developer');
    }

    public function getPortalRedirect(): string
    {
        if ($this->isAdmin()) return route('admin.dashboard');
        if ($this->isDeveloper()) return route('developer.dashboard');
        return route('staff.dashboard');
    }

    public function staffOrders()
    {
        return $this->hasMany(Order::class, 'staff_id');
    }
}
