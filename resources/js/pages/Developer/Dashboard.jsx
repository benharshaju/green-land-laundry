import React from 'react';
import {
    ServerIcon, CircleStackIcon, CpuChipIcon, CloudIcon,
} from '@heroicons/react/24/outline';

const stats = window.devData?.stats || {};

const sections = [
    {
        title: 'Runtime',
        icon: CpuChipIcon,
        rows: [
            ['PHP Version', stats.php_version],
            ['Laravel Version', stats.laravel_version],
        ],
    },
    {
        title: 'Storage',
        icon: CircleStackIcon,
        rows: [
            ['Database Size', stats.db_size],
            ['Storage Used', stats.storage_used],
        ],
    },
    {
        title: 'Queue',
        icon: CloudIcon,
        rows: [
            ['Queue Jobs', stats.queue_jobs],
            ['Failed Jobs', stats.failed_jobs],
        ],
    },
    {
        title: 'Infrastructure',
        icon: ServerIcon,
        rows: [
            ['Cache Driver', stats.cache_driver],
            ['Queue Driver', stats.queue_driver],
        ],
    },
];

export default function DevDashboard() {
    return (
        <div className="space-y-8">
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white tracking-tight">Developer Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">System overview and infrastructure status</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sections.map((section, idx) => (
                    <div
                        key={section.title}
                        className={`bg-gray-900 rounded-2xl border border-gray-800/80 overflow-hidden
                                   animate-fade-in-up stagger-${idx + 1}`}
                    >
                        <div className="px-5 py-4 border-b border-gray-800/80 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                                <section.icon className="w-4 h-4 text-green-land-400" />
                            </div>
                            <h3 className="font-bold text-white text-sm">{section.title}</h3>
                        </div>
                        <div className="divide-y divide-gray-800/60">
                            {section.rows.map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/30 transition-colors">
                                    <span className="text-sm text-gray-400">{label}</span>
                                    <span className="text-sm font-mono font-semibold text-green-400">{value || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
