import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen bg-background text-white font-sans selection:bg-blue-500/30">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
