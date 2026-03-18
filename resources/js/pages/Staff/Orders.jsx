import React, { useState } from 'react';
import {
    ArrowRightIcon, CheckCircleIcon, ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const allOrders = window.staffData?.allOrders || [];

const statusColors = {
    pending:   'bg-amber-50 text-amber-700 border border-amber-200/50',
    received:  'bg-blue-50 text-blue-700 border border-blue-200/50',
    washing:   'bg-sky-50 text-sky-700 border border-sky-200/50',
    drying:    'bg-violet-50 text-violet-700 border border-violet-200/50',
    ironing:   'bg-orange-50 text-orange-700 border border-orange-200/50',
    ready:     'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    delivered: 'bg-gray-50 text-gray-600 border border-gray-200/50',
    cancelled: 'bg-red-50 text-red-700 border border-red-200/50',
};

const statusFlow = ['received', 'washing', 'drying', 'ironing', 'ready', 'delivered'];

const statusSteps = {
    received: { icon: '📥', label: 'Received' },
    washing:  { icon: '🧺', label: 'Washing' },
    drying:   { icon: '💨', label: 'Drying' },
    ironing:  { icon: '👕', label: 'Ironing' },
    ready:    { icon: '✅', label: 'Ready' },
    delivered:{ icon: '🚗', label: 'Delivered' },
};

export default function StaffOrders() {
    const [orders, setOrders] = useState(allOrders);
    const [updating, setUpdating] = useState(null);

    const updateStatus = async (orderId, newStatus) => {
        setUpdating(orderId);
        const res = await fetch(`/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.csrf_token },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
        }
        setUpdating(null);
    };

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="page-title">Orders</h1>
                <p className="page-subtitle">{orders.length} orders in queue</p>
            </div>

            <div className="space-y-4">
                {orders.map((order, idx) => {
                    const currentIdx = statusFlow.indexOf(order.status);
                    const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
                    const isUpdating = updating === order.id;

                    return (
                        <div
                            key={order.id}
                            className={`card p-5 animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <ShoppingBagIcon className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{order.order_number}</p>
                                        <p className="text-sm text-gray-500">{order.customer?.name} · {order.customer?.phone}</p>
                                    </div>
                                </div>
                                <p className="font-extrabold text-green-land-700 text-lg">BD {Number(order.total).toFixed(3)}</p>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-hide py-1">
                                {statusFlow.map((step, i) => {
                                    const stepIdx = statusFlow.indexOf(step);
                                    const isActive = step === order.status;
                                    const isPast = stepIdx < currentIdx;
                                    const isFuture = stepIdx > currentIdx;

                                    return (
                                        <React.Fragment key={step}>
                                            <div className={clsx(
                                                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                                                isActive && 'bg-green-land-50 text-green-land-700 ring-1 ring-green-land-200',
                                                isPast && 'bg-gray-100 text-gray-500',
                                                isFuture && 'text-gray-300',
                                            )}>
                                                <span>{statusSteps[step]?.icon}</span>
                                                <span className="hidden sm:inline">{statusSteps[step]?.label}</span>
                                            </div>
                                            {i < statusFlow.length - 1 && (
                                                <div className={clsx(
                                                    'w-4 h-0.5 rounded-full flex-shrink-0',
                                                    stepIdx < currentIdx ? 'bg-green-land-300' : 'bg-gray-200'
                                                )} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Current Status Badge */}
                            <div className="flex items-center justify-between">
                                <span className={`badge ${statusColors[order.status]}`}>
                                    {order.status}
                                </span>

                                {nextStatus && (
                                    <button
                                        onClick={() => updateStatus(order.id, nextStatus)}
                                        disabled={isUpdating}
                                        className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 disabled:opacity-50"
                                    >
                                        {isUpdating ? (
                                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <ArrowRightIcon className="w-3.5 h-3.5" />
                                        )}
                                        Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                                    </button>
                                )}

                                {!nextStatus && order.status === 'delivered' && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Completed
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {orders.length === 0 && (
                    <div className="card empty-state">
                        <ShoppingBagIcon className="empty-state-icon" />
                        <p className="text-gray-500 font-medium">No orders in queue</p>
                    </div>
                )}
            </div>
        </div>
    );
}
