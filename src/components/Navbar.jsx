import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, LineChart, Settings, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { cn } from '../lib/utils';

const Navbar = () => {
    const userEmail = 'Dewa'; // Static name
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const navItems = [
        { name: 'Running Trades', path: '/', icon: LayoutDashboard },
        { name: 'Trade History', path: '/history', icon: History },
        { name: 'Performance', path: '/performance', icon: LineChart },
        { name: 'Configuration', path: '/configuration', icon: Settings },
    ];

    return (
        <nav className="glass-panel sticky top-0 z-50 w-full shadow-soft transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* Logo & Nav Links (Desktop) */}
                    <div className="flex items-center gap-8">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                                <span className="font-bold text-lg">T</span>
                            </div>
                            <span className="font-bold text-xl text-text-primary tracking-tight">TradeCore</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-baseline space-x-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-blue-50 text-[#2563eb] font-semibold"
                                                : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-[#2563eb]" : "text-text-secondary group-hover:text-text-primary")} />
                                            {item.name}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: User & Logout & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        <button className="hidden md:block p-2 rounded-full text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors">
                            <span className="sr-only">Notifications</span>
                        </button>

                        <div className="flex items-center gap-3 pl-0 md:pl-4 md:border-l border-slate-200">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold text-text-primary leading-none">{userEmail}</span>
                                <span className="text-xs text-[#2563eb] font-medium mt-1">Pro Account</span>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-[#2563eb] font-bold ring-2 ring-white shadow-sm">
                                {userEmail.charAt(0)}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="hidden md:block ml-2 text-text-secondary hover:text-danger p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>

                            {/* Mobile Hamburger Menu */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-slate-100 transition-colors ml-2"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md animate-fade-in absolute w-full left-0 shadow-xl z-50">
                    <div className="px-4 py-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-[#2563eb] font-semibold"
                                            : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                                    )
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </NavLink>
                        ))}

                        {/* Mobile Logout Button */}
                        <div className="pt-3 mt-3 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
