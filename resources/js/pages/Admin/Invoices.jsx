import React from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const invoices = window.invoicesData?.invoices || [];

const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
};

export default function Invoices() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                <p className="text-gray-500 text-sm">Tax invoices with 10% VAT — BHD</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">VAT (10%)</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                                <td className="px-6 py-4 text-gray-600">{inv.order?.order_number}</td>
                                <td className="px-6 py-4 text-gray-700">{inv.customer?.name}</td>
                                <td className="px-6 py-4 text-gray-600">{inv.issue_date}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">BD {Number(inv.subtotal).toFixed(3)}</td>
                                <td className="px-6 py-4 text-right text-gray-600">BD {Number(inv.vat_amount).toFixed(3)}</td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">BD {Number(inv.total).toFixed(3)}</td>
                                <td className="px-6 py-4 text-right">
                                    <a
                                        href={`/admin/invoices/${inv.id}/pdf`}
                                        className="flex items-center space-x-1 text-green-land-600 hover:text-green-land-800"
                                    >
                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                        <span>PDF</span>
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No invoices yet</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
