<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@greenlandlaundry.com'],
            [
                'name'      => 'Super Admin',
                'password'  => Hash::make('GreenLand@2024!'),
                'is_active' => true,
            ]
        );
        $superAdmin->assignRole('super-admin');

        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'manager@greenlandlaundry.com'],
            [
                'name'      => 'Branch Manager',
                'password'  => Hash::make('Manager@2024!'),
                'is_active' => true,
            ]
        );
        $admin->assignRole('admin');

        // Staff
        $staff = User::firstOrCreate(
            ['email' => 'staff@greenlandlaundry.com'],
            [
                'name'      => 'Staff Member',
                'password'  => Hash::make('Staff@2024!'),
                'is_active' => true,
            ]
        );
        $staff->assignRole('staff');

        // Developer
        $developer = User::firstOrCreate(
            ['email' => 'dev@greenlandlaundry.com'],
            [
                'name'      => 'Developer',
                'password'  => Hash::make('Dev@2024!'),
                'is_active' => true,
            ]
        );
        $developer->assignRole('developer');
    }
}
