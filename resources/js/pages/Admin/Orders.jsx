import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">{orders.length} total orders</p>
                </div>
                <Link to="/orders/create" className="btn-primary inline-flex items-center gap-2 self-start">
                    <PlusIcon className="w-4 h-4" />
                    <span>New Order</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up stagger-1">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by order # or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-search"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input w-full sm:w-48"
                >
                    <option value="">All Statuses</option>
                    {Object.keys(statusColors).map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden animate-fade-in-up stagger-2">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Order #</th>
                                <th className="table-header">Customer</th>
                                <th className="table-header">Status</th>
                                <th className="table-header hidden lg:table-cell">Pickup</th>
                                <th className="table-header text-right">Total (BHD)</th>
                                <th className="table-header text-right hidden md:table-cell">VAT (10%)</th>
                                <th className="table-header w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order) => (
                                <tr key={order.id} className="table-row group">
                                    <td className="table-cell">
                                        <span className="font-semibold text-gray-900">{order.order_number}</span>
                                    </td>
                                    <td className="table-cell">
                                        <div>
                                            <p className="font-semibold text-gray-900">{order.customer?.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{order.customer?.phone}</p>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <span className={`badge ${statusColors[order.status]}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="table-cell text-gray-500 hidden lg:table-cell">
                                        {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('en-BH') : '—'}
                                    </td>
                                    <td className="table-cell text-right">
                                        <span className="font-bold text-gray-900">BD {Number(order.total).toFixed(3)}</span>
                                    </td>
                                    <td className="table-cell text-right text-gray-500 hidden md:table-cell">
                                        BD {Number(order.vat_amount).toFixed(3)}
                                    </td>
                                    <td className="table-cell text-right">
                                        <Link
                                            to={`/orders/${order.id}`}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold
                                                       text-green-land-700 bg-green-land-50 hover:bg-green-land-100
                                                       opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <ShoppingBagIcon className="empty-state-icon" />
                                        <p className="text-gray-500 font-medium">No orders found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
