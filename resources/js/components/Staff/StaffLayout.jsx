import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon, ShoppingBagIcon, Bars3Icon, XMarkIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Orders',    href: '/orders',    icon: ShoppingBagIcon },
];

export default function StaffLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const user = window.auth_user;

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gray-50 bg-gradient-mesh">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="overlay lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-out shadow-sidebar',
                'bg-gradient-to-b from-green-land-800 to-green-land-900',
                'lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-5 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-sm shadow-gold-500/30">
                            <span className="text-white font-extrabold text-sm">GL</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Green Land</p>
                            <p className="text-white/40 text-[10px] font-medium">Staff Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white/40 hover:text-white p-1 transition-colors"
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
                                    active ? 'nav-item-active' : 'nav-item-inactive'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.name}</span>
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold-400 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="flex-shrink-0 border-t border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">
                                {(user?.name || 'S').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Staff'}</p>
                            <p className="text-white/40 text-xs">On Shift</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 glass border-b border-gray-200/60 h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden btn-icon"
                        >
                            <Bars3Icon className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold text-gray-700">Staff Portal</span>
                    </div>
                    <form method="POST" action="/logout">
                        <input type="hidden" name="_token" value={window.csrf_token} />
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500
                                       hover:text-red-600 hover:bg-red-50 transition-all duration-200"
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
