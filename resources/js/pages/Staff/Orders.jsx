import React, { useState } from 'react';

const allOrders = window.staffData?.allOrders || [];

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800', received: 'bg-blue-100 text-blue-800',
    washing: 'bg-blue-200 text-blue-900', drying: 'bg-purple-100 text-purple-800',
    ironing: 'bg-orange-100 text-orange-800', ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800',
};

const statusFlow = ['received', 'washing', 'drying', 'ironing', 'ready', 'delivered'];

export default function StaffOrders() {
    const [orders, setOrders] = useState(allOrders);

    const updateStatus = async (orderId, newStatus) => {
        const res = await fetch(`/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.csrf_token },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            {orders.map((order) => {
                const currentIdx = statusFlow.indexOf(order.status);
                const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
                return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">{order.order_number}</p>
                                <p className="text-sm text-gray-500">{order.customer?.name} • {order.customer?.phone}</p>
                                <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="font-bold text-green-land-700">BD {Number(order.total).toFixed(3)}</p>
                        </div>
                        {nextStatus && (
                            <button
                                onClick={() => updateStatus(order.id, nextStatus)}
                                className="mt-3 w-full bg-green-land-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-land-700"
                            >
                                Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
