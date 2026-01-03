import React, { useState } from 'react';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

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
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase">Pair</label>
                            <input type="text" name="pair" value={newTrade.pair} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-brand-blue outline-none" placeholder="XAUUSD" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase">Open Price</label>
                            <input type="number" name="op" value={newTrade.op} onChange={handleInputChange} step="any" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-brand-blue outline-none" placeholder="0.00" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase">Stop Loss</label>
                            <input type="number" name="sl" value={newTrade.sl} onChange={handleInputChange} step="any" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-red-500 outline-none" placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-secondary uppercase">Target</label>
                            <input type="number" name="ft" value={newTrade.ft} onChange={handleInputChange} step="any" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-green-500 outline-none" placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase">Before Chart (URL)</label>
                            <input type="url" name="img_before" value={newTrade.img_before} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none" placeholder="https://..." />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-text-secondary uppercase">After Chart (URL)</label>
                            <input type="url" name="img_after" value={newTrade.img_after} onChange={handleInputChange} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:border-purple-500 outline-none" placeholder="https://..." />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
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
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3e94] hover:bg-[#152c6b] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <Plus size={18} />
                            {saving ? 'Adding...' : 'Add Position'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTradeModal;
