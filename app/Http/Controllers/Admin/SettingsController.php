<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = [
            'app_name'   => config('app.name'),
            'vat_rate'   => config('app.vat_rate', 0.10),
            'currency'   => config('app.currency', 'BHD'),
            'app_url'    => config('app.url'),
        ];

        return view('admin.settings.index', compact('settings'));
    }

    public function update(Request $request)
    {
        // In production, update .env or a settings table
        return back()->with('success', 'Settings saved.');
    }
}
