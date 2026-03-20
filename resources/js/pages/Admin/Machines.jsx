import React, { useState, useEffect, useCallback } from 'react';
import {
    CpuChipIcon, PlayIcon, StopIcon, PauseIcon,
    ArrowPathIcon, PlusIcon, WrenchScrewdriverIcon,
    SignalIcon, ExclamationTriangleIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const initialMachines = window.machinesData?.machines || [];
const activeOrders = window.machinesData?.activeOrders || [];

const typeLabels = { washer: 'Washer', dryer: 'Dryer', ironer: 'Ironer' };
const typeColors = {
    washer: 'from-blue-500 to-blue-600',
    dryer:  'from-orange-500 to-orange-600',
    ironer: 'from-violet-500 to-violet-600',
};
const typeBadge = {
    washer: 'bg-blue-50 text-blue-700 border-blue-200/50',
    dryer:  'bg-orange-50 text-orange-700 border-orange-200/50',
    ironer: 'bg-violet-50 text-violet-700 border-violet-200/50',
};

const statusConfig = {
    idle:        { color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',  dot: 'bg-emerald-500', label: 'Idle' },
    running:     { color: 'bg-blue-50 text-blue-700 border-blue-200/50',           dot: 'bg-blue-500',    label: 'Running' },
    paused:      { color: 'bg-amber-50 text-amber-700 border-amber-200/50',        dot: 'bg-amber-500',   label: 'Paused' },
    error:       { color: 'bg-red-50 text-red-700 border-red-200/50',              dot: 'bg-red-500',     label: 'Error' },
    offline:     { color: 'bg-gray-100 text-gray-500 border-gray-200/50',          dot: 'bg-gray-400',    label: 'Offline' },
    maintenance: { color: 'bg-amber-50 text-amber-700 border-amber-200/50',        dot: 'bg-amber-500',   label: 'Maintenance' },
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
                fill="none" stroke="#f3f4f6" strokeWidth={stroke}
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="url(#progressGradient)" strokeWidth={stroke}
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-1000 ease-out"
            />
            <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1abb6b" />
                </linearGradient>
            </defs>
            <text
                x={size / 2} y={size / 2}
                textAnchor="middle" dominantBaseline="central"
                className="fill-gray-700 font-extrabold"
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
            'card p-5 transition-all duration-300',
            isRunning && 'ring-2 ring-blue-200 shadow-glow-blue',
            machine.status === 'error' && 'ring-2 ring-red-200 shadow-lg shadow-red-100',
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', typeColors[machine.type])}>
                        <CpuChipIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{machine.name}</h3>
                        <p className="text-xs text-gray-400">
                            <span className={`badge text-[10px] px-1.5 py-0.5 border ${typeBadge[machine.type]}`}>
                                {typeLabels[machine.type]}
                            </span>
                            <span className="ml-1.5">{machine.machine_id}</span>
                            {machine.capacity_kg && <span> · {machine.capacity_kg}kg</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={`badge border ${status.color}`}>
                        <span className={clsx('badge-dot', status.dot, isRunning && 'animate-pulse')} />
                        {status.label}
                    </span>
                    <button onClick={onRefresh} className="btn-icon !p-1.5" title="Refresh status">
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Running cycle info */}
            {(isRunning || isPaused) && (
                <div className="mb-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-blue-900">
                                {programs[machine.current_program]?.name || machine.current_program}
                            </p>
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                                {machine.current_temperature && `${machine.current_temperature}°C`}
                                {remaining !== null && remaining !== undefined && ` · ${remaining} min remaining`}
                            </p>
                            {machine.order && (
                                <p className="text-xs text-blue-400 mt-1">
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
                <div className="mb-4 bg-red-50 rounded-xl p-3.5 flex items-start gap-3 border border-red-100/50">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-800">Machine Error</p>
                        <p className="text-xs text-red-600 mt-0.5">Check machine and reset to continue.</p>
                    </div>
                </div>
            )}

            {/* Controls */}
            {isOnline && (
                <div className="space-y-3">
                    {isIdle && (
                        <>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Program</label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    className="input text-sm"
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
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link to Order (optional)</label>
                                <select
                                    value={selectedOrder}
                                    onChange={(e) => setSelectedOrder(e.target.value)}
                                    className="input text-sm"
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
                    <div className="flex gap-2">
                        {isIdle && (
                            <button
                                onClick={() => handleCommand('start')}
                                disabled={!selectedProgram || loading}
                                className="flex-1 btn-primary inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                            >
                                <PlayIcon className="w-4 h-4" />
                                Start Cycle
                            </button>
                        )}
                        {isRunning && (
                            <>
                                <button
                                    onClick={() => handleCommand('pause')}
                                    disabled={loading}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                               bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600
                                               shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-40"
                                >
                                    <PauseIcon className="w-4 h-4" />
                                    Pause
                                </button>
                                <button
                                    onClick={() => handleCommand('stop')}
                                    disabled={loading}
                                    className="flex-1 btn-danger inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                    <StopIcon className="w-4 h-4" />
                                    Stop
                                </button>
                            </>
                        )}
                        {isPaused && (
                            <>
                                <button
                                    onClick={() => handleCommand('resume')}
                                    disabled={loading}
                                    className="flex-1 btn-primary inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Resume
                                </button>
                                <button
                                    onClick={() => handleCommand('stop')}
                                    disabled={loading}
                                    className="flex-1 btn-danger inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                    <StopIcon className="w-4 h-4" />
                                    Stop
                                </button>
                            </>
                        )}
                        {machine.status === 'error' && (
                            <button
                                onClick={() => handleCommand('stop')}
                                disabled={loading}
                                className="flex-1 btn-secondary inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                            >
                                <WrenchScrewdriverIcon className="w-4 h-4" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Offline message */}
            {!isOnline && (
                <div className="text-center py-6">
                    <SignalIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-500">
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
        <>
            <div className="overlay animate-fade-in" onClick={onClose} />
            <div className="modal">
                <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-gray-900">Add Machine</h3>
                        <button onClick={onClose} className="btn-icon">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <form method="POST" action="/admin/machines" className="space-y-4">
                        <input type="hidden" name="_token" value={window.csrf_token} />
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                            <input name="name" required className="input" placeholder="e.g. Washer #1" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Machine ID</label>
                            <input name="machine_id" required className="input" placeholder="Serial number or hardware ID" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                                <select name="type" required className="input">
                                    <option value="washer">Washer</option>
                                    <option value="dryer">Dryer</option>
                                    <option value="ironer">Ironer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacity (kg)</label>
                                <input name="capacity_kg" type="number" min="1" className="input" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model</label>
                            <input name="model_name" className="input" placeholder="e.g. Samsung WF45R6100" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">API Endpoint (optional)</label>
                            <input name="api_endpoint" type="url" className="input" placeholder="https://device.example.com/api" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">API Key (optional)</label>
                            <input name="api_key" type="password" className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                            <textarea name="notes" rows="2" className="input resize-none" />
                        </div>
                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                            <button type="submit" className="btn-primary">Add Machine</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default function Machines() {
    const [machines, setMachines] = useState(initialMachines);
    const [showAddModal, setShowAddModal] = useState(false);
    const [flash, setFlash] = useState(null);

    const refreshAll = useCallback(async () => {
        try {
            const res = await fetch('/admin/machines/status', { headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                const data = await res.json();
                setMachines(data);
            }
        } catch (e) { /* silent */ }
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

            const res = await fetch(`/admin/machines/${machineId}/command`, { method: 'POST', body });
            await refreshAll();

            if (res.redirected) {
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="page-title">Machine Remote Control</h1>
                    <p className="page-subtitle">Monitor and control laundry machines in real-time</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={refreshAll} className="btn-secondary inline-flex items-center gap-1.5">
                        <ArrowPathIcon className="w-4 h-4" />
                        Refresh
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-1.5">
                        <PlusIcon className="w-4 h-4" />
                        Add Machine
                    </button>
                </div>
            </div>

            {/* Flash message */}
            {flash && (
                <div className={clsx(
                    'px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in-down border',
                    flash.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        : 'bg-red-50 text-red-700 border-red-200/50'
                )}>
                    {flash.message}
                </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-in-up stagger-1">
                {[
                    { label: 'Total', value: summary.total, gradient: 'from-gray-500 to-gray-600' },
                    { label: 'Running', value: summary.running, gradient: 'from-blue-500 to-blue-600' },
                    { label: 'Idle', value: summary.idle, gradient: 'from-emerald-500 to-teal-600' },
                    { label: 'Error', value: summary.error, gradient: 'from-red-500 to-red-600' },
                    { label: 'Offline', value: summary.offline, gradient: 'from-gray-400 to-gray-500' },
                ].map((s) => (
                    <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.gradient} p-4 text-center text-white shadow-sm`}>
                        <p className="text-2xl font-extrabold">{s.value}</p>
                        <p className="text-xs font-medium text-white/70">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Machine grid */}
            {machines.length === 0 ? (
                <div className="card empty-state animate-fade-in-up">
                    <CpuChipIcon className="empty-state-icon" />
                    <h3 className="text-lg font-bold text-gray-900">No machines registered</h3>
                    <p className="text-gray-500 text-sm mt-1">Add your first machine to get started with remote control.</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 btn-primary inline-flex items-center gap-1.5"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Machine
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in-up stagger-2">
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
