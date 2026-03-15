import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#dc2626'];

export default function Reports() {
    const [period, setPeriod] = useState('month');

    // Placeholder data — real data injected server-side
    const revenueData = window.reportsData?.revenue || [];
    const serviceData = window.reportsData?.byService || [];
    const summary     = window.reportsData?.summary || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500 text-sm">BHD revenue including 10% VAT breakdown</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                    <a
                        href="/admin/reports/export"
                        className="bg-green-land-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-land-700"
                    >
                        Export Excel
                    </a>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: `BD ${Number(summary.revenue || 0).toFixed(3)}` },
                    { label: 'VAT Collected (10%)', value: `BD ${Number(summary.vat || 0).toFixed(3)}` },
                    { label: 'Total Orders', value: summary.orders || 0 },
                    { label: 'Avg Order Value', value: `BD ${Number(summary.avg_order || 0).toFixed(3)}` },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <p className="text-sm text-gray-500">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Bar Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Day</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => `BD ${Number(v).toFixed(3)}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#16a34a" name="Revenue (BHD)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="vat" fill="#86efac" name="VAT (BHD)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Service Distribution Pie */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={serviceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                nameKey="name"
                            >
                                {serviceData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => `BD ${Number(v).toFixed(3)}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
