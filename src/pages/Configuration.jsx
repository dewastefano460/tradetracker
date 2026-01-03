import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

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

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

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

            const updates = {
                id: user.id,
                ...formData,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-white p-4">Memuat data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-white/10 pb-5">
                <h2 className="text-3xl font-bold text-white">Konfigurasi Akun</h2>
                <p className="text-gray-400 mt-2">Atur saldo awal dan preferensi trading Anda.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">

                {/* Money Section */}
                <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-6">
                    <h3 className="text-xl font-semibold text-blue-400">Keuangan & Risiko</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Initial Balance ($)</label>
                            <input
                                type="number"
                                name="initial_balance"
                                value={formData.initial_balance}
                                onChange={handleChange}
                                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="1000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Risk per Trade (%)</label>
                            <input
                                type="number"
                                name="risk_per_trade_percent"
                                value={formData.risk_per_trade_percent}
                                onChange={handleChange}
                                step="0.1"
                                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="1.0"
                            />
                        </div>
                    </div>
                </div>

                {/* Naming Section */}
                <div className="bg-surface p-6 rounded-2xl border border-white/5 space-y-6">
                    <h3 className="text-xl font-semibold text-purple-400">Format Pasangan Mata Uang</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Prefix (Awalan)</label>
                            <input
                                type="text"
                                name="pair_prefix"
                                value={formData.pair_prefix}
                                onChange={handleChange}
                                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="e.g. XAU"
                            />
                            <p className="text-xs text-gray-500">Otomatis ditambahkan di depan input Pair.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Suffix (Akhiran)</label>
                            <input
                                type="text"
                                name="pair_suffix"
                                value={formData.pair_suffix}
                                onChange={handleChange}
                                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="e.g. m"
                            />
                            <p className="text-xs text-gray-500">Otomatis ditambahkan di belakang input Pair (cth: USDm).</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                    >
                        <Save size={20} />
                        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default Configuration;
