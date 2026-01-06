import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertTriangle } from 'lucide-react';
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (trade) {
            setFormData({
                status: trade.status || 'running',
                result: trade.result || 0,
                img_after: trade.img_after || '',
                close_date: trade.close_date ? new Date(trade.close_date).toISOString().split('T')[0] : ''
            });
            setShowDeleteConfirm(false); // Reset warning when trade changes
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

        // If user changes status away from delete, hide the warning
        if (name === 'status' && value !== 'delete') {
            setShowDeleteConfirm(false);
        }
    };

    const performSave = async () => {
        setSaving(true);
        try {
            // If status is 'delete', delete the trade from database
            if (formData.status === 'delete') {
                const { error } = await supabase.from('trades').delete().eq('id', trade.id);
                if (error) throw error;
                onUpdate({ ...trade, status: 'delete' }); // Signal removal
            } else {
                // Otherwise, update the trade (including 'cancel' status)
                let finalCloseDate = null;

                if (formData.close_date) {
                    finalCloseDate = new Date(formData.close_date).toISOString();
                } else if (formData.status === 'closed' || formData.status === 'done') {
                    finalCloseDate = new Date().toISOString();
                }

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

    const handleSubmit = (e) => {
        e.preventDefault();

        // Safety Check for Delete
        if (formData.status === 'delete' && !showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        performSave();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-modal-enter relative">

                {/* CONFIRMATION OVERLAY FOR CANCEL */}
                {/* Moved outside form to cover entire modal completely */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 animate-fade-in rounded-xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="text-red-600 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Hapus Trade</h3>
                        <p className="text-text-secondary mb-8 max-w-xs">
                            Apakah anda ingin menghapus trade ini? Data trade akan dihapus permanen dari database.
                        </p>
                        <div className="flex gap-3 w-full max-w-xs">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={performSave}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                )}

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
                                className={cn(
                                    "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all font-medium cursor-pointer",
                                    formData.status === 'delete' && "border-red-300 text-red-600 bg-red-50 focus:border-red-500 focus:ring-red-500"
                                )}
                            >
                                <option value="pending">Belum Entry</option>
                                <option value="unfill">Unfill</option>
                                <option value="running">Running</option>
                                <option value="be">Ganti Final Target</option>
                                <option value="closed">Done</option>
                                <option value="cancel">Cancel</option>
                                <option value="delete" className="font-bold text-red-600 bg-red-50">Hapus</option>
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
                                    disabled={formData.status === 'delete'}
                                    className={cn(
                                        "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none transition-all focus:ring-1 font-bold",
                                        formData.result > 0 ? "text-green-600 border-green-200 focus:border-green-500 focus:ring-green-500" :
                                            formData.result < 0 ? "text-red-600 border-red-200 focus:border-red-500 focus:ring-red-500" :
                                                "text-text-primary focus:border-brand-blue focus:ring-brand-blue",
                                        formData.status === 'delete' && "opacity-50 cursor-not-allowed bg-gray-50"
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
                                    disabled={formData.status === 'delete'}
                                    className={cn(
                                        "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all",
                                        formData.status === 'delete' && "opacity-50 cursor-not-allowed bg-gray-50"
                                    )}
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
                                disabled={formData.status === 'delete'}
                                className={cn(
                                    "w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-text-primary focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-300",
                                    formData.status === 'delete' && "opacity-50 cursor-not-allowed bg-gray-50"
                                )}
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
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-semibold shadow-xl transition-all active:scale-[0.98] disabled:opacity-50",
                                formData.status === 'delete'
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                                    : "bg-[#2563eb] hover:bg-[#1e40af] shadow-blue-500/20"
                            )}
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : formData.status === 'delete' ? 'Hapus Trade' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditTradeModal;
