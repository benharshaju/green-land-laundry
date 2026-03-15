<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Service;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private WhatsAppService $whatsApp) {}

    public function index(Request $request)
    {
        $orders = Order::with(['customer', 'staff', 'items'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->whereHas('customer', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            }))
            ->when($request->date, fn($q) => $q->whereDate('created_at', $request->date))
            ->latest()
            ->paginate(20);

        return view('admin.orders.index', compact('orders'));
    }

    public function create()
    {
        $customers = Customer::where('is_active', true)->orderBy('name')->get();
        $services  = Service::where('is_active', true)->orderBy('sort_order')->get();
        return view('admin.orders.create', compact('customers', 'services'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'   => 'required|exists:customers,id',
            'pickup_date'   => 'required|date',
            'delivery_date' => 'nullable|date|after:pickup_date',
            'notes'         => 'nullable|string|max:1000',
            'items'         => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $order = Order::create([
            'customer_id'   => $validated['customer_id'],
            'staff_id'      => auth()->id(),
            'pickup_date'   => $validated['pickup_date'],
            'delivery_date' => $validated['delivery_date'] ?? null,
            'notes'         => $validated['notes'] ?? null,
            'status'        => Order::STATUS_PENDING,
        ]);

        foreach ($validated['items'] as $item) {
            $service = Service::findOrFail($item['service_id']);
            $order->items()->create([
                'service_id'  => $service->id,
                'description' => $service->name,
                'quantity'    => $item['quantity'],
                'unit_price'  => $service->price,
            ]);
        }

        $order->calculateTotals();
        $order->save();

        // Auto send WhatsApp confirmation
        $this->whatsApp->sendOrderConfirmation($order);
        $order->update(['whatsapp_sent_at' => now()]);

        return redirect()->route('admin.orders.show', $order)
            ->with('success', "Order #{$order->order_number} created successfully.");
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'staff', 'items.service', 'invoice']);
        return view('admin.orders.show', compact('order'));
    }

    public function edit(Order $order)
    {
        $customers = Customer::where('is_active', true)->orderBy('name')->get();
        $services  = Service::where('is_active', true)->orderBy('sort_order')->get();
        $order->load('items.service');
        return view('admin.orders.edit', compact('order', 'customers', 'services'));
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'pickup_date'   => 'required|date',
            'delivery_date' => 'nullable|date',
            'notes'         => 'nullable|string|max:1000',
        ]);

        $order->update($validated);

        return redirect()->route('admin.orders.show', $order)
            ->with('success', 'Order updated successfully.');
    }

    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:' . implode(',', Order::STATUSES),
        ]);

        $order->update(['status' => $request->status]);

        // Send WhatsApp notification for status change
        $this->whatsApp->sendStatusUpdate($order);

        if ($order->status === Order::STATUS_READY) {
            $this->whatsApp->sendReadyForPickup($order);
        }

        return back()->with('success', 'Order status updated.');
    }

    public function sendWhatsApp(Order $order)
    {
        $sent = $this->whatsApp->sendStatusUpdate($order);

        if ($sent) {
            $order->update(['whatsapp_sent_at' => now()]);
            return back()->with('success', 'WhatsApp message sent.');
        }

        return back()->with('error', 'Failed to send WhatsApp message.');
    }

    public function destroy(Order $order)
    {
        $order->delete();
        return redirect()->route('admin.orders.index')
            ->with('success', 'Order deleted.');
    }
}
