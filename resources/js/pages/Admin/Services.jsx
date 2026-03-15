import React, { useState } from 'react';
import { PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';

const services = window.servicesData?.services || [];
const categories = {
    wash_fold: 'Wash & Fold', dry_clean: 'Dry Cleaning',
    iron: 'Ironing', wash_iron: 'Wash & Iron',
    specialty: 'Specialty', express: 'Express',
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Services & Pricing</h1>
                    <p className="text-gray-500 text-sm">BHD pricing — VAT (10%) applied at checkout</p>
                </div>
                <a
                    href="/admin/services/create"
                    className="bg-green-land-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-land-700"
                >
                    Add Service
                </a>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveCategory('')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        !activeCategory ? 'bg-green-land-600 text-white border-green-land-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-land-400'
                    }`}
                >
                    All
                </button>
                {Object.entries(categories).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            activeCategory === key ? 'bg-green-land-600 text-white border-green-land-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-land-400'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((service) => (
                    <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Image */}
                        <div className="h-40 bg-gray-100 relative">
                            {(service.ai_image_url || service.image_url) ? (
                                <img
                                    src={service.ai_image_url || service.image_url}
                                    alt={service.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <SparklesIcon className="w-12 h-12" />
                                </div>
                            )}
                            <button
                                onClick={() => handleGenerateAiImage(service.id)}
                                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md hover:bg-black/80 flex items-center space-x-1"
                            >
                                <SparklesIcon className="w-3 h-3" />
                                <span>AI Image</span>
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">{service.name}</p>
                                    {service.name_arabic && (
                                        <p className="text-gray-500 text-xs mt-0.5" dir="rtl">{service.name_arabic}</p>
                                    )}
                                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                        {categories[service.category]}
                                    </span>
                                </div>
                                <a href={`/admin/services/${service.id}/edit`} className="text-gray-400 hover:text-gray-600">
                                    <PencilIcon className="w-4 h-4" />
                                </a>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-lg font-bold text-green-land-700">
                                    BD {Number(service.price).toFixed(3)}
                                    <span className="text-xs font-normal text-gray-500"> / {service.unit}</span>
                                </span>
                                {service.price_express && (
                                    <span className="text-sm text-orange-600 font-medium">
                                        Express: BD {Number(service.price_express).toFixed(3)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
