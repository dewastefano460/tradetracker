import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, AlertCircle, CheckCircle2, Wallet, RefreshCcw } from 'lucide-react';

const Configuration = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [formData, setFormData] = useState({
        initial_balance: 0,
        risk_per_trade_percent: 1,
        pair_prefix: '',
        pair_suffix: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setFormData({
                    initial_balance: data.initial_balance || 0,
                    risk_per_trade_percent: data.risk_per_trade_percent || 1,
                    pair_prefix: data.pair_prefix || '',
                    pair_suffix: data.pair_suffix || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Gagal memuat profil.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pair_prefix' || name === 'pair_suffix' ? value : parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            const updates = { id: user.id, ...formData, updated_at: new Date() };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to save configuration.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading configuration...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary tracking-tight">Configuration</h1>
                <p className="text-text-secondary mt-2">Manage your global account settings and default trading parameters.</p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Account Parameters Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-blue-50 text-brand-blue rounded-lg flex items-center justify-center">
                            <Wallet size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">Account Parameters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Initial Balance</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-text-secondary">$</span>
                                <input
                                    type="number"
                                    name="initial_balance"
                                    value={formData.initial_balance}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-3 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-300 font-medium"
                                    placeholder="10000"
                                />
                            </div>
                            <p className="text-xs text-text-secondary">The starting capital for your trading period.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Risk per trade (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="risk_per_trade_percent"
                                    value={formData.risk_per_trade_percent}
                                    onChange={handleChange}
                                    step="0.1"
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-4 pr-8 py-3 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-300 font-medium"
                                    placeholder="1.0"
                                />
                                <span className="absolute right-4 top-3 text-text-secondary">%</span>
                            </div>
                            <p className="text-xs text-text-secondary">Default risk percentage used for position sizing calculations.</p>
                        </div>
                    </div>
                </div>

                {/* Symbol Settings Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            <RefreshCcw size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">Symbol Settings</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Trading Pair Name Prefix</label>
                            <input
                                type="text"
                                name="pair_prefix"
                                value={formData.pair_prefix}
                                onChange={handleChange}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-text-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                                placeholder="E.G. BTC"
                            />
                            <p className="text-xs text-text-secondary">Automatically added to the start of new trade symbols.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-primary">Trading Pair Name Suffix</label>
                            <input
                                type="text"
                                name="pair_suffix"
                                value={formData.pair_suffix}
                                onChange={handleChange}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-text-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                                placeholder="E.G. USDT"
                            />
                            <p className="text-xs text-text-secondary">Automatically appended to new trade symbols (e.g. /USDT).</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold px-8 py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                        <Save size={18} />
                        {saving ? 'Saving Config...' : 'Save Configuration'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default Configuration;
