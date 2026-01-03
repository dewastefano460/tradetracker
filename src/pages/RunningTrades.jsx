import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Eye, Plus, Edit2, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Modal from '../components/Modal';
import EditTradeModal from '../components/EditTradeModal';
import AddTradeModal from '../components/AddTradeModal';
import { cn } from '../lib/utils';

const RunningTrades = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ pair_prefix: '', pair_suffix: '' });

    // Modal States
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalContent, setViewModalContent] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfileAndTrades();
    }, []);

    const fetchProfileAndTrades = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase.from('profiles').select('pair_prefix, pair_suffix').eq('id', user.id).single();
            if (profileData) setProfile(profileData);

            const { data: tradesData, error } = await supabase.from('trades').select('*').in('status', ['running', 'unfill', 'be']).eq('user_id', user.id).order('open_date', { ascending: false });
            if (error) throw error;
            setTrades(tradesData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrade = async (newTrade) => {
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const tradeData = {
                user_id: user.id,
                pair: newTrade.pair.toUpperCase(),
                op: parseFloat(newTrade.op) || 0,
                sl: parseFloat(newTrade.sl) || 0,
                ft: parseFloat(newTrade.ft) || 0,
                img_before: newTrade.img_before,
                img_after: newTrade.img_after,
                result: 0,
                status: 'running',
                open_date: new Date().toISOString()
            };

            const { data, error } = await supabase.from('trades').insert([tradeData]).select().single();
            if (error) throw error;

            setTrades([data, ...trades]);
            setAddModalOpen(false);
        } catch (error) {
            console.error('Error adding trade:', error);
            alert('Gagal menambahkan trade.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTrade = (updatedTrade) => {
        // Remove if status is closed or cancel
        if (['closed', 'cancel'].includes(updatedTrade.status)) {
            setTrades(trades.filter(t => t.id !== updatedTrade.id));
        } else {
            setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
        }
    };

    const openViewModal = (url) => { if (url) { setViewModalContent(url); setViewModalOpen(true); } };
    const openEditModal = (trade) => { setSelectedTrade(trade); setEditModalOpen(true); };
    const formatPair = (pair) => `${profile.pair_prefix || ''}${pair}${profile.pair_suffix || ''}`;
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const getStatusLabel = (status) => status === 'be' ? 'G.F. Target' : status;
    const totalResult = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);

    return (
        <div className="space-y-8 pb-12">
            <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} content={viewModalContent} />
            {selectedTrade && <EditTradeModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} trade={selectedTrade} onUpdate={handleUpdateTrade} />}
            <AddTradeModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddTrade} saving={saving} />

            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Running Trades</h1>
                    <p className="text-text-secondary mt-1">Monitor active market positions and real-time PnL.</p>
                </div>
                <button
                    onClick={() => setAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-[#1e3e94] hover:bg-[#152c6b] text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                    <Plus size={18} />
                    New Position
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total PNL Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Floating PnL</p>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-text-primary">
                                {totalResult > 0 ? '+' : ''}{totalResult.toFixed(2)}R
                            </h2>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
                                totalResult >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                                {totalResult >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {Math.abs(totalResult * 5)}% {/* Dummy percentage */}
                            </span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-text-secondary">
                        <Wallet size={24} />
                    </div>
                </div>

                {/* Active Positions Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Active Positions</p>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-text-primary">{trades.length}</h2>
                            <span className="text-text-secondary text-sm font-medium">trades open</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-text-secondary">
                        <Activity size={24} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-text-secondary w-16 uppercase text-xs tracking-wider">No</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Pair / Type</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">OP</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">SL</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">TP</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-center">Analysis</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-right">Result</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-right">Dates</th>
                                <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="10" className="text-center py-12 text-text-secondary">Loading trades...</td></tr>
                            ) : trades.length === 0 ? (
                                <tr><td colSpan="10" className="text-center py-12 text-text-secondary">No active positions to display.</td></tr>
                            ) : (
                                trades.map((trade, index) => (
                                    <tr key={trade.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-5 text-text-secondary font-medium">{String(index + 1).padStart(2, '0')}</td>
                                        <td className="px-6 py-5">
                                            <span className="block font-bold text-text-primary text-base">{formatPair(trade.pair)}</span>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-text-secondary">{trade.op}</td>
                                        <td className="px-6 py-5 font-mono text-xs text-text-secondary">{trade.sl || '-'}</td>
                                        <td className="px-6 py-5 font-mono text-xs text-text-secondary">{trade.ft || '-'}</td>

                                        <td className="px-6 py-5">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize",
                                                trade.status === 'running' ? "bg-blue-100 text-blue-800" :
                                                    trade.status === 'be' ? "bg-purple-100 text-purple-800" :
                                                        "bg-gray-100 text-gray-800"
                                            )}>
                                                {getStatusLabel(trade.status)}
                                            </span>
                                        </td>

                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                {trade.img_before && (
                                                    <button onClick={() => openViewModal(trade.img_before)} className="text-gray-400 hover:text-[#1e3e94] hover:scale-110 transform transition-all">
                                                        <Camera size={18} />
                                                    </button>
                                                )}
                                                {trade.img_after && (
                                                    <button onClick={() => openViewModal(trade.img_after)} className="text-gray-400 hover:text-purple-600 hover:scale-110 transform transition-all">
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                {!trade.img_before && !trade.img_after && <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>

                                        <td className={cn(
                                            "px-6 py-5 text-right font-bold text-base",
                                            trade.result > 0 ? "text-green-600" : trade.result < 0 ? "text-red-600" : "text-text-secondary"
                                        )}>
                                            {trade.result > 0 ? '+' : ''}{trade.result.toFixed(2)}R
                                        </td>

                                        <td className="px-6 py-5 text-right">
                                            <div className="text-xs text-text-secondary">Open: {formatDate(trade.open_date)}</div>
                                            <div className="text-xs text-text-secondary mt-0.5">Close: --</div>
                                        </td>

                                        <td className="px-6 py-5 text-center">
                                            <button onClick={() => openEditModal(trade)} className="text-text-secondary hover:text-[#1e3e94] p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Footer */}
                        {trades.length > 0 && (
                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-right font-bold text-text-secondary text-xs uppercase tracking-wider">Total Result (Running)</td>
                                    <td className={cn("px-6 py-4 text-right font-bold text-base", totalResult >= 0 ? "text-green-600" : "text-red-600")}>
                                        {totalResult > 0 ? '+' : ''}{totalResult.toFixed(2)}R
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RunningTrades;
