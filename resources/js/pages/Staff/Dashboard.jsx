import React from 'react';
import {
    ShoppingBagIcon, ClockIcon, CheckCircleIcon, TrophyIcon,
} from '@heroicons/react/24/outline';

const stats = window.staffData?.stats || {};
const readyOrders = window.staffData?.readyOrders || [];

export default function StaffDashboard() {
    const statCards = [
        { label: 'My Active Orders', value: stats.my_active || 0, icon: ShoppingBagIcon, gradient: 'from-blue-500 to-blue-600' },
        { label: 'Pending Pickup', value: stats.pending || 0, icon: ClockIcon, gradient: 'from-amber-500 to-orange-500' },
        { label: 'Ready Now', value: stats.ready || 0, icon: CheckCircleIcon, gradient: 'from-emerald-500 to-teal-600' },
        { label: 'Completed Today', value: stats.completed_today || 0, icon: TrophyIcon, gradient: 'from-violet-500 to-purple-600' },
    ];

    return (
        <div className="space-y-8">
            <div className="animate-fade-in">
                <h1 className="page-title">My Shift</h1>
                <p className="page-subtitle">Your shift overview at a glance</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, idx) => (
                    <div
                        key={s.label}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} p-5 text-white
                                   shadow-lg transform hover:-translate-y-1 transition-all duration-300
                                   animate-fade-in-up stagger-${idx + 1}`}
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
                        <div className="relative">
                            <s.icon className="w-6 h-6 text-white/60 mb-2" />
                            <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
                            <p className="text-xs font-medium text-white/70 mt-1 uppercase tracking-wide">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ready for Pickup */}
            <div className="card overflow-hidden animate-fade-in-up stagger-3">
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                        <h2 className="font-bold text-gray-900">Ready for Pickup</h2>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {readyOrders.length === 0 && (
                        <div className="empty-state py-12">
                            <CheckCircleIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No orders ready for pickup</p>
                            <p className="text-gray-400 text-sm mt-1">Orders will appear here when ready</p>
                        </div>
                    )}
                    {readyOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between px-5 py-4 hover:bg-green-land-50/30 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <ShoppingBagIcon className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{order.order_number}</p>
                                    <p className="text-sm text-gray-500">{order.customer?.name} — {order.customer?.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-extrabold text-green-land-700">BD {Number(order.total).toFixed(3)}</p>
                                <a
                                    href={`/staff/orders/${order.id}`}
                                    className="text-xs font-semibold text-green-land-600 hover:text-green-land-700
                                               opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                    View details
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
