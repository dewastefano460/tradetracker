import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, LineChart, Settings, LogOut, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { cn } from '../lib/utils';

const Navbar = () => {
    const [userEmail, setUserEmail] = useState('Trader');

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Get name from email (before @)
                const name = user.email.split('@')[0];
                // Capitalize first letter
                setUserEmail(name.charAt(0).toUpperCase() + name.slice(1));
            }
        });
    }, []);

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
        <div className="bg-surface border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* Logo & Nav Links */}
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold">
                                T
                            </div>
                            <span className="font-bold text-xl text-brand-dark tracking-tight">TradeCore</span>
                        </div>

                        <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        cn(
                                            "inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors duration-200",
                                            isActive
                                                ? "border-brand-blue text-brand-blue"
                                                : "border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300"
                                        )
                                    }
                                >
                                    {({ isActive }) => (
                                        <span className="flex items-center gap-2">
                                            <item.icon className={cn("w-4 h-4", isActive ? "text-brand-blue" : "text-text-secondary")} />
                                            {item.name}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: User & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-text-primary">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-brand-blue">
                                <User size={16} />
                            </div>
                            <span>{userEmail}</span>
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        <button
                            onClick={handleLogout}
                            className="text-text-secondary hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Navbar;
