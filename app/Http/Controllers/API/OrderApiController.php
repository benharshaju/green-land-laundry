<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrderApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['customer', 'items.service'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id'        => 'required|exists:customers,id',
            'pickup_date'        => 'required|date',
            'items'              => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $order = Order::create([
            'customer_id' => $validated['customer_id'],
            'staff_id'    => auth()->id(),
            'pickup_date' => $validated['pickup_date'],
            'status'      => Order::STATUS_PENDING,
        ]);

        foreach ($validated['items'] as $item) {
            $service = \App\Models\Service::find($item['service_id']);
            $order->items()->create([
                'service_id'  => $service->id,
                'description' => $service->name,
                'quantity'    => $item['quantity'],
                'unit_price'  => $service->price,
            ]);
        }

        $order->calculateTotals();
        $order->save();

        return response()->json($order->load(['customer', 'items']), 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['customer', 'items.service']));
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $order->update($request->only(['pickup_date', 'delivery_date', 'notes']));
        return response()->json($order->fresh());
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted.']);
    }

    public function tracking(Order $order): JsonResponse
    {
        return response()->json([
            'order_number' => $order->order_number,
            'status'       => $order->status,
            'customer'     => $order->customer->name,
            'total'        => 'BD ' . number_format($order->total, 3),
            'pickup_date'  => $order->pickup_date?->toISOString(),
            'updated_at'   => $order->updated_at->toISOString(),
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate(['status' => 'required|in:' . implode(',', Order::STATUSES)]);
        $order->update(['status' => $request->status]);
        return response()->json($order->fresh());
    }
}
