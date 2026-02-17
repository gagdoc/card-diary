import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const ImageModal = ({ src, alt, onClose }) => {
    if (!src) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
