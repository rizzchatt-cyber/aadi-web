import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, MessageCircle, Check, Droplets, Wind } from 'lucide-react';

interface AttarPerfumeOptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onConfirm: (productType: 'Attar' | 'Perfume', fragranceVariant: string) => void;
}

export default function AttarPerfumeOptionModal({
    isOpen,
    onClose,
    product,
    onConfirm
}: AttarPerfumeOptionModalProps) {
    const [productType, setProductType] = useState<'Attar' | 'Perfume'>('Attar');

    useEffect(() => {
        if (isOpen && product) {
            // Auto detect if product title/material indicates attar vs perfume
            const titleLower = (product.title || '').toLowerCase();
            const matLower = (product.material || '').toLowerCase();
            if (titleLower.includes('attar') || matLower.includes('attar')) {
                setProductType('Attar');
            } else if (titleLower.includes('perfume') || matLower.includes('perfume')) {
                setProductType('Perfume');
            } else {
                setProductType('Attar');
            }
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const handleConfirm = () => {
        onConfirm(productType, '');
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-full max-w-md bg-white rounded-[32px] border border-gold/20 shadow-2xl overflow-hidden relative z-10 p-6 md:p-8 flex flex-col space-y-6"
                >
                    {/* Top gold bar */}
                    <div className="h-1.5 w-full gold-gradient absolute top-0 left-0 right-0" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-charcoal/40 hover:text-gold rounded-full hover:bg-gold/5 transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>

                    {/* Header */}
                    <div className="text-center pt-2">
                        <div className="w-12 h-12 bg-gold/10 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-gold/20 text-gold">
                            <Sparkles size={24} />
                        </div>
                        <h2 className="text-2xl font-serif text-charcoal mb-1">Select Attar or Perfume</h2>
                        <p className="text-[11px] text-charcoal/50 uppercase tracking-widest font-bold">
                            Choose format preference for {product.title}
                        </p>
                    </div>

                    {/* Section 1: Format Type Selection (Attar vs Perfume) */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-charcoal/70 tracking-wider block text-left">
                            Select Format:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setProductType('Attar')}
                                className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                                    productType === 'Attar'
                                        ? 'border-gold bg-gold/10 text-gold shadow-md ring-2 ring-gold/30'
                                        : 'border-gold/15 bg-zinc-50/50 text-charcoal/60 hover:border-gold/30'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <Droplets size={24} className={productType === 'Attar' ? 'text-gold' : 'text-charcoal/40'} />
                                    {productType === 'Attar' && <Check size={18} className="text-gold" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-charcoal">Attar</p>
                                    <p className="text-[10px] text-charcoal/50">Pure Concentrated Perfume Oil</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setProductType('Perfume')}
                                className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                                    productType === 'Perfume'
                                        ? 'border-gold bg-gold/10 text-gold shadow-md ring-2 ring-gold/30'
                                        : 'border-gold/15 bg-zinc-50/50 text-charcoal/60 hover:border-gold/30'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <Wind size={24} className={productType === 'Perfume' ? 'text-gold' : 'text-charcoal/40'} />
                                    {productType === 'Perfume' && <Check size={18} className="text-gold" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-charcoal">Perfume</p>
                                    <p className="text-[10px] text-charcoal/50">Spray Atomizer Mist</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transition-all cursor-pointer text-sm uppercase tracking-wider"
                        >
                            <MessageCircle size={20} />
                            Order on WhatsApp ({productType})
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
