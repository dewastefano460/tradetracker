import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { cn } from '../lib/utils';

const EditTradeModal = ({ isOpen, onClose, trade, onUpdate }) => {
    const [formData, setFormData] = useState({
        status: 'running',
        result: 0,
        img_after: '',
        close_date: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (trade) {
            setFormData({
                status: trade.status || 'running',
                result: trade.result || 0,
                img_after: trade.img_after || '',
                close_date: trade.close_date ? new Date(trade.close_date).toISOString().split('T')[0] : ''
            });
        }
    }, [trade]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'result' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // If status is 'cancel', delete the trade
            if (formData.status === 'cancel') {
                const { error } = await supabase.from('trades').delete().eq('id', trade.id);
                if (error) throw error;
                onUpdate({ ...trade, status: 'cancel' }); // Signal to parent to remove from list
            } else {
                // Otherwise, update the trade
                // Logic for Close Date
                let finalCloseDate = null; // Default to NULL

                if (formData.close_date) {
                    // If user manually selected a date, use it
                    finalCloseDate = new Date(formData.close_date).toISOString();
                } else if (formData.status === 'closed' || formData.status === 'done') {
                    // If closing without date, AUTO FILL with today
                    finalCloseDate = new Date().toISOString();
                }
                // If status is running/unfill/be AND no date selected, finalCloseDate remains null (correct for DB)

                const updates = {
                    status: formData.status,
                    result: parseFloat(formData.result),
                    img_after: formData.img_after,
                    close_date: finalCloseDate
                };

                const { error } = await supabase.from('trades').update(updates).eq('id', trade.id);
                if (error) throw error;
                onUpdate({ ...trade, ...updates });
            }

            onClose();
        } catch (error) {
            console.error('Error updating trade:', error);
            alert('Gagal mengupdate trade');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-blue rounded-full"></div>
                        <h3 className="text-lg font-bold text-text-primary">Edit Position</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div>
                            <span className="text-xs font-semibold text-text-secondary uppercase">Pair</span>
                            <p className="text-lg font-bold text-text-primary">{trade?.pair}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold text-text-secondary uppercase">Current Status</span>
                            <p className="text-sm font-medium text-text-primary capitalize">{trade?.status}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">New Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all font-medium"
                            >
                                <option value="running">Running</option>
                                <option value="closed">Closed / Done</option>
                                <option value="unfill">Unfill</option>
                                <option value="cancel">Cancel</option>
                                <option value="be">Ganti Final Target</option>
                            </select>
                        </div>

                        {/* Result & Close Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Result (R)</label>
                                <input
                                    type="number"
                                    name="result"
                                    value={formData.result}
                                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                                    step="0.01"
                                    className={cn(
                                        "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none transition-all focus:ring-1 font-bold",
                                        formData.result > 0 ? "text-green-600 border-green-200 focus:border-green-500 focus:ring-green-500" :
                                            formData.result < 0 ? "text-red-600 border-red-200 focus:border-red-500 focus:ring-red-500" :
                                                "text-text-primary focus:border-brand-blue focus:ring-brand-blue"
                                    )}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Close Date</label>
                                <input
                                    type="date"
                                    name="close_date"
                                    value={formData.close_date}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Screenshot After */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">After Chart (URL)</label>
                            <input
                                type="url"
                                name="img_after"
                                value={formData.img_after}
                                onChange={handleChange}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-300"
                                placeholder="https://tradingview.com/..."
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-text-secondary hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-[#1e40af] text-white rounded-lg font-semibold shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/40 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditTradeModal;
