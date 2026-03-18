import React, { useState, useEffect, useCallback } from 'react';
import {
    CpuChipIcon, PlayIcon, StopIcon, PauseIcon,
    ArrowPathIcon, PlusIcon, WrenchScrewdriverIcon,
    SignalIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const initialMachines = window.machinesData?.machines || [];
const activeOrders = window.machinesData?.activeOrders || [];

const typeLabels = { washer: 'Washer', dryer: 'Dryer', ironer: 'Ironer' };
const typeColors = {
    washer: 'bg-blue-100 text-blue-700',
    dryer:  'bg-orange-100 text-orange-700',
    ironer: 'bg-purple-100 text-purple-700',
};

const statusConfig = {
    idle:        { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  label: 'Idle' },
    running:     { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',   label: 'Running' },
    paused:      { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'Paused' },
    error:       { color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    label: 'Error' },
    offline:     { color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400',   label: 'Offline' },
    maintenance: { color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500',  label: 'Maintenance' },
};

const defaultPrograms = {
    washer: {
        quick_wash:  { name: 'Quick Wash',  duration: 30, temp: 30 },
        normal_wash: { name: 'Normal Wash',  duration: 45, temp: 40 },
        heavy_wash:  { name: 'Heavy Wash',   duration: 60, temp: 60 },
        delicate:    { name: 'Delicate',     duration: 40, temp: 30 },
        whites:      { name: 'Whites',       duration: 55, temp: 90 },
        colors:      { name: 'Colors',       duration: 50, temp: 40 },
    },
    dryer: {
        low_heat:    { name: 'Low Heat',    duration: 40, temp: 40 },
        medium_heat: { name: 'Medium Heat', duration: 35, temp: 55 },
        high_heat:   { name: 'High Heat',   duration: 30, temp: 70 },
        air_dry:     { name: 'Air Dry',     duration: 60, temp: 25 },
    },
    ironer: {
        cotton:    { name: 'Cotton',    duration: 20, temp: 200 },
        synthetic: { name: 'Synthetic', duration: 15, temp: 150 },
        silk:      { name: 'Silk',      duration: 10, temp: 110 },
        linen:     { name: 'Linen',     duration: 25, temp: 220 },
    },
};

function ProgressRing({ progress, size = 80, stroke = 6 }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="#e5e7eb" strokeWidth={stroke}
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="#3b82f6" strokeWidth={stroke}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-1000"
            />
            <text
                x={size / 2} y={size / 2}
                textAnchor="middle" dominantBaseline="central"
                className="fill-gray-700 font-bold"
                fontSize="16" transform={`rotate(90, ${size / 2}, ${size / 2})`}
            >
                {progress}%
            </text>
        </svg>
    );
}

function MachineCard({ machine, onCommand, onRefresh }) {
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedOrder, setSelectedOrder] = useState('');
    const [loading, setLoading] = useState(false);
    const status = statusConfig[machine.status] || statusConfig.offline;
    const programs = machine.programs || defaultPrograms[machine.type] || {};

    const handleCommand = async (command) => {
        setLoading(true);
        await onCommand(machine.id, command, selectedProgram, selectedOrder);
        setLoading(false);
    };

    const isOnline = !['offline', 'maintenance'].includes(machine.status);
    const isRunning = machine.status === 'running';
    const isPaused = machine.status === 'paused';
    const isIdle = machine.status === 'idle';
    const remaining = machine.remaining_minutes;

    return (
        <div className={clsx(
            'bg-white rounded-xl shadow-sm border-2 p-5 transition-all',
            isRunning ? 'border-blue-300 shadow-blue-100' :
            machine.status === 'error' ? 'border-red-300 shadow-red-100' :
            'border-gray-100'
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={clsx('p-2 rounded-lg', typeColors[machine.type])}>
                        <CpuChipIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{machine.name}</h3>
                        <p className="text-xs text-gray-500">
                            {typeLabels[machine.type]} • {machine.machine_id}
                            {machine.capacity_kg && ` • ${machine.capacity_kg}kg`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', status.color)}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', status.dot,
                            isRunning && 'animate-pulse'
                        )} />
                        {status.label}
                    </span>
                    <button
                        onClick={onRefresh}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Refresh status"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Running cycle info */}
            {(isRunning || isPaused) && (
                <div className="mb-4 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-900">
                                {programs[machine.current_program]?.name || machine.current_program}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                {machine.current_temperature && `${machine.current_temperature}°C`}
                                {remaining !== null && remaining !== undefined && ` • ${remaining} min remaining`}
                            </p>
                            {machine.order && (
                                <p className="text-xs text-blue-500 mt-1">
                                    Order: {machine.order.order_number} — {machine.order.customer}
                                </p>
                            )}
                        </div>
                        <ProgressRing progress={machine.cycle_progress || 0} />
                    </div>
                </div>
            )}

            {/* Error state */}
            {machine.status === 'error' && (
                <div className="mb-4 bg-red-50 rounded-lg p-3 flex items-start space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Machine Error</p>
                        <p className="text-xs text-red-600">Check machine and reset to continue.</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            {isOnline && (
                <div className="space-y-3">
                    {/* Program selector - show when idle */}
                    {isIdle && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">Select program...</option>
                                    {Object.entries(programs).map(([key, prog]) => (
                                        <option key={key} value={key}>
                                            {prog.name} — {prog.duration}min, {prog.temp}°C
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Link to Order (optional)</label>
                                <select
                                    value={selectedOrder}
                                    onChange={(e) => setSelectedOrder(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">No order linked</option>
                                    {activeOrders.map((order) => (
                                        <option key={order.id} value={order.id}>
                                            {order.order_number} — {order.customer?.name} ({order.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Action buttons */}
                    <div className="flex space-x-2">
                        {isIdle && (
                            <button
                                onClick={() => handleCommand('start')}
                                disabled={!selectedProgram || loading}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <PlayIcon className="w-4 h-4 mr-1.5" />
                                Start Cycle
                            </button>
                        )}
                        {isRunning && (
                            <>
                                <button
                                    onClick={() => handleCommand('pause')}
                                    disabled={loading}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                                >
                                    <PauseIcon className="w-4 h-4 mr-1.5" />
                                    Pause
                                </button>
                                <button
                                    onClick={() => handleCommand('stop')}
                                    disabled={loading}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                                >
                                    <StopIcon className="w-4 h-4 mr-1.5" />
                                    Stop
                                </button>
                            </>
                        )}
                        {isPaused && (
                            <>
                                <button
                                    onClick={() => handleCommand('resume')}
                                    disabled={loading}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    <PlayIcon className="w-4 h-4 mr-1.5" />
                                    Resume
                                </button>
                                <button
                                    onClick={() => handleCommand('stop')}
                                    disabled={loading}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                                >
                                    <StopIcon className="w-4 h-4 mr-1.5" />
                                    Stop
                                </button>
                            </>
                        )}
                        {machine.status === 'error' && (
                            <button
                                onClick={() => handleCommand('stop')}
                                disabled={loading}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                                <WrenchScrewdriverIcon className="w-4 h-4 mr-1.5" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Offline message */}
            {!isOnline && (
                <div className="text-center py-4">
                    <SignalIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                        {machine.status === 'maintenance' ? 'Under maintenance' : 'Machine offline'}
                    </p>
                    {machine.last_ping_at && (
                        <p className="text-xs text-gray-400 mt-1">
                            Last seen: {new Date(machine.last_ping_at).toLocaleString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function AddMachineModal({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Machine</h3>
                <form method="POST" action="/admin/machines" className="space-y-4">
                    <input type="hidden" name="_token" value={window.csrf_token} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input name="name" required className="w-full rounded-lg border-gray-300 text-sm" placeholder="e.g. Washer #1" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID</label>
                        <input name="machine_id" required className="w-full rounded-lg border-gray-300 text-sm" placeholder="Serial number or hardware ID" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select name="type" required className="w-full rounded-lg border-gray-300 text-sm">
                                <option value="washer">Washer</option>
                                <option value="dryer">Dryer</option>
                                <option value="ironer">Ironer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kg)</label>
                            <input name="capacity_kg" type="number" min="1" className="w-full rounded-lg border-gray-300 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                        <input name="model_name" className="w-full rounded-lg border-gray-300 text-sm" placeholder="e.g. Samsung WF45R6100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint (optional)</label>
                        <input name="api_endpoint" type="url" className="w-full rounded-lg border-gray-300 text-sm" placeholder="https://device.example.com/api" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key (optional)</label>
                        <input name="api_key" type="password" className="w-full rounded-lg border-gray-300 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea name="notes" rows="2" className="w-full rounded-lg border-gray-300 text-sm" />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                            Add Machine
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Machines() {
    const [machines, setMachines] = useState(initialMachines);
    const [showAddModal, setShowAddModal] = useState(false);
    const [flash, setFlash] = useState(null);

    // Auto-refresh machine status every 10 seconds
    const refreshAll = useCallback(async () => {
        try {
            const res = await fetch('/admin/machines/status', {
                headers: { 'Accept': 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setMachines(data);
            }
        } catch (e) {
            // Silent fail on refresh
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(refreshAll, 10000);
        return () => clearInterval(interval);
    }, [refreshAll]);

    const handleCommand = async (machineId, command, program, orderId) => {
        try {
            const body = new FormData();
            body.append('_token', window.csrf_token);
            body.append('command', command);
            if (program) body.append('program', program);
            if (orderId) body.append('order_id', orderId);

            const res = await fetch(`/admin/machines/${machineId}/command`, {
                method: 'POST',
                body,
            });

            // Refresh after command
            await refreshAll();

            if (res.redirected) {
                // Server returned redirect with flash — just refresh
                setFlash({ type: 'success', message: `Command '${command}' sent successfully.` });
            }
        } catch (e) {
            setFlash({ type: 'error', message: 'Failed to send command.' });
        }

        setTimeout(() => setFlash(null), 4000);
    };

    const summary = {
        total: machines.length,
        running: machines.filter(m => m.status === 'running').length,
        idle: machines.filter(m => m.status === 'idle').length,
        error: machines.filter(m => m.status === 'error').length,
        offline: machines.filter(m => ['offline', 'maintenance'].includes(m.status)).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Machine Remote Control</h1>
                    <p className="text-gray-500 text-sm">Monitor and control laundry machines</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={refreshAll}
                        className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        Add Machine
                    </button>
                </div>
            </div>

            {/* Flash message */}
            {flash && (
                <div className={clsx(
                    'px-4 py-3 rounded-lg text-sm font-medium',
                    flash.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}>
                    {flash.message}
                </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: summary.total, cls: 'text-gray-700 bg-gray-50' },
                    { label: 'Running', value: summary.running, cls: 'text-blue-700 bg-blue-50' },
                    { label: 'Idle', value: summary.idle, cls: 'text-green-700 bg-green-50' },
                    { label: 'Error', value: summary.error, cls: 'text-red-700 bg-red-50' },
                    { label: 'Offline', value: summary.offline, cls: 'text-gray-500 bg-gray-50' },
                ].map((s) => (
                    <div key={s.label} className={clsx('rounded-lg px-4 py-3 text-center', s.cls)}>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Machine grid */}
            {machines.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <CpuChipIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No machines registered</h3>
                    <p className="text-gray-500 text-sm mt-1">Add your first machine to get started with remote control.</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        Add Machine
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {machines.map((machine) => (
                        <MachineCard
                            key={machine.id}
                            machine={machine}
                            onCommand={handleCommand}
                            onRefresh={refreshAll}
                        />
                    ))}
                </div>
            )}

            <AddMachineModal show={showAddModal} onClose={() => setShowAddModal(false)} />
        </div>
    );
}
