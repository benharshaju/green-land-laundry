import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const checks = window.devData?.checks || {};

const statusConfig = {
    ok: {
        icon: CheckCircleIcon,
        iconClass: 'text-green-400',
        bgClass: 'bg-green-400/10',
        ringClass: 'ring-green-400/20',
        label: 'Healthy',
    },
    warning: {
        icon: ExclamationTriangleIcon,
        iconClass: 'text-amber-400',
        bgClass: 'bg-amber-400/10',
        ringClass: 'ring-amber-400/20',
        label: 'Warning',
    },
    error: {
        icon: XCircleIcon,
        iconClass: 'text-red-400',
        bgClass: 'bg-red-400/10',
        ringClass: 'ring-red-400/20',
        label: 'Error',
    },
};

export default function SystemHealth() {
    const entries = Object.entries(checks);
    const okCount = entries.filter(([, c]) => c.status === 'ok').length;

    return (
        <div className="space-y-8">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white tracking-tight">System Health</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {okCount}/{entries.length} checks passing
                </p>
            </div>

            {/* Overall status */}
            <div className={`rounded-2xl p-5 border animate-fade-in-up stagger-1 ${
                okCount === entries.length
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                        okCount === entries.length ? 'bg-green-500' : 'bg-amber-500'
                    } animate-pulse`}></div>
                    <p className={`font-bold ${
                        okCount === entries.length ? 'text-green-400' : 'text-amber-400'
                    }`}>
                        {okCount === entries.length ? 'All systems operational' : 'Some checks need attention'}
                    </p>
                </div>
            </div>

            {/* Health checks */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800/80 overflow-hidden divide-y divide-gray-800/60 animate-fade-in-up stagger-2">
                {entries.map(([key, check]) => {
                    const config = statusConfig[check.status] || statusConfig.warning;
                    const Icon = config.icon;
                    return (
                        <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl ${config.bgClass} ring-1 ${config.ringClass} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${config.iconClass}`} />
                                </div>
                                <div>
                                    <span className="capitalize text-white font-semibold text-sm">{key}</span>
                                    <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
                                </div>
                            </div>
                            <span className={`badge text-xs ${config.bgClass} ${config.iconClass} ring-1 ${config.ringClass}`}>
                                {config.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
