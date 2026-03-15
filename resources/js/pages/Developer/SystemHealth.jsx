import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const checks = window.devData?.checks || {};

const icons = {
    ok:      <CheckCircleIcon className="w-5 h-5 text-green-400" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />,
    error:   <XCircleIcon className="w-5 h-5 text-red-400" />,
};

export default function SystemHealth() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
                {Object.entries(checks).map(([key, check]) => (
                    <div key={key} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center space-x-3">
                            {icons[check.status] || icons.warning}
                            <span className="capitalize text-white">{key}</span>
                        </div>
                        <span className="text-sm text-gray-400">{check.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
