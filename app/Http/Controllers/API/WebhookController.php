<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Models\MachineLog;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function whatsapp(Request $request)
    {
        Log::info('WhatsApp webhook', $request->all());

        $body = $request->input('Body', '');
        $from = $request->input('From', '');

        // Auto-respond to tracking queries
        if (str_contains(strtoupper($body), 'STATUS') || str_contains(strtoupper($body), 'ORDER')) {
            // Extract order number if present
            preg_match('/GLL-\d{8}-\d{4}/', $body, $matches);
            if (!empty($matches[0])) {
                $order = Order::where('order_number', $matches[0])->first();
                if ($order) {
                    // Send status via WhatsApp
                    Log::info("Auto-reply for order {$order->order_number} to {$from}");
                }
            }
        }

        return response()->xml('<Response></Response>', 200, ['Content-Type' => 'text/xml']);
    }

    public function payment(Request $request)
    {
        Log::info('Payment webhook', $request->all());

        $orderId = $request->input('order_id');
        $status  = $request->input('status');

        if ($orderId && $status === 'paid') {
            $order = Order::find($orderId);
            if ($order) {
                $order->update(['paid_at' => now(), 'payment_method' => $request->input('method', 'online')]);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Receive telemetry data from IoT machines.
     */
    public function machineTelemetry(Request $request)
    {
        Log::info('Machine telemetry webhook', $request->all());

        $machineId = $request->input('machine_id');
        $machine = Machine::where('machine_id', $machineId)->first();

        if (!$machine) {
            return response()->json(['error' => 'Unknown machine'], 404);
        }

        $telemetry = $request->only([
            'temperature', 'status', 'error_code', 'cycle_progress',
        ]);

        $updates = [
            'last_telemetry' => $telemetry,
            'last_ping_at'   => now(),
        ];

        if (isset($telemetry['temperature'])) {
            $updates['current_temperature'] = $telemetry['temperature'];
        }
        if (isset($telemetry['cycle_progress'])) {
            $updates['cycle_progress'] = $telemetry['cycle_progress'];
        }
        if (isset($telemetry['status']) && in_array($telemetry['status'], Machine::STATUSES)) {
            $statusBefore = $machine->status;
            $updates['status'] = $telemetry['status'];

            if ($statusBefore !== $telemetry['status']) {
                MachineLog::create([
                    'machine_id'    => $machine->id,
                    'action'        => 'telemetry_status_change',
                    'status_before' => $statusBefore,
                    'status_after'  => $telemetry['status'],
                    'payload'       => $telemetry,
                    'message'       => "Status changed via telemetry: {$statusBefore} → {$telemetry['status']}",
                ]);
            }
        }
        if (isset($telemetry['error_code'])) {
            $updates['status'] = Machine::STATUS_ERROR;
            MachineLog::create([
                'machine_id'    => $machine->id,
                'action'        => 'error',
                'status_before' => $machine->status,
                'status_after'  => Machine::STATUS_ERROR,
                'payload'       => $telemetry,
                'message'       => "Error code: {$telemetry['error_code']}",
            ]);
        }

        $machine->update($updates);

        return response()->json(['status' => 'ok']);
    }
}
