import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Eye, Plus, Archive, Trash2, ExternalLink } from 'lucide-react';
import Modal from '../components/Modal';

const RunningTrades = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');

    // Form State
    const [newTrade, setNewTrade] = useState({
        pair: '',
        op: '',
        sl: '',
        ft: '',
        img_before: '',
        img_after: '',
        result: 0 // Assume result can be input initially or 0 for running
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data, error } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'running')
                .order('open_date', { ascending: false });

            if (error) throw error;
            setTrades(data || []);
        } catch (error) {
            console.error('Error fetching trades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTrade(prev => ({
            ...prev,
            [name]: name.startsWith('img_') || name === 'pair' ? value : value
        }));
    };

    const handleAddTrade = async (e) => {
        e.preventDefault();
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
                result: parseFloat(newTrade.result) || 0,
                status: 'running',
                open_date: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('trades')
                .insert([tradeData])
                .select()
                .single();

            if (error) throw error;

            setTrades([data, ...trades]);
            setNewTrade({ pair: '', op: '', sl: '', ft: '', img_before: '', img_after: '', result: 0 });
        } catch (error) {
            console.error('Error adding trade:', error);
            alert('Gagal menambahkan trade.');
        } finally {
            setSaving(false);
        }
    };

    const openModal = (url) => {
        if (!url) return;
        setModalContent(url);
        setModalOpen(true);
    };

    const totalResult = trades.reduce((sum, trade) => sum + (trade.result || 0), 0);

    return (
        <div className="space-y-8">
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} content={modalContent} />

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white">Running Trades</h2>
                <p className="text-gray-400 mt-2">Pantau dan kelola posisi trading yang sedang aktif.</p>
            </div>

            {/* Form Input Position */}
            <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-xl">
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                    <Plus size={20} /> New Position
                </h3>
                <form onSubmit={handleAddTrade} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">

                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-xs font-medium text-gray-400">Pair</label>
                        <input
                            type="text" name="pair" value={newTrade.pair} onChange={handleInputChange}
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" placeholder="XAUUSD" required
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-xs font-medium text-gray-400">Open Price</label>
                        <input
                            type="number" name="op" value={newTrade.op} onChange={handleInputChange} step="any"
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" placeholder="0.00" required
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-xs font-medium text-gray-400">Stop Loss</label>
                        <input
                            type="number" name="sl" value={newTrade.sl} onChange={handleInputChange} step="any"
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none" placeholder="0.00"
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-xs font-medium text-gray-400">Final Target</label>
                        <input
                            type="number" name="ft" value={newTrade.ft} onChange={handleInputChange} step="any"
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none" placeholder="0.00"
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-xs font-medium text-gray-400">Before (Link)</label>
                        <input
                            type="url" name="img_before" value={newTrade.img_before} onChange={handleInputChange}
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" placeholder="https://..."
                        />
                    </div>

                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-xs font-medium text-gray-400">After (Link)</label>
                        <input
                            type="url" name="img_after" value={newTrade.img_after} onChange={handleInputChange}
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" placeholder="https://..."
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? '...' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Table Running Trades */}
            <div className="bg-surface rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Pair</th>
                                <th className="px-6 py-4">Open Price</th>
                                <th className="px-6 py-4">Stop Loss</th>
                                <th className="px-6 py-4">Target</th>
                                <th className="px-6 py-4 text-center">Before</th>
                                <th className="px-6 py-4 text-center">After</th>
                                <th className="px-6 py-4 text-right">Result ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-8">Loading trades...</td></tr>
                            ) : trades.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-8">No running trades found.</td></tr>
                            ) : (
                                trades.map((trade) => (
                                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{trade.pair}</td>
                                        <td className="px-6 py-4">{trade.op}</td>
                                        <td className="px-6 py-4 text-red-400">{trade.sl}</td>
                                        <td className="px-6 py-4 text-green-400">{trade.ft}</td>

                                        <td className="px-6 py-4 text-center">
                                            {trade.img_before ? (
                                                <button
                                                    onClick={() => openModal(trade.img_before)}
                                                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                >
                                                    <Camera size={18} />
                                                </button>
                                            ) : <span className="text-gray-600">-</span>}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            {trade.img_after ? (
                                                <button
                                                    onClick={() => openModal(trade.img_after)}
                                                    className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            ) : <span className="text-gray-600">-</span>}
                                        </td>

                                        <td className={`px-6 py-4 text-right font-medium ${trade.result >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.result > 0 ? '+' : ''}{trade.result}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Footer */}
                        {trades.length > 0 && (
                            <tfoot className="bg-white/5 font-bold text-white border-t border-white/10">
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-right">Total Result</td>
                                    <td className={`px-6 py-4 text-right ${totalResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {totalResult > 0 ? '+' : ''}{totalResult.toFixed(2)}
                                    </td>
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
