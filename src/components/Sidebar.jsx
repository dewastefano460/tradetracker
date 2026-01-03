import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, LineChart, Settings, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { cn } from '../lib/utils';

const Sidebar = () => {
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
        <div className="flex flex-col h-screen w-64 bg-surface border-r border-white/10 text-white">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    TradeTracker
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
