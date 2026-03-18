import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon, ServerIcon, SparklesIcon, DocumentTextIcon, KeyIcon, BoltIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const nav = [
    { name: 'Dashboard',     href: '/dashboard',     icon: HomeIcon },
    { name: 'System Health', href: '/system-health',  icon: ServerIcon },
    { name: 'n8n Workflows', href: '/n8n',            icon: BoltIcon },
    { name: 'AI Images',     href: '/ai-images',      icon: SparklesIcon },
    { name: 'Logs',          href: '/logs',            icon: DocumentTextIcon },
    { name: 'API Keys',      href: '/api-keys',        icon: KeyIcon },
];

export default function DevLayout({ children }) {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <aside className="fixed inset-y-0 left-0 w-56 bg-gray-900 border-r border-gray-800">
                <div className="h-16 flex items-center px-5 border-b border-gray-800">
                    <div className="w-7 h-7 bg-green-land-600 rounded mr-2 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">GL</span>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">Green Land</p>
                        <p className="text-gray-400 text-xs">Developer Portal</p>
                    </div>
                </div>
                <nav className="mt-4 px-3">
                    {nav.map((item) => {
                        const active = location.pathname.startsWith(item.href);
                        return (
                            <Link key={item.name} to={item.href} className={clsx(
                                'flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors',
                                active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}>
                                <item.icon className="w-4 h-4" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <div className="pl-56">
                <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-6 justify-between">
                    <span className="text-sm text-gray-400">Developer Portal</span>
                    <form method="POST" action="/logout">
                        <input type="hidden" name="_token" value={window.csrf_token} />
                        <button className="text-sm text-gray-500 hover:text-red-400">Logout</button>
                    </form>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
