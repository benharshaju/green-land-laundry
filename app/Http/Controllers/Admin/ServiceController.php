<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        $services = Service::orderBy('sort_order')->get();
        return view('admin.services.index', compact('services'));
    }

    public function create()
    {
        return view('admin.services.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'name_arabic'     => 'nullable|string|max:255',
            'category'        => 'required|in:' . implode(',', array_keys(Service::CATEGORIES)),
            'price'           => 'required|numeric|min:0',
            'price_express'   => 'nullable|numeric|min:0',
            'unit'            => 'required|string|max:20',
            'description'     => 'nullable|string',
            'description_arabic' => 'nullable|string',
            'sort_order'      => 'nullable|integer',
        ]);

        Service::create(array_merge($validated, ['is_active' => true]));

        return redirect()->route('admin.services.index')
            ->with('success', 'Service created.');
    }

    public function edit(Service $service)
    {
        return view('admin.services.edit', compact('service'));
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'name_arabic'    => 'nullable|string|max:255',
            'category'       => 'required|in:' . implode(',', array_keys(Service::CATEGORIES)),
            'price'          => 'required|numeric|min:0',
            'price_express'  => 'nullable|numeric|min:0',
            'unit'           => 'required|string|max:20',
            'is_active'      => 'boolean',
            'sort_order'     => 'nullable|integer',
        ]);

        $service->update($validated);

        return redirect()->route('admin.services.index')
            ->with('success', 'Service updated.');
    }

    public function destroy(Service $service)
    {
        $service->delete();
        return redirect()->route('admin.services.index')
            ->with('success', 'Service deleted.');
    }
}
