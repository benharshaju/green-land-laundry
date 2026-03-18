<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Staff\DashboardController as StaffDashboard;
use App\Http\Controllers\Developer\DashboardController as DevDashboard;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Staff\OrderController as StaffOrderController;
use App\Http\Controllers\Auth\LoginController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

/*
|--------------------------------------------------------------------------
| Admin Portal Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:admin|super-admin'])->group(function () {
    Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');

    // Orders
    Route::resource('orders', OrderController::class);
    Route::post('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');
    Route::post('/orders/{order}/whatsapp', [OrderController::class, 'sendWhatsApp'])->name('orders.whatsapp');

    // Customers
    Route::resource('customers', CustomerController::class);

    // Services & Pricing (BHD)
    Route::resource('services', ServiceController::class);

    // Invoices with VAT (10%)
    Route::resource('invoices', InvoiceController::class);
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/revenue', [ReportController::class, 'revenue'])->name('reports.revenue');
    Route::get('/reports/orders', [ReportController::class, 'orders'])->name('reports.orders');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
});

/*
|--------------------------------------------------------------------------
| Staff Portal Routes
|--------------------------------------------------------------------------
*/
Route::prefix('staff')->name('staff.')->middleware(['auth', 'role:staff|admin|super-admin'])->group(function () {
    Route::get('/dashboard', [StaffDashboard::class, 'index'])->name('dashboard');
    Route::resource('orders', StaffOrderController::class)->only(['index', 'show', 'edit', 'update']);
    Route::post('/orders/{order}/scan', [StaffOrderController::class, 'scanQr'])->name('orders.scan');
    Route::post('/orders/{order}/complete', [StaffOrderController::class, 'markComplete'])->name('orders.complete');
});

/*
|--------------------------------------------------------------------------
| Developer Portal Routes
|--------------------------------------------------------------------------
*/
Route::prefix('developer')->name('developer.')->middleware(['auth', 'role:developer|super-admin'])->group(function () {
    Route::get('/dashboard', [DevDashboard::class, 'index'])->name('dashboard');
    Route::get('/logs', [DevDashboard::class, 'logs'])->name('logs');
    Route::get('/api-keys', [DevDashboard::class, 'apiKeys'])->name('api-keys');
    Route::post('/api-keys/regenerate', [DevDashboard::class, 'regenerateApiKey'])->name('api-keys.regenerate');
    Route::get('/system-health', [DevDashboard::class, 'systemHealth'])->name('system-health');
    Route::get('/ai-images', [DevDashboard::class, 'aiImages'])->name('ai-images');
    Route::post('/ai-images/generate', [DevDashboard::class, 'generateAiImage'])->name('ai-images.generate');
    Route::get('/n8n', [DevDashboard::class, 'n8nWorkflows'])->name('n8n');
    Route::post('/n8n/test', [DevDashboard::class, 'n8nTest'])->name('n8n.test');
});
