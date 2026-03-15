import React from 'react';

const stats = window.staffData?.stats || {};
const readyOrders = window.staffData?.readyOrders || [];

export default function StaffDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Shift</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'My Active Orders', value: stats.my_active || 0, color: 'text-blue-600' },
                    { label: 'Pending Pickup', value: stats.pending || 0, color: 'text-yellow-600' },
                    { label: 'Ready Now', value: stats.ready || 0, color: 'text-green-600' },
                    { label: 'Completed Today', value: stats.completed_today || 0, color: 'text-emerald-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Ready for Pickup</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {readyOrders.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No orders ready for pickup</p>
                    )}
                    {readyOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between px-5 py-4">
                            <div>
                                <p className="font-medium text-gray-900">{order.order_number}</p>
                                <p className="text-sm text-gray-500">{order.customer?.name} — {order.customer?.phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-land-700">BD {Number(order.total).toFixed(3)}</p>
                                <a href={`/staff/orders/${order.id}`} className="text-xs text-green-land-600 hover:underline">View</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
