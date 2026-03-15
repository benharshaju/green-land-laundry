<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\OrderApiController;
use App\Http\Controllers\API\CustomerApiController;
use App\Http\Controllers\API\ServiceApiController;
use App\Http\Controllers\API\WebhookController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Version: v1
| Authentication: Laravel Sanctum
| Currency: BHD (Bahraini Dinar)
| VAT: 10%
*/

Route::prefix('v1')->group(function () {

    // Webhook endpoints (no auth required)
    Route::post('/webhooks/whatsapp', [WebhookController::class, 'whatsapp'])->name('webhooks.whatsapp');
    Route::post('/webhooks/payment', [WebhookController::class, 'payment'])->name('webhooks.payment');

    // Authenticated API routes
    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/user', function (Request $request) {
            return $request->user()->load('roles');
        });

        // Orders API
        Route::apiResource('orders', OrderApiController::class);
        Route::get('/orders/{order}/tracking', [OrderApiController::class, 'tracking']);
        Route::post('/orders/{order}/status', [OrderApiController::class, 'updateStatus']);

        // Customers API
        Route::apiResource('customers', CustomerApiController::class);
        Route::get('/customers/{customer}/orders', [CustomerApiController::class, 'orders']);

        // Services & Pricing API (BHD)
        Route::apiResource('services', ServiceApiController::class);
        Route::get('/pricing/calculate', [ServiceApiController::class, 'calculatePrice']);
    });
});
