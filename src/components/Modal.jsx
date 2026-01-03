import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, content }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isImage = (url) => {
        if (!url) return false;
        return url.match(/\.(jpeg|jpg|gif|png)$/) != null || url.includes('tradingview.com/x/') || url.includes('ibb.co');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-6xl h-[85vh] bg-surface rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-surface/50">
                    <h3 className="text-white font-medium truncate">{content}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-background overflow-hidden relative">
                    {isImage(content) ? (
                        <img
                            src={content}
                            alt="Trade Screenshot"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <iframe
                            src={content}
                            title="Trade View"
                            className="w-full h-full border-0"
                            allowFullScreen
                        />
                    )}
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default Modal;
