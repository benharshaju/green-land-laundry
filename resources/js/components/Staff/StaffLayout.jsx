import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const nav = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Orders',    href: '/orders',    icon: ShoppingBagIcon },
];

export default function StaffLayout({ children }) {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-gray-50">
            <aside className="fixed inset-y-0 left-0 w-56 bg-green-land-800">
                <div className="h-16 flex items-center px-6 border-b border-green-land-700">
                    <div className="w-7 h-7 bg-gold-500 rounded mr-2 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">GL</span>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">Green Land</p>
                        <p className="text-green-land-400 text-xs">Staff Portal</p>
                    </div>
                </div>
                <nav className="mt-4 px-3">
                    {nav.map((item) => {
                        const active = location.pathname.startsWith(item.href);
                        return (
                            <Link key={item.name} to={item.href} className={clsx(
                                'flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium',
                                active ? 'bg-green-land-700 text-white' : 'text-green-land-300 hover:bg-green-land-700 hover:text-white'
                            )}>
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <div className="pl-56">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between">
                    <span className="text-sm font-medium text-gray-700">Staff Portal</span>
                    <form method="POST" action="/logout">
                        <input type="hidden" name="_token" value={window.csrf_token} />
                        <button className="text-sm text-gray-500 hover:text-red-600">Logout</button>
                    </form>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
