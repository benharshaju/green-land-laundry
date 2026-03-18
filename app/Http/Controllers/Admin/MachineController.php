<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\Order;
use App\Services\MachineControlService;
use Illuminate\Http\Request;

class MachineController extends Controller
{
    public function __construct(private MachineControlService $control) {}

    public function index()
    {
        $machines = Machine::with('currentOrder.customer')
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        // Update progress for running machines
        $machines->each(function ($machine) {
            if ($machine->isRunning()) {
                $this->control->updateProgress($machine);
                $machine->refresh();
            }
        });

        $activeOrders = Order::whereIn('status', [
            Order::STATUS_RECEIVED,
            Order::STATUS_WASHING,
            Order::STATUS_DRYING,
            Order::STATUS_IRONING,
        ])->with('customer')->get();

        return view('admin.machines.index', compact('machines', 'activeOrders'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'machine_id'   => 'required|string|max:255|unique:machines,machine_id',
            'type'         => 'required|in:washer,dryer,ironer',
            'model_name'   => 'nullable|string|max:255',
            'capacity_kg'  => 'nullable|integer|min:1|max:100',
            'api_endpoint' => 'nullable|url',
            'api_key'      => 'nullable|string|max:255',
            'notes'        => 'nullable|string|max:1000',
        ]);

        $validated['status'] = Machine::STATUS_IDLE;
        $validated['is_active'] = true;

        Machine::create($validated);

        return back()->with('success', 'Machine added successfully.');
    }

    public function command(Request $request, Machine $machine)
    {
        $request->validate([
            'command'  => 'required|in:start,stop,pause,resume',
            'program'  => 'required_if:command,start|nullable|string',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $result = match ($request->command) {
            'start'  => $this->control->startCycle($machine, $request->program, $request->order_id),
            'stop'   => $this->control->stopCycle($machine),
            'pause'  => $this->control->pauseCycle($machine),
            'resume' => $this->control->resumeCycle($machine),
        };

        return back()->with(
            $result['success'] ? 'success' : 'error',
            $result['message']
        );
    }

    public function status(Machine $machine)
    {
        if ($machine->isRunning()) {
            $this->control->updateProgress($machine);
            $machine->refresh();
        }

        return response()->json([
            'id'              => $machine->id,
            'name'            => $machine->name,
            'type'            => $machine->type,
            'status'          => $machine->status,
            'current_program' => $machine->current_program,
            'cycle_progress'  => $machine->cycle_progress,
            'remaining_minutes' => $machine->remaining_minutes,
            'current_temperature' => $machine->current_temperature,
            'target_temperature'  => $machine->target_temperature,
            'cycle_ends_at'   => $machine->cycle_ends_at?->toIso8601String(),
            'last_ping_at'    => $machine->last_ping_at?->toIso8601String(),
            'order'           => $machine->currentOrder ? [
                'id'           => $machine->currentOrder->id,
                'order_number' => $machine->currentOrder->order_number,
                'customer'     => $machine->currentOrder->customer?->name,
            ] : null,
        ]);
    }

    public function statusAll()
    {
        $machines = Machine::with('currentOrder.customer')->where('is_active', true)->get();

        $machines->each(function ($machine) {
            if ($machine->isRunning()) {
                $this->control->updateProgress($machine);
                $machine->refresh();
            }
        });

        return response()->json($machines->map(fn($m) => [
            'id'              => $m->id,
            'name'            => $m->name,
            'machine_id'      => $m->machine_id,
            'type'            => $m->type,
            'status'          => $m->status,
            'current_program' => $m->current_program,
            'cycle_progress'  => $m->cycle_progress,
            'remaining_minutes' => $m->remaining_minutes,
            'current_temperature' => $m->current_temperature,
            'target_temperature'  => $m->target_temperature,
            'cycle_ends_at'   => $m->cycle_ends_at?->toIso8601String(),
            'last_ping_at'    => $m->last_ping_at?->toIso8601String(),
            'programs'        => $m->getPrograms(),
            'order'           => $m->currentOrder ? [
                'id'           => $m->currentOrder->id,
                'order_number' => $m->currentOrder->order_number,
                'customer'     => $m->currentOrder->customer?->name,
            ] : null,
        ]));
    }

    public function update(Request $request, Machine $machine)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'model_name'   => 'nullable|string|max:255',
            'capacity_kg'  => 'nullable|integer|min:1|max:100',
            'api_endpoint' => 'nullable|url',
            'api_key'      => 'nullable|string|max:255',
            'is_active'    => 'boolean',
            'notes'        => 'nullable|string|max:1000',
        ]);

        $machine->update($validated);

        return back()->with('success', 'Machine updated.');
    }

    public function destroy(Machine $machine)
    {
        $machine->delete();
        return back()->with('success', 'Machine removed.');
    }
}
