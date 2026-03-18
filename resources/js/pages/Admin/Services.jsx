import React, { useState } from 'react';
import { PencilIcon, SparklesIcon, TagIcon } from '@heroicons/react/24/outline';

const services = window.servicesData?.services || [];
const categories = {
    wash_fold: 'Wash & Fold', dry_clean: 'Dry Cleaning',
    iron: 'Ironing', wash_iron: 'Wash & Iron',
    specialty: 'Specialty', express: 'Express',
};

const categoryIcons = {
    wash_fold: '🧺', dry_clean: '👔', iron: '👕',
    wash_iron: '🫧', specialty: '✨', express: '⚡',
};

export default function Services() {
    const [activeCategory, setActiveCategory] = useState('');

    const filtered = services.filter((s) => !activeCategory || s.category === activeCategory);

    const handleGenerateAiImage = async (serviceId) => {
        const res = await fetch('/developer/ai-images/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.csrf_token },
            body: JSON.stringify({ service_id: serviceId }),
        });
        if (res.ok) alert('AI image generation started!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="page-title">Services & Pricing</h1>
                    <p className="page-subtitle">BHD pricing — VAT (10%) applied at checkout</p>
                </div>
                <a href="/admin/services/create" className="btn-primary inline-flex items-center gap-2 self-start">
                    <TagIcon className="w-4 h-4" />
                    <span>Add Service</span>
                </a>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2 animate-fade-in-up stagger-1">
                <button
                    onClick={() => setActiveCategory('')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                        !activeCategory
                            ? 'bg-green-land-600 text-white border-green-land-600 shadow-sm shadow-green-land-600/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-green-land-300 hover:text-green-land-700'
                    }`}
                >
                    All Services
                </button>
                {Object.entries(categories).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                            activeCategory === key
                                ? 'bg-green-land-600 text-white border-green-land-600 shadow-sm shadow-green-land-600/20'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-land-300 hover:text-green-land-700'
                        }`}
                    >
                        <span className="mr-1.5">{categoryIcons[key]}</span>
                        {label}
                    </button>
                ))}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up stagger-2">
                {filtered.map((service) => (
                    <div key={service.id} className="card-hover overflow-hidden group">
                        {/* Image */}
                        <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                            {(service.ai_image_url || service.image_url) ? (
                                <img
                                    src={service.ai_image_url || service.image_url}
                                    alt={service.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <SparklesIcon className="w-14 h-14 text-gray-200" />
                                </div>
                            )}
                            <button
                                onClick={() => handleGenerateAiImage(service.id)}
                                className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg
                                           hover:bg-black/90 flex items-center gap-1.5 transition-all duration-200
                                           opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                            >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>Generate AI Image</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">{service.name}</p>
                                    {service.name_arabic && (
                                        <p className="text-gray-400 text-xs mt-0.5" dir="rtl">{service.name_arabic}</p>
                                    )}
                                    <span className="inline-flex items-center mt-2 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                                        <span className="mr-1">{categoryIcons[service.category]}</span>
                                        {categories[service.category]}
                                    </span>
                                </div>
                                <a
                                    href={`/admin/services/${service.id}/edit`}
                                    className="p-2 rounded-xl text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </a>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xl font-extrabold text-green-land-700">
                                    BD {Number(service.price).toFixed(3)}
                                    <span className="text-xs font-medium text-gray-400 ml-1">/ {service.unit}</span>
                                </span>
                                {service.price_express && (
                                    <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg font-semibold border border-orange-200/50">
                                        ⚡ BD {Number(service.price_express).toFixed(3)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="empty-state">
                    <SparklesIcon className="empty-state-icon" />
                    <p className="text-gray-500 font-medium">No services in this category</p>
                </div>
            )}
        </div>
    );
}
