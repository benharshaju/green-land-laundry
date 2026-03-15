<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceApiController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Service::where('is_active', true)->orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'category' => 'required|string',
            'price'    => 'required|numeric|min:0',
            'unit'     => 'required|string|max:20',
        ]);

        return response()->json(Service::create($validated), 201);
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json($service);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $service->update($request->only(['name', 'category', 'price', 'price_express', 'unit', 'is_active']));
        return response()->json($service->fresh());
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();
        return response()->json(['message' => 'Service deleted.']);
    }

    public function calculatePrice(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $subtotal = 0;
        $lineItems = [];

        foreach ($request->items as $item) {
            $service  = Service::find($item['service_id']);
            $lineTotal = $service->price * $item['quantity'];
            $subtotal += $lineTotal;
            $lineItems[] = [
                'service'    => $service->name,
                'quantity'   => $item['quantity'],
                'unit_price' => number_format($service->price, 3),
                'subtotal'   => number_format($lineTotal, 3),
            ];
        }

        $vatAmount = $subtotal * Order::VAT_RATE;
        $total     = $subtotal + $vatAmount;

        return response()->json([
            'items'      => $lineItems,
            'subtotal'   => number_format($subtotal, 3),
            'vat_rate'   => '10%',
            'vat_amount' => number_format($vatAmount, 3),
            'total'      => number_format($total, 3),
            'currency'   => Order::CURRENCY,
        ]);
    }
}
