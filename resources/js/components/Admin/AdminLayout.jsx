import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon, ShoppingBagIcon, UsersIcon, SparklesIcon,
    DocumentTextIcon, ChartBarIcon, Cog6ToothIcon,
    Bars3Icon, XMarkIcon, BellIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
    { name: 'Dashboard',  href: '/dashboard',  icon: HomeIcon },
    { name: 'Orders',     href: '/orders',      icon: ShoppingBagIcon },
    { name: 'Customers',  href: '/customers',   icon: UsersIcon },
    { name: 'Services',   href: '/services',    icon: SparklesIcon },
    { name: 'Invoices',   href: '/invoices',    icon: DocumentTextIcon },
    { name: 'Reports',    href: '/reports',     icon: ChartBarIcon },
    { name: 'Settings',   href: '/settings',    icon: Cog6ToothIcon },
];

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                'fixed inset-y-0 left-0 z-50 w-64 bg-green-land-900 transform transition-transform lg:translate-x-0 lg:static lg:z-auto',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-6 border-b border-green-land-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">GL</span>
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">Green Land</p>
                            <p className="text-green-land-400 text-xs">Admin Portal</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-green-land-400">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 px-3">
                    {navigation.map((item) => {
                        const active = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-green-land-700 text-white'
                                        : 'text-green-land-300 hover:bg-green-land-800 hover:text-white'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-land-800">
                    <p className="text-green-land-500 text-xs text-center">
                        Green Land Laundry v3.0
                    </p>
                    <p className="text-green-land-600 text-xs text-center">Bahrain • BHD • 10% VAT</p>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
                        <Bars3Icon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center space-x-4 ml-auto">
                        <button className="relative text-gray-500 hover:text-gray-700">
                            <BellIcon className="w-6 h-6" />
                        </button>
                        <form method="POST" action="/logout">
                            <input type="hidden" name="_token" value={window.csrf_token} />
                            <button type="submit" className="text-sm text-gray-600 hover:text-red-600">
                                Logout
                            </button>
                        </form>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
