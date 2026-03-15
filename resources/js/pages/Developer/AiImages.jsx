import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const services = window.devData?.services || [];

export default function AiImages() {
    const [loading, setLoading] = useState(null);
    const [results, setResults] = useState({});

    const generate = async (serviceId, style = 'photorealistic') => {
        setLoading(serviceId);
        const res = await fetch('/developer/ai-images/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.csrf_token },
            body: JSON.stringify({ service_id: serviceId, style }),
        });
        const data = await res.json();
        setResults((prev) => ({ ...prev, [serviceId]: data.message || (res.ok ? 'Generated!' : 'Failed') }));
        setLoading(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">AI Image Generator</h1>
                <p className="text-gray-400 text-sm">Generate product images using DALL-E 3</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc) => (
                    <div key={svc.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="h-36 bg-gray-800 flex items-center justify-center">
                            {svc.ai_image_url ? (
                                <img src={svc.ai_image_url} alt={svc.name} className="w-full h-full object-cover" />
                            ) : (
                                <SparklesIcon className="w-10 h-10 text-gray-600" />
                            )}
                        </div>
                        <div className="p-4">
                            <p className="font-medium text-white text-sm">{svc.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">BD {Number(svc.price).toFixed(3)} / {svc.unit}</p>
                            {results[svc.id] && (
                                <p className="text-xs text-green-400 mt-1">{results[svc.id]}</p>
                            )}
                            <button
                                onClick={() => generate(svc.id)}
                                disabled={loading === svc.id}
                                className="mt-3 w-full flex items-center justify-center space-x-2 bg-green-land-700 text-white py-2 rounded-lg text-xs font-medium hover:bg-green-land-600 disabled:opacity-50"
                            >
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>{loading === svc.id ? 'Generating...' : 'Generate AI Image'}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
