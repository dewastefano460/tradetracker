import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { cn } from '../lib/utils';

const Performance = () => {
    const [loading, setLoading] = useState(true);
    const [equityData, setEquityData] = useState([]);
    const [stats, setStats] = useState({
        initialBalance: 0,
        currentBalance: 0,
        totalNetProfit: 0,
        totalTrades: 0,
        winRate: 0,
        winningTrades: 0,
        losingTrades: 0
    });

    // Filter States
    const [periodFilter, setPeriodFilter] = useState('All'); // All, 3M, 1M, Custom
    const currentDate = new Date();
    const [customMonth, setCustomMonth] = useState(currentDate.getMonth() + 1);
    const [customYear, setCustomYear] = useState(currentDate.getFullYear());

    useEffect(() => {
        fetchPerformanceData();
    }, [periodFilter, customMonth, customYear]);

    const fetchPerformanceData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile for initial balance and risk percentage
            // Fetch profile and trades in parallel
            const [profileResult, tradesResult] = await Promise.all([
                supabase.from('profiles').select('initial_balance, risk_per_trade_percent').eq('id', user.id).single(),
                supabase.from('trades').select('*').in('status', ['closed', 'done']).eq('user_id', user.id).order('close_date', { ascending: true })
            ]);

            const profileData = profileResult.data;
            const allTrades = tradesResult.data;
            const error = tradesResult.error; // Check trades error primarily

            const initialBalance = profileData?.initial_balance || 1000;
            const riskPercent = profileData?.risk_per_trade_percent || 1;

            if (error) throw error;

            // Calculate Date Range Logic
            let periodStartDate = null;
            let periodEndDate = new Date();
            periodEndDate.setHours(23, 59, 59, 999); // End of today

            if (periodFilter === '1M') {
                periodStartDate = new Date();
                periodStartDate.setMonth(periodStartDate.getMonth() - 1);
                periodStartDate.setHours(0, 0, 0, 0);
            } else if (periodFilter === '3M') {
                periodStartDate = new Date();
                periodStartDate.setMonth(periodStartDate.getMonth() - 3);
                periodStartDate.setHours(0, 0, 0, 0);
            } else if (periodFilter === 'Custom') {
                periodStartDate = new Date(customYear, customMonth - 1, 1);
                periodStartDate.setHours(0, 0, 0, 0);
                periodEndDate = new Date(customYear, customMonth, 0, 23, 59, 59, 999);
            }

            // Filter trades and Calculate Starting Balance for the period
            let periodTrades = [];
            let startingBalance = initialBalance;

            if (periodFilter === 'All' || !periodStartDate) {
                periodTrades = allTrades || [];
            } else {
                // Calculate balance accumulated BEFORE the period starts
                const tradesBefore = (allTrades || []).filter(t => {
                    const dateToUse = t.close_date || t.open_date;
                    return dateToUse ? new Date(dateToUse) < periodStartDate : false;
                });
                const profitBefore = tradesBefore.reduce((sum, t) => {
                    // Using current risk snapshot logic: result * risk_usd, or approximate if risk_usd is missing
                    // For consistency with All view which uses static risk calculation:
                    const tradeRiskUsd = t.risk_usd || (initialBalance * (riskPercent / 100)); // Fallback logic
                    return sum + (t.result * tradeRiskUsd);
                }, 0);

                startingBalance += profitBefore;

                // Filter trades WITHIN the period
                periodTrades = (allTrades || []).filter(t => {
                    const dateToUse = t.close_date || t.open_date;
                    if (!dateToUse) return false;
                    const d = new Date(dateToUse);
                    return d >= periodStartDate && d <= periodEndDate;
                });
            }

            // Calculate equity curve for the period
            let runningBalance = startingBalance;
            const equity = [
                {
                    date: 'Start',
                    balance: startingBalance,
                    trade: 0
                }
            ];

            periodTrades.forEach((trade, index) => {
                // Calculate dollar value. 
                // IMPORTANT: Use trade.risk_usd if available for accuracy, fallback to static calculation
                const dollarValue = (trade.result || 0) * (trade.risk_usd || (initialBalance * (riskPercent / 100)));
                runningBalance += dollarValue;

                const displayDate = trade.close_date || trade.open_date || new Date().toISOString();
                equity.push({
                    date: new Date(displayDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    balance: runningBalance,
                    trade: index + 1,
                    result: trade.result,
                    pair: trade.pair
                });
            });

            setEquityData(equity);

            // Calculate statistics for the period
            const totalNetProfit = periodTrades.reduce((sum, t) => sum + (t.result || 0), 0);
            const winningTrades = periodTrades.filter(t => t.result > 0).length;
            const losingTrades = periodTrades.filter(t => t.result < 0).length;
            const totalTrades = periodTrades.length;
            const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100) : 0;

            setStats({
                initialBalance: startingBalance, // Use period start balance for correct growth % calculation
                currentBalance: runningBalance,
                totalNetProfit,
                totalTrades,
                winRate,
                winningTrades,
                losingTrades
            });

        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                    <p className="text-xs font-semibold text-text-secondary mb-1">{data.date}</p>
                    <p className="text-sm font-bold text-text-primary">
                        Balance: ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {data.result !== undefined && (
                        <p className={cn("text-xs font-semibold", data.result > 0 ? "text-[#2563eb]" : "text-rose-600")}>
                            {data.result > 0 ? '+' : ''}{data.result.toFixed(2)}R ({data.pair})
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading performance data...</div>;

    const totalReturn = ((stats.currentBalance - stats.initialBalance) / stats.initialBalance) * 100;
    const isPositive = stats.currentBalance >= stats.initialBalance;

    return (
        <div className="space-y-8 pb-12 page-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Performance Dashboard</h1>
                    <p className="text-text-secondary mt-1">Track your trading performance and equity curve.</p>
                </div>

                {/* Period Filter */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Period Buttons */}
                    <div className="inline-flex items-center bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
                        {['All', '3M', '1M', 'Custom'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setPeriodFilter(period)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium transition-all",
                                    periodFilter === period
                                        ? "bg-[#2563eb] text-white"
                                        : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                                )}
                            >
                                {period}
                            </button>
                        ))}
                    </div>

                    {/* Custom Month/Year Dropdowns */}
                    {periodFilter === 'Custom' && (
                        <>
                            <select
                                value={customMonth}
                                onChange={(e) => setCustomMonth(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-slate-300 text-text-primary text-sm font-medium px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all cursor-pointer hover:bg-slate-50"
                            >
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                                    <option key={month} value={index + 1}>{month}</option>
                                ))}
                            </select>

                            <select
                                value={customYear}
                                onChange={(e) => setCustomYear(parseInt(e.target.value))}
                                className="appearance-none bg-white border border-slate-300 text-text-primary text-sm font-medium px-4 py-2 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all cursor-pointer hover:bg-slate-50"
                            >
                                {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <DollarSign size={48} className="text-[#2563eb]" />
                    </div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Current Balance</p>
                    <h2 className={cn("text-2xl font-bold font-mono relative z-10", isPositive ? "text-[#2563eb]" : "text-rose-600")}>
                        ${stats.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className={cn("text-xs font-semibold mt-1", isPositive ? "text-[#2563eb]" : "text-rose-600")}>
                        {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <TrendingUp size={48} className="text-[#2563eb]" />
                    </div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Total Net Profit</p>
                    <h2 className={cn("text-2xl font-bold font-mono relative z-10", stats.totalNetProfit >= 0 ? "text-[#2563eb]" : "text-rose-600")}>
                        {stats.totalNetProfit > 0 ? '+' : ''}{stats.totalNetProfit.toFixed(2)}R
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                        ${((stats.currentBalance - stats.initialBalance)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Target size={48} className="text-[#2563eb]" />
                    </div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Win Rate</p>
                    <h2 className="text-2xl font-bold font-mono text-text-primary relative z-10">
                        {stats.winRate.toFixed(1)}%
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                        {stats.winningTrades}W / {stats.losingTrades}L
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft relative overflow-hidden group hover-card">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Award size={48} className="text-[#2563eb]" />
                    </div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Total Trades</p>
                    <h2 className="text-2xl font-bold font-mono text-text-primary relative z-10">
                        {stats.totalTrades}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">Completed</p>
                </div>
            </div>

            {/* Equity Curve Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Equity Curve</h3>
                    <p className="text-sm text-text-secondary mt-1">Your account balance over time</p>
                </div>

                {equityData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={equityData}>
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? "#2563eb" : "#ef4444"} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={isPositive ? "#2563eb" : "#ef4444"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke={isPositive ? "#2563eb" : "#ef4444"}
                                strokeWidth={3}
                                fill="url(#colorBalance)"
                                animationDuration={2000}
                                animationEasing="ease-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[400px] flex items-center justify-center text-text-secondary">
                        <div className="text-center">
                            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No closed trades yet. Start trading to see your equity curve!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-primary mb-1">How is performance calculated?</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Your equity curve is calculated based on your initial balance and closed trades. Each trade's result (R)
                            is converted to dollar value using your configured risk percentage. For example, if your initial balance
                            is $1000 and risk is 1%, then 1R = $10. A +2R trade would add $20 to your balance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Performance;
