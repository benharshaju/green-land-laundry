<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private WhatsAppService $whatsApp) {}

    public function index()
    {
        $orders = Order::with('customer')
            ->whereNotIn('status', [Order::STATUS_DELIVERED, Order::STATUS_CANCELLED])
            ->latest()
            ->paginate(20);

        return view('staff.orders.index', compact('orders'));
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'items.service']);
        return view('staff.orders.show', compact('order'));
    }

    public function edit(Order $order)
    {
        return view('staff.orders.edit', compact('order'));
    }

    public function update(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:' . implode(',', Order::STATUSES),
        ]);

        $order->update(['status' => $request->status, 'staff_id' => auth()->id()]);
        $this->whatsApp->sendStatusUpdate($order);

        return back()->with('success', 'Order status updated.');
    }

    public function scanQr(Request $request, Order $order)
    {
        return response()->json([
            'order'    => $order->load('customer', 'items.service'),
            'customer' => $order->customer,
        ]);
    }

    public function markComplete(Order $order)
    {
        $order->update(['status' => Order::STATUS_DELIVERED, 'staff_id' => auth()->id()]);
        $this->whatsApp->sendStatusUpdate($order);

        return back()->with('success', 'Order marked as delivered.');
    }
}
