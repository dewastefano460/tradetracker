import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Eye, Plus, Edit2, Wallet, Activity, ArrowUpRight, ArrowDownRight, Target, TrendingUp } from 'lucide-react';
import Modal from '../components/Modal';
import EditTradeModal from '../components/EditTradeModal';
import AddTradeModal from '../components/AddTradeModal';
import { cn } from '../lib/utils';

const RunningTrades = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ pair_prefix: '', pair_suffix: '', risk_per_trade_percent: 1, initial_balance: 0 });
    const [filterStatus, setFilterStatus] = useState('All');
    // Metrics States
    const [realizedProfit, setRealizedProfit] = useState(0);
    const [totalClosedCount, setTotalClosedCount] = useState(0);
    const [winCount, setWinCount] = useState(0);

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

            // Parallel Fetch: Profile, Running Trades, Closed Trades Summary
            const [profileResult, tradesResult, closedResult] = await Promise.all([
                supabase.from('profiles').select('pair_prefix, pair_suffix, risk_per_trade_percent, initial_balance').eq('id', user.id).single(),
                supabase.from('trades').select('*').in('status', ['running', 'unfill', 'be']).eq('user_id', user.id).order('open_date', { ascending: false }),
                supabase.from('trades').select('result, risk_usd').in('status', ['closed', 'done']).eq('user_id', user.id)
            ]);

            // Handle Profile
            if (profileResult.error) console.error('Profile error:', profileResult.error);
            if (profileResult.data) setProfile(profileResult.data);

            // Handle Running Trades (Main Data)
            if (tradesResult.error) throw tradesResult.error;
            const tradesData = tradesResult.data;

            // Handle Closed Trades (Summary Stats)
            if (closedResult.error) console.error('Error fetching closed trades:', closedResult.error);
            const closedTradesData = closedResult.data;

            // Calculate Metrics from DB
            const closedTrades = closedTradesData || [];
            const totalProfit = closedTrades.reduce((sum, t) => sum + ((t.result || 0) * (t.risk_usd || 0)), 0);
            const wins = closedTrades.filter(t => (t.result || 0) > 0).length;

            setRealizedProfit(totalProfit);
            setTotalClosedCount(closedTrades.length);
            setWinCount(wins);

            // Normalize trade data to ensure all fields have valid values
            const normalizedTrades = (tradesData || []).map(trade => ({
                ...trade,
                result: trade.result || 0,
                risk_usd: trade.risk_usd || 0,
                op: trade.op || 0,
                sl: trade.sl || 0,
                ft: trade.ft || 0
            }));

            setTrades(normalizedTrades);
        } catch (error) {
            console.error('Error fetching data:', error);
            setTrades([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrade = async (newTrade) => {
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Ensure profile has required data
            const initialBalance = profile.initial_balance || 0;
            const riskPercent = profile.risk_per_trade_percent || 1;

            if (initialBalance === 0) {
                alert('Please set your initial balance in Configuration first.');
                setSaving(false);
                return;
            }

            // Calculate Realized Balance (Initial Balance + Closed Trades Profit)
            const { data: closedTrades } = await supabase
                .from('trades')
                .select('result, risk_usd')
                .in('status', ['closed', 'done'])
                .eq('user_id', user.id);

            const totalClosedProfit = closedTrades?.reduce((sum, t) => sum + ((t.result || 0) * (t.risk_usd || 0)), 0) || 0;
            const realizedBalance = initialBalance + totalClosedProfit;

            // Calculate risk_usd for this new trade (snapshot)
            const riskUsd = realizedBalance * (riskPercent / 100);

            const tradeData = {
                user_id: user.id,
                pair: newTrade.pair.toUpperCase(),
                op: parseFloat(newTrade.op) || 0,
                sl: parseFloat(newTrade.sl) || 0,
                ft: parseFloat(newTrade.ft) || 0,
                img_before: newTrade.img_before || '',
                img_after: newTrade.img_after || '',
                result: 0,
                risk_usd: riskUsd, // Save snapshot
                status: 'unfill',
                open_date: new Date().toISOString()
            };

            const { data, error } = await supabase.from('trades').insert([tradeData]).select().single();
            if (error) throw error;

            // Normalize the new trade data
            const normalizedTrade = {
                ...data,
                result: data.result || 0,
                risk_usd: data.risk_usd || 0,
                op: data.op || 0,
                sl: data.sl || 0,
                ft: data.ft || 0
            };

            setTrades([normalizedTrade, ...trades]);
            setAddModalOpen(false);
        } catch (error) {
            console.error('Error adding trade:', error);
            alert('Gagal menambahkan trade: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTrade = (updatedTrade) => {
        // Remove if status is closed or cancel
        if (['closed', 'cancel'].includes(updatedTrade.status)) {
            setTrades(trades.filter(t => t.id !== updatedTrade.id));
            // Refresh detailed metrics (balance, wins, etc) from DB
            fetchProfileAndTrades();
        } else {
            setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
        }
    };

    const openViewModal = (url) => { if (url) { setViewModalContent(url); setViewModalOpen(true); } };
    const openEditModal = (trade) => { setSelectedTrade(trade); setEditModalOpen(true); };
    const formatPair = (pair) => `${profile.pair_prefix || ''}${pair}${profile.pair_suffix || ''}`;
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const getStatusLabel = (status) => status === 'be' ? 'G.F. Target' : status;

    // Derived Calculations with Compounding Logic
    const filteredTrades = filterStatus === 'All'
        ? trades
        : trades.filter(t => filterStatus === 'G.F. Target' ? t.status === 'be' : t.status.toLowerCase() === filterStatus.toLowerCase());

    // Calculate Realized Balance (from closed trades only) - with safe guards
    let realizedBalance = 0;
    let realizedBalancePercent = 0;
    let nextTradeRisk = 0;
    let totalFloatingR = 0;
    let totalFloatingUsd = 0;
    let totalClosedTrades = 0;
    let winningTrades = 0;
    let winRate = 0;

    try {
        // Use fetched metrics for closed trades calculation
        const totalClosedProfitUsd = realizedProfit; // FROM STATE

        const initialBalance = Number(profile.initial_balance) || 0;
        realizedBalance = initialBalance + totalClosedProfitUsd;
        realizedBalancePercent = initialBalance > 0
            ? ((realizedBalance - initialBalance) / initialBalance) * 100
            : 0;

        // Next Trade Risk (based on current realized balance)
        const riskPercent = Number(profile.risk_per_trade_percent) || 1;
        nextTradeRisk = realizedBalance * (riskPercent / 100);

        // Floating PnL (from running/unfill trades)
        const floatingTrades = trades.filter(t => t.status === 'running' || t.status === 'unfill' || t.status === 'be');
        totalFloatingR = floatingTrades.reduce((sum, t) => sum + (Number(t.result) || 0), 0);
        totalFloatingUsd = floatingTrades.reduce((sum, t) => {
            const result = Number(t.result) || 0;
            const riskUsd = Number(t.risk_usd) || 0;
            return sum + (result * riskUsd);
        }, 0);

        // Account Stats
        totalClosedTrades = totalClosedCount; // FROM STATE
        winningTrades = winCount; // FROM STATE
        winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
    } catch (error) {
        console.error('Error in calculations:', error);
        console.log('Profile:', profile);
        console.log('Trades:', trades);
    }


    return (
        <>
            <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} content={viewModalContent} />
            {selectedTrade && <EditTradeModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} trade={selectedTrade} onUpdate={handleUpdateTrade} />}
            <AddTradeModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddTrade} saving={saving} />

            <div className="space-y-8 pb-12 page-enter">
                {/* Header & Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Running Trades</h1>
                        <p className="text-text-secondary mt-1">Monitor active market positions and real-time PnL.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 text-text-primary text-sm font-medium px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer hover:bg-slate-50"
                            >
                                <option value="All">All Status</option>
                                <option value="running">Running</option>
                                <option value="unfill">Unfill</option>
                                <option value="G.F. Target">G.F. Target</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-[1px] active:translate-y-0"
                        >
                            <Plus size={18} />
                            New Position
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Realized Balance (Equity) */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Wallet size={80} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Current Balance</p>
                            <div className="flex flex-col gap-1 relative z-10">
                                <h2 className={cn("text-3xl font-bold font-mono", realizedBalance >= (profile.initial_balance || 0) ? "text-[#2563eb]" : "text-rose-600")}>
                                    ${realizedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                                <span className={cn(
                                    "text-xs font-semibold",
                                    realizedBalancePercent >= 0 ? "text-[#2563eb]" : "text-rose-600"
                                )}>
                                    {realizedBalancePercent > 0 ? '+' : ''}{realizedBalancePercent.toFixed(2)}% from initial
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Next Trade Risk */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <TrendingUp size={80} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Next Trade Risk</p>
                            <div className="flex flex-col gap-1 relative z-10">
                                <h2 className="text-3xl font-bold text-[#2563eb] font-mono">
                                    ${nextTradeRisk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                                <span className="text-xs font-semibold text-text-secondary">
                                    {profile.risk_per_trade_percent || 1}% of Current Balance
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Floating PnL */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Activity size={80} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Total Floating PnL</p>
                            <div className="flex flex-col gap-1 relative z-10">
                                <h2 className={cn(
                                    "text-3xl font-bold font-mono",
                                    totalFloatingR > 0 ? "text-[#2563eb]" : totalFloatingR < 0 ? "text-rose-600" : "text-text-secondary"
                                )}>
                                    {totalFloatingR > 0 ? '+' : ''}{totalFloatingR.toFixed(2)}R
                                </h2>
                                <span className={cn(
                                    "text-xs font-semibold",
                                    totalFloatingUsd >= 0 ? "text-[#2563eb]" : "text-rose-600"
                                )}>
                                    {totalFloatingUsd > 0 ? '+' : ''}${Math.abs(totalFloatingUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Account Stats */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Target size={80} className="text-[#2563eb]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Account Stats</p>
                            <div className="flex flex-col gap-1 relative z-10">
                                <h2 className="text-3xl font-bold text-text-primary font-mono">{totalClosedTrades}</h2>
                                <span className="text-xs font-semibold text-text-secondary">
                                    Win Rate: {winRate.toFixed(1)}% ({winningTrades}W)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
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
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="10" className="text-center py-12 text-text-secondary">Loading trades...</td></tr>
                                ) : filteredTrades.length === 0 ? (
                                    <tr><td colSpan="10" className="text-center py-12 text-text-secondary">No active positions to display.</td></tr>
                                ) : (
                                    filteredTrades.map((trade, index) => (
                                        <tr key={trade.id} className="hover:bg-blue-50/50 transition-colors group">
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
                                                    trade.status === 'running' ? "bg-blue-100 text-blue-700" :
                                                        trade.status === 'be' ? "bg-purple-100 text-purple-700" :
                                                            "bg-slate-100 text-slate-700"
                                                )}>
                                                    {getStatusLabel(trade.status)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {trade.img_before && (
                                                        <button onClick={() => openViewModal(trade.img_before)} className="text-text-secondary hover:text-primary hover:bg-blue-50 p-1.5 rounded-md transition-all" title="View Before">
                                                            <Camera size={18} />
                                                        </button>
                                                    )}
                                                    {trade.img_after && (
                                                        <button onClick={() => openViewModal(trade.img_after)} className="text-text-secondary hover:text-primary hover:bg-blue-50 p-1.5 rounded-md transition-all" title="View After">
                                                            <Eye size={18} />
                                                        </button>
                                                    )}
                                                    {!trade.img_before && !trade.img_after && <span className="text-gray-300">-</span>}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className={cn(
                                                        "font-bold text-base font-mono",
                                                        (trade.result || 0) > 0 ? "text-[#2563eb]" : (trade.result || 0) < 0 ? "text-rose-600" : "text-text-secondary"
                                                    )}>
                                                        {(trade.result || 0) > 0 ? '+' : ''}{(trade.result || 0).toFixed(2)}R
                                                    </span>
                                                    <span className="text-xs text-text-secondary font-medium">
                                                        ${((trade.result || 0) * (trade.risk_usd || 0)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-xs text-text-secondary font-medium">Open: {formatDate(trade.open_date)}</span>
                                                    <span className="text-xs text-slate-400">Close: --</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <button onClick={() => openEditModal(trade)} className="text-slate-700 hover:text-[#2563eb] p-2 rounded-lg hover:bg-blue-50 transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* Footer */}
                            {trades.length > 0 && (
                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-right font-bold text-text-secondary text-xs uppercase tracking-wider">Total Floating</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={cn(
                                                    "font-bold text-lg font-mono",
                                                    totalFloatingR > 0 ? "text-[#2563eb]" : totalFloatingR < 0 ? "text-rose-600" : "text-text-secondary"
                                                )}>
                                                    {totalFloatingR > 0 ? '+' : ''}{totalFloatingR.toFixed(2)}R
                                                </span>
                                                <span className="text-xs text-text-secondary font-medium">
                                                    ${Math.abs(totalFloatingUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div >
            </div>
        </>
    );
};

export default RunningTrades;
