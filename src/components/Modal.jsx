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
        <div className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-6xl h-[85vh] bg-surface rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                    <h3 className="text-text-primary font-medium truncate max-w-lg">{content}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 overflow-hidden relative flex items-center justify-center">
                    {isImage(content) ? (
                        <img
                            src={content}
                            alt="Trade Screenshot"
                            className="max-w-full max-h-full object-contain"
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
