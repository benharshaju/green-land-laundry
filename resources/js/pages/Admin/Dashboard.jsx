import React from 'react';
import {
    ShoppingBagIcon, CurrencyDollarIcon, UsersIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Stats come from window.dashboardData (server-rendered)
const stats = window.dashboardData?.stats || {};
const revenueChart = window.dashboardData?.revenueChart || [];
const recentOrders = window.dashboardData?.recentOrders || [];

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

export default function Dashboard() {
    const statCards = [
        {
            title: 'Orders Today',
            value: stats.orders_today || 0,
            icon: ShoppingBagIcon,
            color: 'text-blue-600 bg-blue-100',
        },
        {
            title: 'Revenue This Month',
            value: `BD ${Number(stats.revenue_month || 0).toFixed(3)}`,
            icon: CurrencyDollarIcon,
            color: 'text-green-600 bg-green-100',
            sub: `VAT: BD ${Number(stats.vat_collected || 0).toFixed(3)}`,
        },
        {
            title: 'Orders Pending',
            value: stats.orders_pending || 0,
            icon: ShoppingBagIcon,
            color: 'text-yellow-600 bg-yellow-100',
        },
        {
            title: 'Ready for Pickup',
            value: stats.orders_ready || 0,
            icon: CheckCircleIcon,
            color: 'text-emerald-600 bg-emerald-100',
        },
        {
            title: 'Total Customers',
            value: stats.customers_total || 0,
            icon: UsersIcon,
            color: 'text-purple-600 bg-purple-100',
            sub: `+${stats.customers_new || 0} this month`,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 text-sm">Green Land Laundry — Bahrain</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((card) => (
                    <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <div className={`p-2 rounded-lg ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        {card.sub && <p className="text-xs text-gray-500 mt-1">{card.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (Last 30 Days) — BHD</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => `BD ${Number(v).toFixed(3)}`} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#16a34a"
                            fill="#dcfce7"
                            name="Revenue"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total (BHD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{order.order_number}</td>
                                    <td className="px-6 py-4 text-gray-600">{order.customer?.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        BD {Number(order.total).toFixed(3)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
