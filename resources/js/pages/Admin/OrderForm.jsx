import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const VAT_RATE = 0.10;
const customers = window.formData?.customers || [];
const services = window.formData?.services || [];

export default function OrderForm() {
    const navigate = useNavigate();
    const [customerId, setCustomerId] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ service_id: '', quantity: 1 }]);

    const addItem = () => setItems([...items, { service_id: '', quantity: 1 }]);

    const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

    const updateItem = (i, field, value) => {
        const updated = [...items];
        updated[i][field] = value;
        setItems(updated);
    };

    const getServicePrice = (serviceId) => {
        const svc = services.find((s) => s.id === parseInt(serviceId));
        return svc ? parseFloat(svc.price) : 0;
    };

    const subtotal = items.reduce((sum, item) => {
        return sum + (getServicePrice(item.service_id) * (parseInt(item.quantity) || 0));
    }, 0);

    const vatAmount = subtotal * VAT_RATE;
    const total = subtotal + vatAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': window.csrf_token,
                },
                body: JSON.stringify({ customer_id: customerId, pickup_date: pickupDate, delivery_date: deliveryDate, notes, items }),
            });
            if (res.ok) {
                toast.success('Order created!');
                navigate('/orders');
            } else {
                toast.error('Failed to create order.');
            }
        } catch {
            toast.error('Network error.');
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
                <p className="text-gray-500 text-sm">BHD pricing — 10% VAT applied automatically</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer & Dates */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-land-500"
                            >
                                <option value="">Select customer...</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                            <input
                                type="datetime-local"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-land-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                            <input
                                type="datetime-local"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-land-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                        <button type="button" onClick={addItem} className="flex items-center space-x-1 text-green-land-600 text-sm font-medium hover:text-green-land-800">
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Item</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className="flex-1">
                                    <select
                                        value={item.service_id}
                                        onChange={(e) => updateItem(i, 'service_id', e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-land-500"
                                    >
                                        <option value="">Select service...</option>
                                        {services.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} — BD {Number(s.price).toFixed(3)}/{s.unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                                        placeholder="Qty"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-land-500"
                                    />
                                </div>
                                <div className="w-28 text-right pt-2 text-sm font-medium text-gray-700">
                                    BD {(getServicePrice(item.service_id) * (parseInt(item.quantity) || 0)).toFixed(3)}
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(i)} className="pt-2 text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>BD {subtotal.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>VAT (10%)</span>
                            <span>BD {vatAmount.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 text-base">
                            <span>Total</span>
                            <span>BD {total.toFixed(3)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-land-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        className="bg-green-land-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-land-700"
                    >
                        Create Order & Send WhatsApp
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/orders')}
                        className="bg-white text-gray-700 border border-gray-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
