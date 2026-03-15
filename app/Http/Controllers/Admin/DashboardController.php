<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'orders_today'     => Order::whereDate('created_at', today())->count(),
            'orders_pending'   => Order::whereIn('status', ['pending', 'received', 'washing', 'drying', 'ironing'])->count(),
            'orders_ready'     => Order::where('status', Order::STATUS_READY)->count(),
            'revenue_today'    => Order::whereDate('created_at', today())->where('status', Order::STATUS_DELIVERED)->sum('total'),
            'revenue_month'    => Order::whereMonth('created_at', now()->month)->where('status', Order::STATUS_DELIVERED)->sum('total'),
            'customers_total'  => Customer::count(),
            'customers_new'    => Customer::whereMonth('created_at', now()->month)->count(),
            'vat_collected'    => Order::whereMonth('created_at', now()->month)->where('status', Order::STATUS_DELIVERED)->sum('vat_amount'),
        ];

        $recentOrders = Order::with(['customer', 'items'])
            ->latest()
            ->limit(10)
            ->get();

        $revenueChart = $this->getRevenueChartData();

        return view('admin.dashboard', compact('stats', 'recentOrders', 'revenueChart'));
    }

    private function getRevenueChartData(): array
    {
        return Order::where('status', Order::STATUS_DELIVERED)
            ->where('created_at', '>=', now()->subDays(30))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('SUM(vat_amount) as vat'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }
}
