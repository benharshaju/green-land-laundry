import React, { useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    BoltIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

const n8nData = window.n8nData || {};
const { health = {}, workflows = {}, webhookUrl = '' } = n8nData;

const statusIcons = {
    ok:      <CheckCircleIcon className="w-5 h-5 text-green-400" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />,
    error:   <XCircleIcon className="w-5 h-5 text-red-400" />,
};

const workflowLabels = {
    order_created:        'Order Created',
    order_status_changed: 'Order Status Changed',
    order_completed:      'Order Completed',
    customer_created:     'Customer Created',
    daily_report:         'Daily Report',
    payment_received:     'Payment Received',
};

export default function N8nWorkflows() {
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState(null);

    const testConnection = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const res = await fetch('/developer/n8n/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': window.csrf_token,
                },
                body: JSON.stringify({ workflow: 'health_check' }),
            });
            const text = await res.text();
            setMessage({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Connection successful!' : 'Connection failed' });
        } catch {
            setMessage({ type: 'error', text: 'Network error' });
        }
        setTesting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">n8n Workflow Automation</h1>
                <button
                    onClick={testConnection}
                    disabled={testing}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                    {testing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BoltIcon className="w-4 h-4" />}
                    <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
            </div>

            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Connection Status */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Connection Status</h2>
                <div className="flex items-center space-x-3">
                    {statusIcons[health.status] || statusIcons.warning}
                    <span className="text-white font-medium">{health.message || 'Unknown'}</span>
                </div>
            </div>

            {/* Configured Workflows */}
            <div className="bg-gray-900 rounded-xl border border-gray-800">
                <div className="px-6 py-4 border-b border-gray-800">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Configured Workflows</h2>
                </div>
                <div className="divide-y divide-gray-800">
                    {Object.entries(workflows).map(([key, path]) => (
                        <div key={key} className="flex items-center justify-between px-6 py-4">
                            <div>
                                <span className="text-white font-medium">{workflowLabels[key] || key}</span>
                                <p className="text-xs text-gray-500 mt-1">Event: {key}</p>
                            </div>
                            <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                {webhookUrl}{path}
                            </code>
                        </div>
                    ))}
                </div>
            </div>

            {/* Setup Guide */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Setup Guide</h2>
                <ol className="space-y-3 text-sm text-gray-300 list-decimal list-inside">
                    <li>Create webhook trigger nodes in n8n for each workflow above</li>
                    <li>Set the webhook paths to match the configured paths</li>
                    <li>Add your n8n API key to the <code className="bg-gray-800 px-1 rounded text-green-400">.env</code> file as <code className="bg-gray-800 px-1 rounded text-green-400">N8N_API_KEY</code></li>
                    <li>Set <code className="bg-gray-800 px-1 rounded text-green-400">N8N_ENABLED=true</code> in your environment</li>
                    <li>Use the &quot;Test Connection&quot; button to verify connectivity</li>
                </ol>
            </div>
        </div>
    );
}
