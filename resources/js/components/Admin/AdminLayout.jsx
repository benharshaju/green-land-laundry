import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    HomeIcon, ShoppingBagIcon, UsersIcon, SparklesIcon,
    DocumentTextIcon, ChartBarIcon, Cog6ToothIcon,
    Bars3Icon, XMarkIcon, BellIcon, CpuChipIcon,
    ArrowRightOnRectangleIcon, MagnifyingGlassIcon,
    ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
    { name: 'Dashboard',  href: '/dashboard',  icon: HomeIcon },
    { name: 'Orders',     href: '/orders',      icon: ShoppingBagIcon },
    { name: 'Customers',  href: '/customers',   icon: UsersIcon },
    { name: 'Services',   href: '/services',    icon: SparklesIcon },
    { name: 'Invoices',   href: '/invoices',    icon: DocumentTextIcon },
    { name: 'Machines',   href: '/machines',    icon: CpuChipIcon },
    { name: 'Reports',    href: '/reports',     icon: ChartBarIcon },
    { name: 'Settings',   href: '/settings',    icon: Cog6ToothIcon },
];

function UserAvatar({ name, collapsed }) {
    const initials = (name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className={clsx(
            'flex items-center gap-3 transition-all duration-300',
            collapsed ? 'justify-center' : 'px-3'
        )}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white font-bold text-xs">{initials}</span>
            </div>
            {!collapsed && (
                <div className="min-w-0 animate-fade-in">
                    <p className="text-white text-sm font-semibold truncate">{name || 'Admin'}</p>
                    <p className="text-white/40 text-xs truncate">{window.auth_user?.email}</p>
                </div>
            )}
        </div>
    );
}

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const user = window.auth_user;

    // Close mobile sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';

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
                'fixed inset-y-0 left-0 z-50 bg-gradient-green flex flex-col transition-all duration-300 ease-out',
                sidebarWidth,
                'lg:translate-x-0 lg:z-auto shadow-sidebar',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* Logo */}
                <div className={clsx(
                    'flex h-16 items-center border-b border-white/10 flex-shrink-0 transition-all duration-300',
                    collapsed ? 'justify-center px-2' : 'justify-between px-5'
                )}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-gold-500/30">
                            <span className="text-white font-extrabold text-sm">GL</span>
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 animate-fade-in">
                                <p className="text-white font-bold text-sm truncate">Green Land</p>
                                <p className="text-white/40 text-[10px] font-medium truncate">Admin Portal</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white/40 hover:text-white p-1 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-4 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
                    {navigation.map((item) => {
                        const active = location.pathname === item.href ||
                            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                title={collapsed ? item.name : undefined}
                                className={clsx(
                                    active ? 'nav-item-active' : 'nav-item-inactive',
                                    collapsed && 'justify-center px-2'
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="truncate">{item.name}</span>}
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold-400 rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Footer */}
                <div className="flex-shrink-0 border-t border-white/10 py-4 px-2 space-y-3">
                    <UserAvatar name={user?.name} collapsed={collapsed} />

                    {/* Collapse toggle - desktop only */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex items-center justify-center w-full py-2 text-white/30 hover:text-white/60 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <ChevronLeftIcon className={clsx(
                            'w-4 h-4 transition-transform duration-300',
                            collapsed && 'rotate-180'
                        )} />
                    </button>

                    {!collapsed && (
                        <p className="text-white/20 text-[10px] text-center font-medium animate-fade-in">
                            v3.0 — Bahrain
                        </p>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className={clsx(
                'flex flex-col min-h-screen transition-all duration-300 ease-out',
                collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
            )}>
                {/* Top bar */}
                <header className="sticky top-0 z-30 glass border-b border-gray-200/60 h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden btn-icon"
                        >
                            <Bars3Icon className="w-5 h-5" />
                        </button>

                        {/* Search bar */}
                        <div className="hidden sm:block relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search orders, customers..."
                                className="w-64 pl-9 pr-4 py-2 bg-gray-100/80 border-0 rounded-xl text-sm placeholder-gray-400
                                           focus:bg-white focus:ring-2 focus:ring-green-land-500/20 focus:shadow-sm
                                           transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <button className="btn-icon relative">
                            <BellIcon className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                        {/* Logout */}
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
                    </div>
                </header>

                {/* Page content with entrance animation */}
                <main className="flex-1 p-4 lg:p-8 animate-fade-in-up" key={location.pathname}>
                    {children}
                </main>
            </div>
        </div>
    );
}
