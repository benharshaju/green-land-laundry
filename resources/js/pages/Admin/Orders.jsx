import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const statusColors = {
    pending:   'bg-yellow-100 text-yellow-800',
    received:  'bg-blue-100 text-blue-800',
    washing:   'bg-blue-200 text-blue-900',
    drying:    'bg-purple-100 text-purple-800',
    ironing:   'bg-orange-100 text-orange-800',
    ready:     'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
};

const orders = window.ordersData?.orders || [];

export default function Orders() {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const filtered = orders.filter((o) => {
        const matchSearch = !search ||
            o.order_number.toLowerCase().includes(search.toLowerCase()) ||
            o.customer?.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 text-sm">{orders.length} total orders</p>
                </div>
                <Link
                    to="/orders/create"
                    className="flex items-center space-x-2 bg-green-land-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-land-700"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>New Order</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by order # or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-land-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-land-500"
                >
                    <option value="">All Statuses</option>
                    {Object.keys(statusColors).map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order #</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pickup</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total (BHD)</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">VAT (10%)</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((order) => (
                            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{order.order_number}</td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{order.customer?.name}</p>
                                        <p className="text-gray-500 text-xs">{order.customer?.phone}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-BH') : '—'}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    BD {Number(order.total).toFixed(3)}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500">
                                    BD {Number(order.vat_amount).toFixed(3)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        to={`/orders/${order.id}`}
                                        className="text-green-land-600 hover:text-green-land-800 font-medium"
                                    >
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No orders found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
