import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Save } from 'lucide-react';
import { cn } from '../lib/utils';

const AddTradeModal = ({ isOpen, onClose, onAdd, saving }) => {
    const [newTrade, setNewTrade] = useState({
        pair: '',
        op: '',
        sl: '',
        ft: '',
        img_before: '',
        img_after: ''
    });

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTrade(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(newTrade);
        setNewTrade({ pair: '', op: '', sl: '', ft: '', img_before: '', img_after: '' });
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-modal-enter">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-blue rounded-full"></div>
                        <h3 className="text-lg font-bold text-text-primary">New Position</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Pair</label>
                            <input
                                type="text"
                                name="pair"
                                value={newTrade.pair}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all placeholder:text-gray-300"
                                placeholder="XAUUSD"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Open Price</label>
                            <input
                                type="number"
                                name="op"
                                value={newTrade.op}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all placeholder:text-gray-300"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Stop Loss</label>
                            <input
                                type="number"
                                name="sl"
                                value={newTrade.sl}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all placeholder:text-gray-300"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Target</label>
                            <input
                                type="number"
                                name="ft"
                                value={newTrade.ft}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all placeholder:text-gray-300"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Before Chart (URL)</label>
                            <input
                                type="text"
                                name="img_before"
                                value={newTrade.img_before}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all placeholder:text-gray-300"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">After Chart (URL)</label>
                            <input
                                type="text"
                                name="img_after"
                                value={newTrade.img_after}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all placeholder:text-gray-300"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:bg-slate-100 hover:text-text-primary transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-[#1e40af] text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Add Position
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AddTradeModal;
