<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\MachineLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MachineControlService
{
    /**
     * Send a command to the machine's IoT endpoint.
     * Returns true if the command was acknowledged.
     */
    public function sendCommand(Machine $machine, string $command, array $params = []): bool
    {
        if (!$machine->api_endpoint) {
            Log::info("Machine {$machine->machine_id}: No API endpoint configured, simulating command '{$command}'");
            return true; // Simulate success for machines without hardware endpoint
        }

        try {
            $response = Http::timeout(10)
                ->withToken($machine->api_key)
                ->post($machine->api_endpoint . '/command', [
                    'command' => $command,
                    'params'  => $params,
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("Machine {$machine->machine_id} command '{$command}' failed: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Start a wash/dry/iron cycle on a machine.
     */
    public function startCycle(Machine $machine, string $program, ?int $orderId = null): array
    {
        if (!$machine->isOnline() || $machine->isRunning()) {
            return ['success' => false, 'message' => 'Machine is not available to start a cycle.'];
        }

        $programs = $machine->getPrograms();
        if (!isset($programs[$program])) {
            return ['success' => false, 'message' => 'Invalid program selected.'];
        }

        $programData = $programs[$program];
        $duration = $programData['duration'];
        $temperature = $programData['temp'];

        $sent = $this->sendCommand($machine, 'start', [
            'program'     => $program,
            'temperature' => $temperature,
            'duration'    => $duration,
        ]);

        if (!$sent) {
            return ['success' => false, 'message' => 'Failed to communicate with machine.'];
        }

        $statusBefore = $machine->status;
        $machine->update([
            'status'                 => Machine::STATUS_RUNNING,
            'current_program'        => $program,
            'target_temperature'     => $temperature,
            'current_temperature'    => $temperature,
            'cycle_duration_minutes' => $duration,
            'cycle_started_at'       => now(),
            'cycle_ends_at'          => now()->addMinutes($duration),
            'cycle_progress'         => 0,
            'current_order_id'       => $orderId,
            'last_ping_at'           => now(),
        ]);

        $this->log($machine, 'start_cycle', $statusBefore, Machine::STATUS_RUNNING, [
            'program'     => $program,
            'temperature' => $temperature,
            'duration'    => $duration,
            'order_id'    => $orderId,
        ], "Started {$programData['name']} cycle ({$duration} min, {$temperature}°C)");

        return ['success' => true, 'message' => "Cycle started: {$programData['name']}"];
    }

    /**
     * Stop a running cycle.
     */
    public function stopCycle(Machine $machine): array
    {
        if (!$machine->isRunning()) {
            return ['success' => false, 'message' => 'Machine is not running.'];
        }

        $sent = $this->sendCommand($machine, 'stop');
        if (!$sent) {
            return ['success' => false, 'message' => 'Failed to communicate with machine.'];
        }

        $statusBefore = $machine->status;
        $machine->update([
            'status'              => Machine::STATUS_IDLE,
            'current_program'     => null,
            'cycle_started_at'    => null,
            'cycle_ends_at'       => null,
            'cycle_progress'      => 0,
            'current_order_id'    => null,
            'last_ping_at'        => now(),
        ]);

        $this->log($machine, 'stop_cycle', $statusBefore, Machine::STATUS_IDLE, [], 'Cycle stopped manually');

        return ['success' => true, 'message' => 'Cycle stopped.'];
    }

    /**
     * Pause a running cycle.
     */
    public function pauseCycle(Machine $machine): array
    {
        if (!$machine->isRunning()) {
            return ['success' => false, 'message' => 'Machine is not running.'];
        }

        $sent = $this->sendCommand($machine, 'pause');
        if (!$sent) {
            return ['success' => false, 'message' => 'Failed to communicate with machine.'];
        }

        $statusBefore = $machine->status;
        $machine->update([
            'status'       => Machine::STATUS_PAUSED,
            'last_ping_at' => now(),
        ]);

        $this->log($machine, 'pause_cycle', $statusBefore, Machine::STATUS_PAUSED, [], 'Cycle paused');

        return ['success' => true, 'message' => 'Cycle paused.'];
    }

    /**
     * Resume a paused cycle.
     */
    public function resumeCycle(Machine $machine): array
    {
        if ($machine->status !== Machine::STATUS_PAUSED) {
            return ['success' => false, 'message' => 'Machine is not paused.'];
        }

        $sent = $this->sendCommand($machine, 'resume');
        if (!$sent) {
            return ['success' => false, 'message' => 'Failed to communicate with machine.'];
        }

        $statusBefore = $machine->status;
        $machine->update([
            'status'       => Machine::STATUS_RUNNING,
            'last_ping_at' => now(),
        ]);

        $this->log($machine, 'resume_cycle', $statusBefore, Machine::STATUS_RUNNING, [], 'Cycle resumed');

        return ['success' => true, 'message' => 'Cycle resumed.'];
    }

    /**
     * Update progress for running machines (called via scheduler or webhook).
     */
    public function updateProgress(Machine $machine): void
    {
        if (!$machine->isRunning() || !$machine->cycle_started_at || !$machine->cycle_ends_at) {
            return;
        }

        $totalSeconds = $machine->cycle_started_at->diffInSeconds($machine->cycle_ends_at);
        $elapsedSeconds = $machine->cycle_started_at->diffInSeconds(now());
        $progress = $totalSeconds > 0 ? min(100, (int) round(($elapsedSeconds / $totalSeconds) * 100)) : 100;

        $machine->update([
            'cycle_progress' => $progress,
            'last_ping_at'   => now(),
        ]);

        // Auto-complete cycle when done
        if ($progress >= 100) {
            $statusBefore = $machine->status;
            $machine->update([
                'status'           => Machine::STATUS_IDLE,
                'current_program'  => null,
                'cycle_started_at' => null,
                'cycle_ends_at'    => null,
                'cycle_progress'   => 0,
                'current_order_id' => null,
            ]);

            $this->log($machine, 'cycle_complete', $statusBefore, Machine::STATUS_IDLE, [], 'Cycle completed automatically');
        }
    }

    private function log(Machine $machine, string $action, ?string $before, ?string $after, array $payload = [], string $message = ''): void
    {
        MachineLog::create([
            'machine_id'    => $machine->id,
            'user_id'       => auth()->id(),
            'order_id'      => $machine->current_order_id,
            'action'        => $action,
            'status_before' => $before,
            'status_after'  => $after,
            'payload'       => $payload ?: null,
            'message'       => $message,
        ]);
    }
}
