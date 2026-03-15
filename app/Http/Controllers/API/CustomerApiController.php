<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
            ->orWhere('phone', 'like', "%{$request->search}%"))
            ->paginate(20);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:customers',
            'email' => 'nullable|email',
            'area'  => 'nullable|string|max:100',
        ]);

        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $customer->update($request->only(['name', 'phone', 'email', 'address', 'area']));
        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();
        return response()->json(['message' => 'Customer deleted.']);
    }

    public function orders(Customer $customer): JsonResponse
    {
        return response()->json($customer->orders()->with('items')->latest()->get());
    }
}
