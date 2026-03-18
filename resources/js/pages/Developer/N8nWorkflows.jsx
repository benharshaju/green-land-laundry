import React, { useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    BoltIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    MegaphoneIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    SparklesIcon,
    ClockIcon,
    SignalIcon,
} from '@heroicons/react/24/outline';

const n8nData = window.n8nData || {};
const {
    health = {},
    workflows = {},
    webhookUrl = '',
    categories = [],
    templates = [],
} = n8nData;

const statusIcons = {
    ok:      <CheckCircleIcon className="w-5 h-5 text-green-400" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />,
    error:   <XCircleIcon className="w-5 h-5 text-red-400" />,
};

const categoryIcons = {
    users:      UsersIcon,
    clipboard:  ClipboardDocumentListIcon,
    chart:      ChartBarIcon,
    currency:   CurrencyDollarIcon,
    briefcase:  BriefcaseIcon,
    megaphone:  MegaphoneIcon,
};

const categoryColors = {
    emerald: { bg: 'bg-emerald-900/30', border: 'border-emerald-700/50', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    blue:    { bg: 'bg-blue-900/30',    border: 'border-blue-700/50',    text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300' },
    purple:  { bg: 'bg-purple-900/30',  border: 'border-purple-700/50',  text: 'text-purple-400',  badge: 'bg-purple-500/20 text-purple-300' },
    amber:   { bg: 'bg-amber-900/30',   border: 'border-amber-700/50',   text: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300' },
    rose:    { bg: 'bg-rose-900/30',    border: 'border-rose-700/50',    text: 'text-rose-400',    badge: 'bg-rose-500/20 text-rose-300' },
    cyan:    { bg: 'bg-cyan-900/30',    border: 'border-cyan-700/50',    text: 'text-cyan-400',    badge: 'bg-cyan-500/20 text-cyan-300' },
};

const difficultyBadge = {
    easy:   'bg-green-500/20 text-green-300 border-green-600/30',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30',
    hard:   'bg-red-500/20 text-red-300 border-red-600/30',
};

const workflowLabels = {
    order_created:        'Order Created',
    order_status_changed: 'Order Status Changed',
    order_completed:      'Order Completed',
    customer_created:     'Customer Created',
    daily_report:         'Daily Report',
    payment_received:     'Payment Received',
};

function TemplateCard({ template, categoryColor }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const colors = categoryColors[categoryColor] || categoryColors.blue;

    const handleDownload = async () => {
        window.open(`/developer/n8n/templates/${template.id}/download`, '_blank');
    };

    const handleCopyWebhook = () => {
        const path = template.trigger.includes('Schedule') ? 'scheduled' : template.id;
        navigator.clipboard.writeText(`${webhookUrl}/${path}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all`}>
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold text-base leading-tight">{template.name}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${difficultyBadge[template.difficulty]}`}>
                        {template.difficulty}
                    </span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-4">{template.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-800/80 text-gray-300 px-2 py-1 rounded">
                        <BoltIcon className="w-3 h-3" />
                        {template.trigger}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-800/80 text-gray-300 px-2 py-1 rounded">
                        <ClockIcon className="w-3 h-3" />
                        {template.estimated_setup}
                    </span>
                </div>

                <div className={`text-xs ${colors.text} flex items-center gap-1 mb-4`}>
                    <SignalIcon className="w-3.5 h-3.5" />
                    <span className="font-medium">{template.business_impact}</span>
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                    {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
                    {expanded ? 'Hide' : 'Show'} workflow nodes ({template.nodes.length})
                </button>

                {expanded && (
                    <div className="mt-3 space-y-1">
                        {template.nodes.map((node, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center text-gray-500 font-mono text-[10px]">
                                    {i + 1}
                                </span>
                                <span>{node}</span>
                                {i < template.nodes.length - 1 && <span className="text-gray-600">→</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-800/50 px-5 py-3 flex gap-2">
                <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Download JSON
                </button>
                <button
                    onClick={handleCopyWebhook}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                >
                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Webhook'}
                </button>
            </div>
        </div>
    );
}

function CategorySection({ category }) {
    const colors = categoryColors[category.color] || categoryColors.blue;
    const Icon = categoryIcons[category.icon] || BoltIcon;
    const categoryTemplates = templates.filter(t => t.category === category.id);

    if (categoryTemplates.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">{category.name}</h2>
                    <p className="text-xs text-gray-500">{category.description}</p>
                </div>
                <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {categoryTemplates.length} workflow{categoryTemplates.length > 1 ? 's' : ''}
                </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryTemplates.map(template => (
                    <TemplateCard key={template.id} template={template} categoryColor={category.color} />
                ))}
            </div>
        </div>
    );
}

export default function N8nWorkflows() {
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('templates');

    const testConnection = async () => {
        setTesting(true);
        setMessage(null);
        try {
            const res = await fetch('/developer/n8n/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.csrf_token },
                body: JSON.stringify({ workflow: 'health_check' }),
            });
            setMessage({ type: res.ok ? 'success' : 'error', text: res.ok ? 'Connection successful!' : 'Connection failed' });
        } catch {
            setMessage({ type: 'error', text: 'Network error' });
        }
        setTesting(false);
    };

    const totalTemplates = templates.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">n8n Workflow Automation</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalTemplates} pre-built workflows ready to import
                    </p>
                </div>
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

            {/* Connection Status Bar */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {statusIcons[health.status] || statusIcons.warning}
                    <span className="text-white font-medium text-sm">{health.message || 'Unknown'}</span>
                </div>
                <span className="text-xs text-gray-500">n8n Cloud Instance</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'templates'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    <SparklesIcon className="w-4 h-4" />
                    Pre-Built Workflows ({totalTemplates})
                </button>
                <button
                    onClick={() => setActiveTab('webhooks')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'webhooks'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    <BoltIcon className="w-4 h-4" />
                    Active Webhooks
                </button>
                <button
                    onClick={() => setActiveTab('setup')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'setup'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    Setup Guide
                </button>
            </div>

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-10">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {categories.map(cat => {
                            const colors = categoryColors[cat.color] || categoryColors.blue;
                            const Icon = categoryIcons[cat.icon] || BoltIcon;
                            const count = templates.filter(t => t.category === cat.id).length;
                            return (
                                <div key={cat.id} className={`${colors.bg} border ${colors.border} rounded-xl p-3 text-center`}>
                                    <Icon className={`w-5 h-5 ${colors.text} mx-auto mb-1`} />
                                    <p className="text-white font-bold text-lg">{count}</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-wide">{cat.name}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Category Sections */}
                    {categories.map(category => (
                        <CategorySection key={category.id} category={category} />
                    ))}
                </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
                <div className="bg-gray-900 rounded-xl border border-gray-800">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Webhook Endpoints</h2>
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
            )}

            {/* Setup Guide Tab */}
            {activeTab === 'setup' && (
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Start Guide</h2>
                        <ol className="space-y-4 text-sm text-gray-300">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                                <div>
                                    <p className="text-white font-medium">Download a workflow template</p>
                                    <p className="text-gray-500 mt-1">Browse the pre-built workflows above and click "Download JSON" on any template you want to use.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                                <div>
                                    <p className="text-white font-medium">Import into n8n</p>
                                    <p className="text-gray-500 mt-1">Open your n8n dashboard, click "Add workflow" → "Import from File", and select the downloaded JSON file.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                                <div>
                                    <p className="text-white font-medium">Configure credentials</p>
                                    <p className="text-gray-500 mt-1">Set up your Twilio (WhatsApp), Google Sheets, and Email credentials in n8n's credential manager.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                                <div>
                                    <p className="text-white font-medium">Set environment variables</p>
                                    <p className="text-gray-500 mt-1">Add your <code className="bg-gray-800 px-1 rounded text-green-400">N8N_API_KEY</code> and <code className="bg-gray-800 px-1 rounded text-green-400">N8N_WEBHOOK_URL</code> to the <code className="bg-gray-800 px-1 rounded text-green-400">.env</code> file.</p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">5</span>
                                <div>
                                    <p className="text-white font-medium">Activate and test</p>
                                    <p className="text-gray-500 mt-1">Toggle the workflow to "Active" in n8n, then use the "Test Connection" button above to verify everything works.</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Environment Configuration</h2>
                        <pre className="text-xs text-green-400 bg-gray-950 rounded-lg p-4 overflow-x-auto">
{`# .env — n8n Workflow Automation
N8N_API_KEY=your-api-key-here
N8N_BASE_URL=https://greenlandlaundry.app.n8n.cloud
N8N_WEBHOOK_URL=https://greenlandlaundry.app.n8n.cloud/webhook
N8N_WEBHOOK_SECRET=your-secret-here
N8N_ENABLED=true`}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
