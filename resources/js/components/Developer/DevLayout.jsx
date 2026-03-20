import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon, ServerIcon, SparklesIcon, DocumentTextIcon, KeyIcon,
    Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const nav = [
    { name: 'Dashboard',     href: '/dashboard',     icon: HomeIcon },
    { name: 'System Health', href: '/system-health',  icon: ServerIcon },
    { name: 'AI Images',     href: '/ai-images',      icon: SparklesIcon },
    { name: 'Logs',          href: '/logs',            icon: DocumentTextIcon },
    { name: 'API Keys',      href: '/api-keys',        icon: KeyIcon },
];

export default function DevLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const user = window.auth_user;

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-out',
                'bg-gray-900 border-r border-gray-800/80',
                'lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-5 border-b border-gray-800/80 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-green-land-500 to-green-land-700 rounded-xl flex items-center justify-center shadow-sm shadow-green-land-500/20">
                            <span className="text-white font-extrabold text-sm">GL</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Green Land</p>
                            <p className="text-gray-500 text-[10px] font-medium">Developer Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-white p-1 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-4 px-2 space-y-0.5">
                    {nav.map((item) => {
                        const active = location.pathname === item.href ||
                            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                                    active
                                        ? 'bg-gray-800 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.name}</span>
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-green-land-500 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Terminal-style version */}
                <div className="flex-shrink-0 border-t border-gray-800/80 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">
                                {(user?.name || 'D').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Developer'}</p>
                            <p className="text-gray-500 text-xs font-mono">v3.0.0</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 glass-dark border-b border-gray-800/80 h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-800 hover:text-white transition-all"
                        >
                            <Bars3Icon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-mono text-gray-500">system online</span>
                        </div>
                    </div>
                    <form method="POST" action="/logout">
                        <input type="hidden" name="_token" value={window.csrf_token} />
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500
                                       hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                        >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            <span className="hidden sm:inline font-medium">Logout</span>
                        </button>
                    </form>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8 animate-fade-in-up" key={location.pathname}>
                    {children}
                </main>
            </div>
        </div>
    );
}
