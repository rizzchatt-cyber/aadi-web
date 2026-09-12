import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Droplet, Wind, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import DriveImage from './DriveImage';

export interface SelectedFragranceVariant {
    type: 'Attar' | 'Perfume';
    typeLabel: string;
    size: string;
    sizeLabel: string;
    price: number;
}

interface FragranceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onProceedToCheckout: (variant: SelectedFragranceVariant) => void;
}

export default function FragranceSelectionModal({
    isOpen,
    onClose,
    product,
    onProceedToCheckout
}: FragranceSelectionModalProps) {
    const [selectedType, setSelectedType] = useState<'Attar' | 'Perfume'>('Attar');
    const [selectedSize, setSelectedSize] = useState<string>('6ml');

    // Extract options or compute fallbacks
    const options = product?.fragranceOptions || {};
    const basePrice = Number(product?.price) || 500;

    // Attar Config
    const attarEnabled = options.attar?.enabled !== false;
    const attarPrices: Record<string, { enabled: boolean; price: number; label: string }> = {
        '3ml': {
            enabled: options.attar?.['3ml']?.enabled !== false,
            price: (options.attar?.['3ml']?.price && options.attar['3ml'].price > 0) ? options.attar['3ml'].price : 199,
            label: 'Small (3ml)'
        },
        '6ml': {
            enabled: options.attar?.['6ml']?.enabled !== false,
            price: (options.attar?.['6ml']?.price && options.attar['6ml'].price > 0) ? options.attar['6ml'].price : 349,
            label: 'Medium (6ml)'
        },
        '9ml': {
            enabled: options.attar?.['9ml']?.enabled !== false,
            price: (options.attar?.['9ml']?.price && options.attar['9ml'].price > 0) ? options.attar['9ml'].price : 549,
            label: 'Large (9ml)'
        }
    };

    // Perfume Config
    const perfumeEnabled = options.perfume?.enabled !== false;
    const perfumePrices: Record<string, { enabled: boolean; price: number; label: string }> = {
        '30ml': {
            enabled: options.perfume?.['30ml']?.enabled !== false,
            price: (options.perfume?.['30ml']?.price && options.perfume['30ml'].price > 0) ? options.perfume['30ml'].price : 549,
            label: 'Small (30ml)'
        },
        '60ml': {
            enabled: options.perfume?.['60ml']?.enabled !== false,
            price: (options.perfume?.['60ml']?.price && options.perfume['60ml'].price > 0) ? options.perfume['60ml'].price : 799,
            label: 'Medium (60ml)'
        },
        '100ml': {
            enabled: options.perfume?.['100ml']?.enabled !== false,
            price: (options.perfume?.['100ml']?.price && options.perfume['100ml'].price > 0) ? options.perfume['100ml'].price : 1499,
            label: 'Large (100ml)'
        }
    };

    // Adjust selected type & size if initially disabled
    useEffect(() => {
        if (isOpen) {
            if (!attarEnabled && perfumeEnabled) {
                setSelectedType('Perfume');
                setSelectedSize('60ml');
            } else {
                setSelectedType('Attar');
                setSelectedSize('6ml');
            }
        }
    }, [isOpen, attarEnabled, perfumeEnabled]);

    // Ensure selected size is valid for selected type
    useEffect(() => {
        if (selectedType === 'Attar') {
            const currentObj = attarPrices[selectedSize];
            if (!currentObj || !currentObj.enabled) {
                const firstAvailable = Object.keys(attarPrices).find(k => attarPrices[k].enabled);
                if (firstAvailable) setSelectedSize(firstAvailable);
            }
        } else {
            const currentObj = perfumePrices[selectedSize];
            if (!currentObj || !currentObj.enabled) {
                const firstAvailable = Object.keys(perfumePrices).find(k => perfumePrices[k].enabled);
                if (firstAvailable) setSelectedSize(firstAvailable);
            }
        }
    }, [selectedType]);

    if (!isOpen || !product) return null;

    const currentMap = selectedType === 'Attar' ? attarPrices : perfumePrices;
    const currentVariantObj = currentMap[selectedSize] || { price: basePrice, label: selectedSize, enabled: true };
    const currentPrice = currentVariantObj.price;

    const handleConfirm = () => {
        const typeLabel = selectedType === 'Attar' 
            ? 'Attar (Pure Raw without alcohol)' 
            : 'Perfume (35% Concentrated)';
            
        onProceedToCheckout({
            type: selectedType,
            typeLabel,
            size: selectedSize,
            sizeLabel: currentVariantObj.label,
            price: currentPrice
        });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="w-full max-w-lg bg-white rounded-[32px] border border-gold/30 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                    >
                        {/* Top Gold Bar */}
                        <div className="h-1.5 w-full gold-gradient" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 text-charcoal/40 hover:text-gold rounded-full hover:bg-gold/10 transition-all z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-6">
                            {/* Product Brief */}
                            <div className="flex items-center gap-4 bg-luxury-white p-3.5 rounded-2xl border border-gold/15">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gold/10 flex-shrink-0">
                                    <DriveImage
                                        src={product.images?.[0]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="px-2.5 py-0.5 bg-gold/10 text-gold text-[9px] font-bold uppercase tracking-widest rounded-full inline-block mb-1">
                                        Fragrance Customization
                                    </span>
                                    <h3 className="text-base font-serif font-bold text-charcoal truncate">
                                        {product.title}
                                    </h3>
                                    <p className="text-xs text-charcoal/60">Choose concentration & size</p>
                                </div>
                            </div>

                            {/* Section 1: Choose Concentration Type */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-widest text-charcoal/50 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-gold" />
                                        1. Select Concentration Type
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Attar Option */}
                                    <button
                                        type="button"
                                        disabled={!attarEnabled}
                                        onClick={() => setSelectedType('Attar')}
                                        className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                                            selectedType === 'Attar'
                                                ? 'border-gold bg-gold/10 shadow-md ring-2 ring-gold/30'
                                                : attarEnabled
                                                    ? 'border-gold/20 bg-white hover:border-gold/50'
                                                    : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-2 rounded-xl ${selectedType === 'Attar' ? 'bg-gold text-white' : 'bg-gold/10 text-gold'}`}>
                                                <Droplet size={18} />
                                            </div>
                                            {selectedType === 'Attar' && (
                                                <div className="w-5 h-5 bg-gold text-white rounded-full flex items-center justify-center">
                                                    <Check size={12} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-charcoal">Attar</h4>
                                            <p className="text-[10px] text-charcoal/60 leading-tight mt-0.5">
                                                Pure raw concentrated oil (without alcohol)
                                            </p>
                                        </div>
                                    </button>

                                    {/* Perfume Option */}
                                    <button
                                        type="button"
                                        disabled={!perfumeEnabled}
                                        onClick={() => setSelectedType('Perfume')}
                                        className={`p-4 rounded-2xl border transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                                            selectedType === 'Perfume'
                                                ? 'border-gold bg-gold/10 shadow-md ring-2 ring-gold/30'
                                                : perfumeEnabled
                                                    ? 'border-gold/20 bg-white hover:border-gold/50'
                                                    : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-2 rounded-xl ${selectedType === 'Perfume' ? 'bg-gold text-white' : 'bg-gold/10 text-gold'}`}>
                                                <Wind size={18} />
                                            </div>
                                            {selectedType === 'Perfume' && (
                                                <div className="w-5 h-5 bg-gold text-white rounded-full flex items-center justify-center">
                                                    <Check size={12} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-charcoal">Perfume</h4>
                                            <p className="text-[10px] text-charcoal/60 leading-tight mt-0.5">
                                                Spray perfume (35% concentrated)
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Choose Size */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/50 flex items-center gap-1.5">
                                    <ShoppingBag size={14} className="text-gold" />
                                    2. Select Bottle Size ({selectedType})
                                </label>

                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(currentMap).map(([sizeKey, item]) => {
                                        const isSelected = selectedSize === sizeKey;
                                        return (
                                            <button
                                                key={sizeKey}
                                                type="button"
                                                disabled={!item.enabled}
                                                onClick={() => setSelectedSize(sizeKey)}
                                                className={`py-3.5 px-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                                    isSelected
                                                        ? 'border-gold bg-gold/15 shadow-sm ring-2 ring-gold/40 text-gold font-bold'
                                                        : item.enabled
                                                            ? 'border-gold/20 bg-white hover:border-gold/40 text-charcoal'
                                                            : 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                                                }`}
                                            >
                                                <span className="text-xs font-black uppercase tracking-wider">{sizeKey}</span>
                                                <span className="text-[10px] text-charcoal/50 font-normal mt-0.5">
                                                    {sizeKey === '3ml' || sizeKey === '30ml' ? 'Small' : sizeKey === '6ml' || sizeKey === '60ml' ? 'Medium' : 'Large'}
                                                </span>
                                                <span className={`text-xs font-serif font-black mt-1 ${isSelected ? 'text-gold' : 'text-charcoal'}`}>
                                                    ₹{item.price.toLocaleString()}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Selection Summary Box */}
                            <div className="bg-gradient-to-r from-gold/10 via-amber-50 to-gold/10 p-4 rounded-2xl border border-gold/30 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold block">Selected Selection</span>
                                    <p className="text-sm font-bold text-charcoal">
                                        {selectedType} • <span className="text-gold font-serif">{selectedSize}</span>
                                    </p>
                                    <p className="text-[10px] text-charcoal/60">
                                        {selectedType === 'Attar' ? 'Pure Raw Oil (Alcohol Free)' : '35% Eau de Parfum'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/40 block">Total Price</span>
                                    <span className="text-2xl font-serif font-black text-gold">₹{currentPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Button */}
                        <div className="p-6 bg-gray-50/80 border-t border-gold/15 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 border border-gold/20 text-charcoal font-bold rounded-xl text-xs hover:bg-gold/5 transition-all text-center cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-2 py-3.5 gold-gradient text-white font-bold rounded-xl text-xs shadow-lg shadow-gold/20 hover:shadow-xl transition-all text-center flex items-center justify-center gap-2 cursor-pointer shimmer relative overflow-hidden"
                            >
                                Proceed to Address & Payment <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
