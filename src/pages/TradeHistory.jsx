import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Eye, Download, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import { cn } from '../lib/utils';

const TradeHistory = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ pair_prefix: '', pair_suffix: '' });

    // Modal States
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewModalContent, setViewModalContent] = useState('');

    // Filter States
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [filterTimeframe, setFilterTimeframe] = useState('All');

    useEffect(() => {
        fetchProfileAndTrades();
    }, [selectedMonth, selectedYear]);

    const fetchProfileAndTrades = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch running + closed/done trades for the selected month (based on open_date ONLY)
            const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
            const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();

            // Parallel Fetch
            const [profileResult, tradesResult] = await Promise.all([
                supabase.from('profiles').select('pair_prefix, pair_suffix').eq('id', user.id).single(),
                supabase.from('trades')
                    .select('*')
                    .in('status', ['running', 'closed', 'done'])
                    .eq('user_id', user.id)
                    .gte('open_date', startDate)
                    .lte('open_date', endDate)
                    .order('open_date', { ascending: false })
            ]);

            // Handle Profile
            if (profileResult.data) setProfile(profileResult.data);

            // Handle Trades
            if (tradesResult.error) throw tradesResult.error;
            setTrades(tradesResult.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openViewModal = (url) => { if (url) { setViewModalContent(url); setViewModalOpen(true); } };
    const formatPair = (pair) => `${profile.pair_prefix || ''}${pair}${profile.pair_suffix || ''}`;
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const getStatusLabel = (status) => status === 'be' ? 'G.F. Target' : status;

    const filteredTrades = filterTimeframe === 'All' ? trades : trades.filter(t => t.timeframe === filterTimeframe);

    const totalChartResult = filteredTrades.reduce((sum, trade) => sum + (trade.result || 0), 0);
    const totalFinalResult = filteredTrades.reduce((sum, trade) => sum + ((trade.result || 0) * (trade.risk_percent || 1)), 0);
    const winningTrades = filteredTrades.filter(t => (t.result * (t.risk_percent || 1)) > 0).length;
    const losingTrades = filteredTrades.filter(t => (t.result * (t.risk_percent || 1)) < 0).length;
    const winRate = filteredTrades.length > 0 ? ((winningTrades / filteredTrades.length) * 100).toFixed(1) : 0;

    const handleExportCSV = () => {
        if (trades.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }

        const headers = ['No', 'Pair', 'Timeframe', 'Risk %', 'OP', 'SL', 'TP', 'Status', 'Chart R', 'Final R', 'Open Date', 'Close Date', 'Before Chart URL', 'After Chart URL'];
        
        const filteredForExport = filterTimeframe === 'All' ? trades : trades.filter(t => t.timeframe === filterTimeframe);
        
        const csvData = filteredForExport.map((trade, index) => {
            const chartR = trade.result || 0;
            const finalR = chartR * (trade.risk_percent || 1);
            return [
                index + 1,
                formatPair(trade.pair),
                trade.timeframe || '-',
                `${trade.risk_percent || 1}%`,
                trade.op,
                trade.sl || '-',
                trade.ft || '-',
                getStatusLabel(trade.status),
                `${chartR > 0 ? '+' : ''}${chartR.toFixed(2)}R`,
                `${finalR > 0 ? '+' : ''}${finalR.toFixed(2)}R`,
                formatDate(trade.open_date),
                formatDate(trade.close_date),
                trade.img_before ? `"${trade.img_before}"` : '-',
                trade.img_after ? `"${trade.img_after}"` : '-'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trade_history_${selectedYear}_${selectedMonth}.csv`;
        link.click();
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    return (
        <>
            <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} content={viewModalContent} />

            <div className="space-y-8 pb-12 page-enter">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Trade History</h1>
                        <p className="text-text-secondary mt-1">Review your completed and closed positions.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Timeframe Filter */}
                        <div className="relative">
                            <select
                                value={filterTimeframe}
                                onChange={(e) => setFilterTimeframe(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 text-text-primary text-sm font-medium px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all cursor-pointer hover:bg-slate-50"
                            >
                                <option value="All">All TF</option>
                                <option value="15M">15M</option>
                                <option value="1H">1H</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        {/* Month Filter */}
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-slate-300 text-text-primary text-sm font-medium px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all cursor-pointer hover:bg-slate-50"
                            >
                                {months.map((month, index) => (
                                    <option key={month} value={index + 1}>{month}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        {/* Year Filter */}
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-slate-300 text-text-primary text-sm font-medium px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all cursor-pointer hover:bg-slate-50"
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-md transition-all hover:-translate-y-[1px] active:translate-y-0"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft group hover-card">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Total Trades</p>
                        <h2 className="text-3xl font-bold text-text-primary font-mono">{filteredTrades.length}</h2>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft group hover-card">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Win Rate</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold text-text-primary font-mono">{winRate}%</h2>
                            <span className="text-sm text-text-secondary">({winningTrades}W / {losingTrades}L)</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft group hover-card">
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Net Profit</p>
                        <h2 className={cn("text-3xl font-bold font-mono", totalFinalResult >= 0 ? "text-[#2563eb]" : "text-rose-600")}>
                            {totalFinalResult > 0 ? '+' : ''}{totalFinalResult.toFixed(2)}R
                        </h2>
                        <span className="text-xs text-text-secondary font-medium">
                            Chart R: {totalChartResult > 0 ? '+' : ''}{totalChartResult.toFixed(2)}R
                        </span>
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
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">TF</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Risk %</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">OP</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">SL</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">TP</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-center">Analysis</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-right">Result</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-right">Open Date</th>
                                    <th className="px-6 py-4 font-semibold text-text-secondary uppercase text-xs tracking-wider text-right">Close Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="11" className="text-center py-12 text-text-secondary">Loading trades...</td></tr>
                                ) : filteredTrades.length === 0 ? (
                                    <tr><td colSpan="11" className="text-center py-12 text-text-secondary">No trades found for {months[selectedMonth - 1]} {selectedYear}.</td></tr>
                                ) : (
                                    filteredTrades.map((trade, index) => (
                                        <tr key={trade.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-5 text-text-secondary font-medium">{String(index + 1).padStart(2, '0')}</td>
                                            <td className="px-6 py-5">
                                                <span className="block font-bold text-text-primary text-base">{formatPair(trade.pair)}</span>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-text-secondary text-sm">{trade.timeframe || '-'}</td>
                                            <td className="px-6 py-5 font-bold text-text-secondary text-sm">{trade.risk_percent || 1}</td>
                                            <td className="px-6 py-5 font-mono text-text-secondary">{trade.op}</td>
                                            <td className="px-6 py-5 font-mono text-xs text-text-secondary">{trade.sl || '-'}</td>
                                            <td className="px-6 py-5 font-mono text-xs text-text-secondary">{trade.ft || '-'}</td>

                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize",
                                                    trade.status === 'done' || trade.status === 'closed' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                                )}>
                                                    {getStatusLabel(trade.status)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {trade.img_before && (
                                                        <button onClick={() => openViewModal(trade.img_before)} className="text-text-secondary hover:text-[#2563eb] hover:bg-blue-50 p-1.5 rounded-md transition-all" title="View Before">
                                                            <Camera size={18} />
                                                        </button>
                                                    )}
                                                    {trade.img_after && (
                                                        <button onClick={() => openViewModal(trade.img_after)} className="text-text-secondary hover:text-[#2563eb] hover:bg-blue-50 p-1.5 rounded-md transition-all" title="View After">
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
                                                        (trade.result * (trade.risk_percent || 1)) > 0 ? "text-[#2563eb]" : (trade.result * (trade.risk_percent || 1)) < 0 ? "text-rose-600" : "text-text-secondary"
                                                    )}>
                                                        {(trade.result * (trade.risk_percent || 1)) > 0 ? '+' : ''}{(trade.result * (trade.risk_percent || 1)).toFixed(2)}R
                                                    </span>
                                                    <span className="text-xs text-text-secondary font-medium">
                                                        Chart: {trade.result > 0 ? '+' : ''}{trade.result.toFixed(2)}R
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 text-right text-xs text-text-secondary">{formatDate(trade.open_date)}</td>
                                            <td className="px-6 py-5 text-right text-xs text-text-secondary font-semibold">{formatDate(trade.close_date)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredTrades.length > 0 && (
                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                    <tr>
                                        <td colSpan="9" className="px-6 py-4 text-right font-bold text-text-secondary text-xs uppercase tracking-wider">Total Result</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={cn("font-bold text-lg font-mono", totalFinalResult >= 0 ? "text-[#2563eb]" : "text-rose-600")}>
                                                    {totalFinalResult > 0 ? '+' : ''}{totalFinalResult.toFixed(2)}R
                                                </span>
                                            </div>
                                        </td>
                                        <td colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TradeHistory;
