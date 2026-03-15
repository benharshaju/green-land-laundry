<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Orders
            'view orders', 'create orders', 'edit orders', 'delete orders',
            'update order status', 'view all orders',
            // Customers
            'view customers', 'create customers', 'edit customers', 'delete customers',
            // Services
            'view services', 'create services', 'edit services', 'delete services',
            // Invoices
            'view invoices', 'create invoices', 'delete invoices', 'download invoices',
            // Reports
            'view reports', 'export reports',
            // Settings
            'view settings', 'edit settings',
            // Developer
            'view logs', 'manage api keys', 'view system health', 'generate ai images',
            // WhatsApp
            'send whatsapp',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // Create roles
        $superAdmin = Role::findOrCreate('super-admin');
        $admin      = Role::findOrCreate('admin');
        $staff      = Role::findOrCreate('staff');
        $developer  = Role::findOrCreate('developer');

        // Admin permissions
        $admin->syncPermissions([
            'view orders', 'create orders', 'edit orders', 'delete orders',
            'update order status', 'view all orders',
            'view customers', 'create customers', 'edit customers', 'delete customers',
            'view services', 'create services', 'edit services', 'delete services',
            'view invoices', 'create invoices', 'delete invoices', 'download invoices',
            'view reports', 'export reports',
            'view settings', 'edit settings',
            'send whatsapp',
        ]);

        // Staff permissions
        $staff->syncPermissions([
            'view orders', 'edit orders', 'update order status',
            'view customers',
            'send whatsapp',
        ]);

        // Developer permissions
        $developer->syncPermissions([
            'view logs', 'manage api keys', 'view system health', 'generate ai images',
            'view orders', 'view customers', 'view services',
        ]);

        // Super admin gets everything
        $superAdmin->syncPermissions(Permission::all());
    }
}
