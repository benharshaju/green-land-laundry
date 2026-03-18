import React from 'react';
import {
    ShoppingBagIcon, CurrencyDollarIcon, UsersIcon, CheckCircleIcon,
    ArrowTrendingUpIcon, ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stats = window.dashboardData?.stats || {};
const revenueChart = window.dashboardData?.revenueChart || [];
const recentOrders = window.dashboardData?.recentOrders || [];

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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-gray-900">BD {Number(payload[0].value).toFixed(3)}</p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const statCards = [
        {
            title: 'Orders Today',
            value: stats.orders_today || 0,
            icon: ShoppingBagIcon,
            gradient: 'from-blue-500 to-blue-600',
            iconBg: 'bg-blue-400/20',
            shadow: 'shadow-blue-500/20',
        },
        {
            title: 'Revenue This Month',
            value: `BD ${Number(stats.revenue_month || 0).toFixed(3)}`,
            icon: CurrencyDollarIcon,
            gradient: 'from-green-land-500 to-green-land-700',
            iconBg: 'bg-green-land-400/20',
            shadow: 'shadow-green-land-500/20',
            sub: `VAT collected: BD ${Number(stats.vat_collected || 0).toFixed(3)}`,
        },
        {
            title: 'Pending Orders',
            value: stats.orders_pending || 0,
            icon: ShoppingBagIcon,
            gradient: 'from-amber-500 to-orange-500',
            iconBg: 'bg-amber-400/20',
            shadow: 'shadow-amber-500/20',
        },
        {
            title: 'Ready for Pickup',
            value: stats.orders_ready || 0,
            icon: CheckCircleIcon,
            gradient: 'from-emerald-500 to-teal-600',
            iconBg: 'bg-emerald-400/20',
            shadow: 'shadow-emerald-500/20',
        },
        {
            title: 'Total Customers',
            value: stats.customers_total || 0,
            icon: UsersIcon,
            gradient: 'from-violet-500 to-purple-600',
            iconBg: 'bg-violet-400/20',
            shadow: 'shadow-violet-500/20',
            sub: `+${stats.customers_new || 0} this month`,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-fade-in">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back — here's your business overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((card, idx) => (
                    <div
                        key={card.title}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 text-white
                                   shadow-lg ${card.shadow} hover:shadow-xl
                                   transform hover:-translate-y-1 transition-all duration-300 ease-out
                                   animate-fade-in-up stagger-${idx + 1}`}
                    >
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-4"></div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-white/80">{card.title}</p>
                                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                                    <card.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold tracking-tight">{card.value}</p>
                            {card.sub && (
                                <p className="text-xs text-white/60 mt-1.5 font-medium">{card.sub}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="card p-6 animate-fade-in-up stagger-3">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
                        <p className="text-sm text-gray-500">Last 30 days — BHD</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-land-50 rounded-lg">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-land-600" />
                        <span className="text-sm font-semibold text-green-land-700">Active</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={revenueChart}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1abb6b" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#1abb6b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={{ stroke: '#f3f4f6' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#1abb6b"
                            strokeWidth={2.5}
                            fill="url(#revenueGradient)"
                            name="Revenue"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="card overflow-hidden animate-fade-in-up stagger-4">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Latest transactions</p>
                        </div>
                        <a
                            href="/admin/orders"
                            className="text-sm font-semibold text-green-land-600 hover:text-green-land-700 transition-colors"
                        >
                            View all
                        </a>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Order</th>
                                <th className="table-header">Customer</th>
                                <th className="table-header">Status</th>
                                <th className="table-header text-right">Total (BHD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order, idx) => (
                                <tr key={order.id} className="table-row">
                                    <td className="table-cell">
                                        <span className="font-semibold text-gray-900">{order.order_number}</span>
                                    </td>
                                    <td className="table-cell text-gray-600">{order.customer?.name}</td>
                                    <td className="table-cell">
                                        <span className={`badge ${statusColors[order.status] || 'bg-gray-50 text-gray-600'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="table-cell text-right">
                                        <span className="font-bold text-gray-900">BD {Number(order.total).toFixed(3)}</span>
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <ShoppingBagIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No orders yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Orders will appear here once created</p>
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
