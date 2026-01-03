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
        <div className="flex flex-col h-screen w-64 bg-surface border-r border-text-muted/20 text-text-primary shadow-sm">
            <div className="p-6 border-b border-text-muted/20">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
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
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                                isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                                    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-text-secondary")} />
                                <span>{item.name}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-text-muted/20">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
