<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Order;

class DashboardController extends Controller
{
    public function index()
    {
        $myOrders = Order::where('staff_id', auth()->id())
            ->whereNotIn('status', [Order::STATUS_DELIVERED, Order::STATUS_CANCELLED])
            ->with('customer')
            ->latest()
            ->get();

        $pendingOrders = Order::whereIn('status', [Order::STATUS_PENDING, Order::STATUS_RECEIVED])
            ->with('customer')
            ->latest()
            ->limit(10)
            ->get();

        $readyOrders = Order::where('status', Order::STATUS_READY)
            ->with('customer')
            ->latest()
            ->get();

        $stats = [
            'my_active'    => $myOrders->count(),
            'pending'      => Order::where('status', Order::STATUS_PENDING)->count(),
            'ready'        => Order::where('status', Order::STATUS_READY)->count(),
            'completed_today' => Order::whereDate('updated_at', today())
                ->where('status', Order::STATUS_DELIVERED)
                ->where('staff_id', auth()->id())
                ->count(),
        ];

        return view('staff.dashboard', compact('myOrders', 'pendingOrders', 'readyOrders', 'stats'));
    }
}
