import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const customers = window.customersData?.customers || [];

export default function Customers() {
    const [search, setSearch] = useState('');

    const filtered = customers.filter((c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 text-sm">{customers.length} registered customers</p>
                </div>
                <a
                    href="/admin/customers/create"
                    className="flex items-center space-x-2 bg-green-land-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-land-700"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>New Customer</span>
                </a>
            </div>

            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-land-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Area</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Loyalty Pts</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c) => (
                            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900">{c.name}</p>
                                        {c.name_arabic && <p className="text-gray-500 text-xs" dir="rtl">{c.name_arabic}</p>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                                <td className="px-6 py-4 text-gray-600">{c.area || '—'}</td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    BD {Number(c.total_spent || 0).toFixed(3)}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">{c.loyalty_points}</td>
                                <td className="px-6 py-4 text-right">
                                    <a href={`/admin/customers/${c.id}`} className="text-green-land-600 hover:text-green-land-800 font-medium">
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
