import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PlusIcon, TrashIcon, ArrowLeftIcon,
    UserIcon, CalendarIcon, ClipboardDocumentListIcon, ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const VAT_RATE = 0.10;
const customers = window.formData?.customers || [];
const services = window.formData?.services || [];

function SectionHeader({ icon: Icon, title, subtitle, step }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-land-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-green-land-600" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-land-600 bg-green-land-50 px-2 py-0.5 rounded-md">
                        Step {step}
                    </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function OrderForm() {
    const navigate = useNavigate();
    const [customerId, setCustomerId] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ service_id: '', quantity: 1 }]);
    const [submitting, setSubmitting] = useState(false);

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
        setSubmitting(true);
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
                toast.success('Order created successfully!');
                navigate('/orders');
            } else {
                toast.error('Failed to create order.');
            }
        } catch {
            toast.error('Network error.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 animate-fade-in">
                <button
                    onClick={() => navigate('/orders')}
                    className="btn-icon"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="page-title">New Order</h1>
                    <p className="page-subtitle">BHD pricing — 10% VAT applied automatically</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Customer & Dates */}
                <div className="card p-6 animate-fade-in-up stagger-1">
                    <SectionHeader icon={UserIcon} title="Customer & Scheduling" step={1} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer *</label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                required
                                className="input"
                            >
                                <option value="">Select customer...</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Date *</label>
                            <input
                                type="datetime-local"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                required
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Date</label>
                            <input
                                type="datetime-local"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2: Items */}
                <div className="card p-6 animate-fade-in-up stagger-2">
                    <div className="flex items-start justify-between">
                        <SectionHeader icon={ClipboardDocumentListIcon} title="Order Items" subtitle="Add services and quantities" step={2} />
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1.5 text-green-land-600 text-sm font-semibold hover:text-green-land-700 transition-colors mt-1"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Item</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl group hover:bg-gray-100/80 transition-colors">
                                <div className="flex-1">
                                    <select
                                        value={item.service_id}
                                        onChange={(e) => updateItem(i, 'service_id', e.target.value)}
                                        required
                                        className="input bg-white"
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
                                        className="input bg-white text-center"
                                    />
                                </div>
                                <div className="w-28 text-right pt-2.5 text-sm font-bold text-gray-700">
                                    BD {(getServicePrice(item.service_id) * (parseInt(item.quantity) || 0)).toFixed(3)}
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="pt-2.5 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-6 pt-5 border-t border-gray-100 space-y-2.5">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium">BD {subtotal.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>VAT (10%)</span>
                            <span className="font-medium">BD {vatAmount.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span className="text-green-land-700">BD {total.toFixed(3)}</span>
                        </div>
                    </div>
                </div>

                {/* Step 3: Notes */}
                <div className="card p-6 animate-fade-in-up stagger-3">
                    <SectionHeader icon={ChatBubbleLeftIcon} title="Additional Notes" subtitle="Special instructions or preferences" step={3} />
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="input resize-none"
                        placeholder="e.g. Fragile items, starch preference, delivery time..."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 animate-fade-in-up stagger-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : null}
                        <span>{submitting ? 'Creating...' : 'Create Order & Send WhatsApp'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/orders')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
