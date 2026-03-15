import React from 'react';

const stats = window.devData?.stats || {};

export default function DevDashboard() {
    const rows = [
        ['PHP Version', stats.php_version],
        ['Laravel Version', stats.laravel_version],
        ['Database Size', stats.db_size],
        ['Storage Used', stats.storage_used],
        ['Queue Jobs', stats.queue_jobs],
        ['Failed Jobs', stats.failed_jobs],
        ['Cache Driver', stats.cache_driver],
        ['Queue Driver', stats.queue_driver],
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">Developer Dashboard</h1>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <tbody>
                        {rows.map(([label, value]) => (
                            <tr key={label} className="border-b border-gray-800">
                                <td className="px-6 py-3 text-gray-400 w-48">{label}</td>
                                <td className="px-6 py-3 text-green-400 font-mono">{value || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
