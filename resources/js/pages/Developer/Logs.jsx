import React, { useState } from 'react';

const logs = window.devData?.logs || [];

export default function Logs() {
    const [filter, setFilter] = useState('');

    const filtered = logs.filter((l) =>
        !filter || l.toLowerCase().includes(filter.toLowerCase())
    );

    const getLineColor = (line) => {
        if (line.includes('ERROR') || line.includes('CRITICAL')) return 'text-red-400';
        if (line.includes('WARNING')) return 'text-yellow-400';
        if (line.includes('INFO')) return 'text-blue-400';
        return 'text-gray-400';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Application Logs</h1>
                <input
                    type="text"
                    placeholder="Filter logs..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-land-500 w-56"
                />
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 overflow-auto max-h-[70vh]">
                <pre className="text-xs font-mono space-y-0.5">
                    {filtered.map((line, i) => (
                        <div key={i} className={getLineColor(line)}>{line}</div>
                    ))}
                    {filtered.length === 0 && (
                        <span className="text-gray-600">No log entries found.</span>
                    )}
                </pre>
            </div>
        </div>
    );
}
