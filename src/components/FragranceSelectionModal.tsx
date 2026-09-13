import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, Sparkles } from 'lucide-react';
import DriveImage from './DriveImage';
import { getFragrancePricing } from '../utils/fragranceHelpers';

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

/* Custom Attar Bottle SVG matching traditional oil bottle with stopper & pattern */
const AttarBottleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Stopper Cap */}
        <path d="M26 8 C26 5 28 4 32 4 C36 4 38 5 38 8 V14 H26 Z" fill="currentColor" fillOpacity="0.15" />
        {/* Collar Neck */}
        <path d="M22 14 H42 V20 H22 Z" />
        {/* Bottle Body */}
        <path d="M18 20 H46 L50 26 V56 C50 58.2 48.2 60 46 60 H18 C15.8 60 14 58.2 14 56 V26 Z" />
        {/* Traditional Center Filigree Wave Motif */}
        <path d="M32 26 C35.5 29.5 35.5 33 32 36.5 C28.5 40 28.5 43.5 32 47 C35.5 50.5 35.5 53 32 55.5" strokeWidth="2.5" />
    </svg>
);

/* Custom Perfume Spray Bottle SVG matching spray bottle with atomizer mist pump */
const PerfumeSprayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Spray Nozzle Pump Top */}
        <path d="M26 14 H38 V22 H26 Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M24 22 H40 V25 H24 Z" />
        {/* Nozzle Spout */}
        <path d="M23 16 H26 V20 H23 Z" fill="currentColor" />
        {/* Fine Spray Mist Lines */}
        <path d="M13 10 L20 13" strokeWidth="2.2" strokeDasharray="2 2" />
        <path d="M10 17 L19 17" strokeWidth="2.2" strokeDasharray="2 2" />
        <path d="M14 24 L21 21" strokeWidth="2.2" strokeDasharray="2 2" />
        {/* Main Bottle Body */}
        <circle cx="32" cy="42" r="17" />
        {/* Dip Tube */}
        <path d="M32 25 L34 42" strokeWidth="2.2" />
        {/* Liquid Surface */}
        <path d="M16 43 C22 46 27 40 32 44 C37 48 42 42 48 44" strokeWidth="2.2" />
    </svg>
);

/* Dynamic Faded Bottle Background Watermark Component */
const BottleWatermark = ({ type }: { type: 'Attar' | 'Perfume' }) => {
    const imgSrc = type === 'Attar' ? '/attar_bg.png' : '/perfume_bg.png';

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 select-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.88, y: 8 }}
                    animate={{ opacity: 0.16, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -8 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="w-72 h-72 sm:w-80 sm:h-80 relative flex items-center justify-center mix-blend-multiply"
                >
                    <img
                        src={imgSrc}
                        alt={`${type} bottle watermark`}
                        className="w-full h-full object-contain filter drop-shadow-xl brightness-95"
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default function FragranceSelectionModal({
    isOpen,
    onClose,
    product,
    onProceedToCheckout
}: FragranceSelectionModalProps) {
    const [selectedType, setSelectedType] = useState<'Attar' | 'Perfume'>('Attar');
    const [selectedSize, setSelectedSize] = useState<string>('6ml');

    const pricing = getFragrancePricing(product);

    const attarEnabled = pricing.attar.enabled;
    const attarPrices = pricing.attar.options;

    const perfumeEnabled = pricing.perfume.enabled;
    const perfumePrices = pricing.perfume.options;

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
    const currentVariantObj = currentMap[selectedSize] || {
        price: product?.price || 199,
        mrp: (product?.price || 199) + 200,
        discount: 50,
        label: selectedSize,
        sizeName: 'Small' as const,
        ml: selectedSize,
        enabled: true
    };
    const currentPrice = currentVariantObj.price;
    const currentMrp = currentVariantObj.mrp;
    const currentDiscount = currentVariantObj.discount;

    const handleConfirm = () => {
        const typeLabel = selectedType === 'Attar' 
            ? 'Attar (Pure Raw Oil, Alcohol-Free)' 
            : 'Perfume (Spray, 35% EDP)';
            
        onProceedToCheckout({
            type: selectedType,
            typeLabel,
            size: selectedSize,
            sizeLabel: `${currentVariantObj.sizeName} (${currentVariantObj.ml})`,
            price: currentPrice
        });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="w-full max-w-md bg-[#fcfbf9] rounded-[28px] border border-gold/20 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                    >
                        {/* Header Bar */}
                        <div className="p-5 border-b border-gold/15 bg-white/90 backdrop-blur-sm flex items-center justify-between gap-3 relative z-20">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-luxury-cream border border-gold/20 flex-shrink-0">
                                    <DriveImage
                                        src={product.images?.[0]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-serif font-bold text-charcoal truncate leading-tight">
                                        {product.title}
                                    </h3>
                                    <p className="text-[11px] font-medium text-gold tracking-wide mt-0.5 flex items-center gap-1">
                                        <Sparkles size={11} className="inline" /> Customize Fragrance
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-charcoal/40 hover:text-charcoal rounded-full hover:bg-gold/10 transition-all cursor-pointer flex-shrink-0"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body with Faded Watermark Background */}
                        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-6 relative z-10">
                            {/* Dynamic Faded Bottle Watermark */}
                            <BottleWatermark type={selectedType} />

                            {/* Section 1: Concentration Type */}
                            <div className="relative z-10">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-charcoal/50 block mb-3">
                                    1. Choose Type
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Attar Button */}
                                    <button
                                        type="button"
                                        disabled={!attarEnabled}
                                        onClick={() => setSelectedType('Attar')}
                                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer backdrop-blur-[2px] ${
                                            selectedType === 'Attar'
                                                ? 'border-gold bg-amber-500/10 shadow-sm ring-1 ring-gold'
                                                : attarEnabled
                                                    ? 'border-gold/15 bg-white/85 hover:border-gold/40 hover:bg-white'
                                                    : 'border-gray-200 bg-gray-100/80 opacity-40 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2.5">
                                            {/* Attar Bottle Real Image Icon */}
                                            <div className={`w-10 h-10 rounded-xl p-1 flex items-center justify-center border transition-colors ${
                                                selectedType === 'Attar'
                                                    ? 'bg-amber-50 border-gold/40 shadow-sm'
                                                    : 'bg-luxury-cream border-gold/15'
                                            }`}>
                                                <img
                                                    src="/attar_bg.png"
                                                    alt="Attar Bottle"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            {selectedType === 'Attar' && (
                                                <span className="w-4 h-4 bg-gold text-white rounded-full flex items-center justify-center text-[10px]">
                                                    <Check size={10} strokeWidth={3} />
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-sm text-charcoal">Attar</h4>
                                            <p className="text-[10px] text-charcoal/60 mt-0.5 leading-snug">
                                                Pure Oil • Alcohol Free
                                            </p>
                                            <p className="text-xs font-serif font-bold text-gold mt-1.5">
                                                From ₹{pricing.attar.minPrice}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Perfume Button */}
                                    <button
                                        type="button"
                                        disabled={!perfumeEnabled}
                                        onClick={() => setSelectedType('Perfume')}
                                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-left relative overflow-hidden flex flex-col justify-between cursor-pointer backdrop-blur-[2px] ${
                                            selectedType === 'Perfume'
                                                ? 'border-gold bg-amber-500/10 shadow-sm ring-1 ring-gold'
                                                : perfumeEnabled
                                                    ? 'border-gold/15 bg-white/85 hover:border-gold/40 hover:bg-white'
                                                    : 'border-gray-200 bg-gray-100/80 opacity-40 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2.5">
                                            {/* Perfume Spray Bottle Real Image Icon */}
                                            <div className={`w-10 h-10 rounded-xl p-1 flex items-center justify-center border transition-colors ${
                                                selectedType === 'Perfume'
                                                    ? 'bg-amber-50 border-gold/40 shadow-sm'
                                                    : 'bg-luxury-cream border-gold/15'
                                            }`}>
                                                <img
                                                    src="/perfume_bg.png"
                                                    alt="Perfume Bottle"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            {selectedType === 'Perfume' && (
                                                <span className="w-4 h-4 bg-gold text-white rounded-full flex items-center justify-center text-[10px]">
                                                    <Check size={10} strokeWidth={3} />
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-sm text-charcoal">Perfume</h4>
                                            <p className="text-[10px] text-charcoal/60 mt-0.5 leading-snug">
                                                Spray Mist • 35% EDP
                                            </p>
                                            <p className="text-xs font-serif font-bold text-gold mt-1.5">
                                                From ₹{pricing.perfume.minPrice}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Bottle Size */}
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-charcoal/50">
                                        2. Select Bottle Size
                                    </label>
                                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded-md">
                                        {selectedType}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    {Object.entries(currentMap).map(([sizeKey, item]) => {
                                        const isSelected = selectedSize === sizeKey;
                                        return (
                                            <button
                                                key={sizeKey}
                                                type="button"
                                                disabled={!item.enabled}
                                                onClick={() => setSelectedSize(sizeKey)}
                                                className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer relative backdrop-blur-[2px] ${
                                                    isSelected
                                                        ? 'border-gold bg-amber-500/10 shadow-sm ring-1 ring-gold text-charcoal font-bold'
                                                        : item.enabled
                                                            ? 'border-gold/15 bg-white/80 hover:border-gold/40 hover:bg-white text-charcoal'
                                                            : 'border-gray-200 bg-gray-50/80 opacity-40 cursor-not-allowed'
                                                }`}
                                            >
                                                {/* ml capacity big */}
                                                <span className="text-sm font-black text-charcoal">
                                                    {item.ml}
                                                </span>
                                                {/* Tier Label */}
                                                <span className="text-[10px] text-charcoal/50 uppercase tracking-wider font-semibold">
                                                    {item.sizeName}
                                                </span>

                                                <div className="flex items-baseline gap-1 mt-1.5">
                                                    <span className={`text-xs font-serif font-black ${isSelected ? 'text-gold' : 'text-charcoal'}`}>
                                                        ₹{item.price.toLocaleString()}
                                                    </span>
                                                    {item.mrp > item.price && (
                                                        <span className="text-[9px] text-charcoal/35 line-through">
                                                            ₹{item.mrp.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {item.discount > 0 && (
                                                    <span className="mt-1 px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-bold rounded-full">
                                                        {item.discount}% OFF
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Minimal Selection Summary Card with Bottle Image Thumbnail */}
                            <div className="bg-white/90 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-gold/20 flex items-center justify-between shadow-sm relative z-10 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-luxury-cream border border-gold/20 p-1 flex-shrink-0 flex items-center justify-center">
                                        <img
                                            src={selectedType === 'Attar' ? '/attar_bg.png' : '/perfume_bg.png'}
                                            alt={selectedType}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 block">Your Selection</span>
                                        <p className="text-xs sm:text-sm font-bold text-charcoal truncate mt-0.5">
                                            {selectedType} <span className="text-gold">•</span> {currentVariantObj.sizeName} ({currentVariantObj.ml})
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 block">Final Price</span>
                                    <div className="flex items-baseline justify-end gap-1.5">
                                        <span className="text-lg sm:text-xl font-serif font-black text-gold">₹{currentPrice.toLocaleString()}</span>
                                        {currentMrp > currentPrice && (
                                            <span className="text-xs text-charcoal/35 line-through">₹{currentMrp.toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-gold/15 flex gap-3 relative z-20">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-3.5 border border-gold/20 text-charcoal/70 font-semibold rounded-xl text-xs hover:bg-gold/5 transition-all text-center cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex-1 py-3.5 gold-gradient text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 cursor-pointer shimmer"
                            >
                                Proceed to Address & Payment <ArrowRight size={15} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}



