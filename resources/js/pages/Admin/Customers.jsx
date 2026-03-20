import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline';

const customers = window.customersData?.customers || [];

function CustomerAvatar({ name }) {
    const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = [
        'from-blue-400 to-blue-600',
        'from-green-land-400 to-green-land-600',
        'from-violet-400 to-violet-600',
        'from-amber-400 to-amber-600',
        'from-rose-400 to-rose-600',
        'from-cyan-400 to-cyan-600',
    ];
    const colorIdx = (name || '').length % colors.length;
    return (
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">{initials}</span>
        </div>
    );
}

export default function Customers() {
    const [search, setSearch] = useState('');

    const filtered = customers.filter((c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">{customers.length} registered customers</p>
                </div>
                <a href="/admin/customers/create" className="btn-primary inline-flex items-center gap-2 self-start">
                    <PlusIcon className="w-4 h-4" />
                    <span>New Customer</span>
                </a>
            </div>

            {/* Search */}
            <div className="relative animate-fade-in-up stagger-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-search max-w-md"
                />
            </div>

            {/* Table */}
            <div className="card overflow-hidden animate-fade-in-up stagger-2">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="table-header">Customer</th>
                                <th className="table-header">Phone</th>
                                <th className="table-header hidden md:table-cell">Area</th>
                                <th className="table-header text-right">Total Spent</th>
                                <th className="table-header text-right hidden sm:table-cell">Loyalty</th>
                                <th className="table-header w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="table-row group">
                                    <td className="table-cell">
                                        <div className="flex items-center gap-3">
                                            <CustomerAvatar name={c.name} />
                                            <div>
                                                <p className="font-semibold text-gray-900">{c.name}</p>
                                                {c.name_arabic && (
                                                    <p className="text-gray-400 text-xs mt-0.5" dir="rtl">{c.name_arabic}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell text-gray-600 font-mono text-xs">{c.phone}</td>
                                    <td className="table-cell text-gray-500 hidden md:table-cell">{c.area || '—'}</td>
                                    <td className="table-cell text-right">
                                        <span className="font-bold text-gray-900">BD {Number(c.total_spent || 0).toFixed(3)}</span>
                                    </td>
                                    <td className="table-cell text-right hidden sm:table-cell">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold-400/10 text-gold-600 rounded-lg text-xs font-semibold">
                                            <StarIcon className="w-3 h-3" />
                                            {c.loyalty_points}
                                        </span>
                                    </td>
                                    <td className="table-cell text-right">
                                        <a
                                            href={`/admin/customers/${c.id}`}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold
                                                       text-green-land-700 bg-green-land-50 hover:bg-green-land-100
                                                       opacity-0 group-hover:opacity-100 transition-all duration-200"
                                        >
                                            View
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <UsersIcon className="empty-state-icon" />
                                        <p className="text-gray-500 font-medium">No customers found</p>
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
