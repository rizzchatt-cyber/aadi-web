import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Phone, User, Home, Navigation, Mail, CheckCircle2, ChevronLeft, CreditCard, Sparkles, Loader2, QrCode, Copy, Check, Clock, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

export interface AddressData {
    email: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pinCode: string;
    paymentMethod?: 'online' | 'razorpay' | 'upi' | 'cod';
}

interface ShippingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddressData) => void;
    isSubmitting?: boolean;
    orderSuccessId?: string | null;
    defaultName?: string;
    defaultPhone?: string;
    defaultEmail?: string;
    codAvailable?: boolean;
    price?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    angle: number;
    size: number;
    delay: number;
    duration: number;
}

export default function ShippingModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    isSubmitting = false,
    orderSuccessId = null,
    defaultName = '', 
    defaultPhone = '', 
    defaultEmail = '',
    codAvailable = false,
    price = 0
}: ShippingModalProps) {
    const [step, setStep] = useState<1 | 2 | 2.5 | 3>(1);
    const [formData, setFormData] = useState<AddressData>({
        email: defaultEmail,
        fullName: defaultName,
        phone: defaultPhone,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pinCode: '',
        paymentMethod: 'razorpay'
    });

    const [error, setError] = useState('');
    const [particles, setParticles] = useState<Particle[]>([]);
    const [copiedUpi, setCopiedUpi] = useState(false);
    const [copiedOrder, setCopiedOrder] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes countdown (300 seconds)
    const [showAppChooser, setShowAppChooser] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Countdown Timer logic for Step 2.5
    useEffect(() => {
        if (step === 2.5) {
            setTimeLeft(300);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handlePayViaApp = (customScheme?: string) => {
        const upiUri = `upi://pay?pa=7024469904@ybl&pn=${encodeURIComponent("Aaditya's Aura")}&am=${price}&tn=${encodeURIComponent(orderSuccessId || '')}&cu=INR`;
        let targetUrl = upiUri;
        if (customScheme) {
            targetUrl = upiUri.replace('upi://', customScheme);
        }
        window.location.href = targetUrl;
    };

    const handlePrimaryPayViaApp = () => {
        // Attempt to launch default UPI deep link (opens 1 app if installed, or OS intent chooser if multiple)
        handlePayViaApp();
        // Toggle in-app chooser options modal
        setShowAppChooser((prev) => !prev);
    };

    useEffect(() => {
        if (isOpen) {
            setFormData({
                email: defaultEmail || '',
                fullName: defaultName || '',
                phone: defaultPhone || '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                pinCode: '',
                paymentMethod: 'razorpay'
            });
            setStep(1);
            setError('');
            setParticles([]);
            setCopiedUpi(false);
            setCopiedOrder(false);
            setShowAppChooser(false);
        }
    }, [isOpen, defaultName, defaultPhone, defaultEmail, codAvailable]);

    useEffect(() => {
        if (orderSuccessId) {
            if (formData.paymentMethod === 'upi' && step !== 3) {
                setStep(2.5); // Show UPI QR Code Screen
            } else {
                // Generate confetti particles
                const colors = ['#bf953f', '#fcf6ba', '#b38728', '#fbf5b7', '#aa771c', '#ffffff', '#e5e7eb'];
                const newParticles = Array.from({ length: 80 }).map((_, i) => ({
                    id: i,
                    x: Math.random() * 100, // horizontal start
                    y: -10 - Math.random() * 20, // vertical start above viewport
                    color: colors[Math.floor(Math.random() * colors.length)],
                    angle: Math.random() * 360,
                    size: Math.random() * 8 + 4, // 4px to 12px
                    delay: Math.random() * 0.4, // staggered entry
                    duration: Math.random() * 2 + 1.5 // 1.5s to 3.5s speed
                }));
                setParticles(newParticles);
                setStep(3);
            }
        }
    }, [orderSuccessId, formData.paymentMethod]);

    // Draw Golden QR Code with Center Logo
    useEffect(() => {
        if (step === 2.5 && orderSuccessId && canvasRef.current) {
            const canvas = canvasRef.current;
            const upiId = "7024469904@ybl";
            const recipientName = "Aadityas Aura";
            const note = orderSuccessId;
            const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipientName)}&am=${price}&tn=${encodeURIComponent(note)}&cu=INR`;

            QRCode.toCanvas(
                canvas,
                upiUri,
                {
                    width: 240,
                    margin: 2,
                    errorCorrectionLevel: 'H', // High error correction allows center logo overlay
                    color: {
                        dark: '#9a721d', // Luxury Golden dark modules
                        light: '#ffffff'
                    }
                },
                (err) => {
                    if (err) {
                        console.error("Error generating UPI QR code:", err);
                        return;
                    }
                    // Overlay Center Logo
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const logo = new Image();
                        logo.src = '/logo.png';
                        logo.onload = () => {
                            const logoSize = canvas.width * 0.22;
                            const x = (canvas.width - logoSize) / 2;
                            const y = (canvas.height - logoSize) / 2;

                            // Draw white rounded background box behind logo
                            ctx.fillStyle = '#ffffff';
                            ctx.beginPath();
                            if (typeof ctx.roundRect === 'function') {
                                ctx.roundRect(x - 4, y - 4, logoSize + 8, logoSize + 8, 8);
                            } else {
                                ctx.rect(x - 4, y - 4, logoSize + 8, logoSize + 8);
                            }
                            ctx.fill();

                            // Gold border around center logo
                            ctx.strokeStyle = '#bf953f';
                            ctx.lineWidth = 2;
                            ctx.stroke();

                            // Draw the logo image
                            ctx.drawImage(logo, x, y, logoSize, logoSize);
                        };
                    }
                }
            );
        }
    }, [step, orderSuccessId, price]);

    const validateStep1 = () => {
        setError('');
        if (!formData.email.trim() || !formData.email.includes('@')) {
            setError('Please enter a valid email address.');
            return false;
        }
        if (!formData.fullName.trim()) {
            setError('Full Name is required.');
            return false;
        }
        if (!formData.phone.trim() || formData.phone.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return false;
        }
        if (!formData.addressLine1.trim()) {
            setError('Flat/House/Street details are required.');
            return false;
        }
        if (!formData.city.trim()) {
            setError('City is required.');
            return false;
        }
        if (!formData.state.trim()) {
            setError('State is required.');
            return false;
        }
        if (!formData.pinCode.trim() || formData.pinCode.length !== 6 || isNaN(Number(formData.pinCode))) {
            setError('Please enter a valid 6-digit PIN Code.');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep1()) {
            onSubmit(formData);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={isSubmitting ? undefined : onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    />

                    {/* Confetti container */}
                    {step === 3 && (
                        <div className="fixed inset-x-0 top-0 bottom-0 pointer-events-none z-[120] overflow-hidden">
                            {particles.map((p) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ 
                                        x: `${p.x}vw`, 
                                        y: `${p.y}vh`, 
                                        rotate: p.angle,
                                        opacity: 1
                                    }}
                                    animate={{ 
                                        y: '105vh', 
                                        rotate: p.angle + 720,
                                        x: `${p.x + (Math.random() * 20 - 10)}vw`,
                                        opacity: [1, 1, 0.8, 0]
                                    }}
                                    transition={{ 
                                        duration: p.duration, 
                                        delay: p.delay,
                                        ease: "easeOut"
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: p.size,
                                        height: p.size,
                                        backgroundColor: p.color,
                                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                        pointerEvents: 'none'
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5 }}
                        className="w-full max-w-xl bg-white rounded-[32px] border border-gold/20 shadow-2xl overflow-hidden relative z-10 max-h-[90vh] flex flex-col"
                    >
                        {/* Gold accent bar at top */}
                        <div className="h-1.5 w-full gold-gradient" />

                        {/* Close button */}
                        {!isSubmitting && step !== 3 && (
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-charcoal/40 hover:text-gold rounded-full hover:bg-gold/5 transition-all"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="p-8 overflow-y-auto flex-grow">
                            {/* Steps Indicator */}
                            {step !== 3 && (
                                <div className="flex items-center justify-center gap-2 mb-8">
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-gold' : 'w-2 bg-gold/30'}`} />
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-gold' : 'w-2 bg-gold/30'}`} />
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 text-center mb-6">
                                    {error}
                                </div>
                            )}

                            {/* Step 1: Address Form */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center mb-6">
                                        <div className="w-12 h-12 bg-gold/5 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-gold/15">
                                            <MapPin className="text-gold" size={24} />
                                        </div>
                                        <h2 className="text-2xl font-serif text-charcoal mb-1">Shipping Address</h2>
                                        <p className="text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
                                            Please provide your physical delivery details
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Email */}
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={18} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                placeholder="Email Address (for order updates)"
                                                required
                                            />
                                        </div>

                                        {/* Full Name */}
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                placeholder="Recipient's Full Name"
                                                required
                                            />
                                        </div>

                                        {/* Phone Number */}
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={18} />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                maxLength={10}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                placeholder="10-digit Mobile Number"
                                                required
                                            />
                                        </div>

                                        {/* Address Line 1 */}
                                        <div className="relative group">
                                            <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={formData.addressLine1}
                                                onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                placeholder="Flat, House no., Building, Apartment"
                                                required
                                            />
                                        </div>

                                        {/* Address Line 2 */}
                                        <div className="relative group">
                                            <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={formData.addressLine2}
                                                onChange={e => setFormData({ ...formData, addressLine2: e.target.value })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                placeholder="Area, Street, Sector, Village (Optional)"
                                            />
                                        </div>

                                        {/* Grid of City, State, PIN */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                    placeholder="Town/City"
                                                    required
                                                />
                                            </div>
                                            <div className="relative group">
                                                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.state}
                                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                    className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                    placeholder="State"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* PIN Code */}
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={formData.pinCode}
                                                maxLength={6}
                                                onChange={e => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-charcoal focus:outline-none focus:border-gold transition-all"
                                                placeholder="6-digit PIN Code"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-3.5 border border-gold/20 text-charcoal font-bold rounded-xl text-sm hover:bg-gold/5 transition-all text-center cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex-1 py-3.5 gold-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-gold/20 transition-all text-center cursor-pointer"
                                        >
                                            Continue to Payment
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Payment Selector */}
                            {step === 2 && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="text-center mb-4">
                                        <div className="w-12 h-12 bg-gold/5 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-gold/15">
                                            <CreditCard className="text-gold" size={24} />
                                        </div>
                                        <h2 className="text-2xl font-serif text-charcoal mb-1">Select Payment Method</h2>
                                        <p className="text-[10px] text-charcoal/40 font-bold uppercase tracking-widest">
                                            Choose your preferred checkout option
                                        </p>
                                    </div>

                                    {/* Address Verification Summary */}
                                    <div className="bg-gold/5 rounded-2xl border border-gold/10 p-4 text-left space-y-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black uppercase text-gold tracking-widest">Delivery Summary</span>
                                            <button 
                                                type="button" 
                                                disabled={isSubmitting} 
                                                onClick={() => setStep(1)} 
                                                className="text-[9px] font-black text-charcoal/40 hover:text-gold uppercase tracking-wider"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-xs font-bold text-charcoal">{formData.fullName} • {formData.phone}</p>
                                        <p className="text-xs text-charcoal/60 truncate">{formData.addressLine1}, {formData.addressLine2 && `${formData.addressLine2}, `}{formData.city}, {formData.state} - {formData.pinCode}</p>
                                    </div>

                                    {/* Payment Options Header */}
                                    <div>
                                        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-3">Online & Offline Payment</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Razorpay (Online) Option */}
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                                                className={`py-4 px-4 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${
                                                    formData.paymentMethod === 'razorpay' || formData.paymentMethod === 'online'
                                                        ? 'border-gold bg-gold/5 text-gold shadow-md'
                                                        : 'border-gold/10 bg-zinc-50 text-charcoal/60 hover:border-gold/30'
                                                }`}
                                            >
                                                <div className={`p-2.5 rounded-xl ${formData.paymentMethod === 'razorpay' || formData.paymentMethod === 'online' ? 'bg-gold text-white' : 'bg-charcoal/5 text-charcoal/50'}`}>
                                                    <CreditCard size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-charcoal text-xs">Online Payment</p>
                                                    <p className="text-[9px] text-charcoal/40 font-normal">Cards, UPI, NetBanking, Wallets</p>
                                                </div>
                                            </button>

                                            {/* Cash on Delivery Option */}
                                            {codAvailable ? (
                                                <button
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                                                    className={`py-4 px-4 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${
                                                        formData.paymentMethod === 'cod'
                                                            ? 'border-gold bg-gold/5 text-gold shadow-md'
                                                            : 'border-gold/10 bg-zinc-50 text-charcoal/60 hover:border-gold/30'
                                                    }`}
                                                >
                                                    <div className={`p-2.5 rounded-xl ${formData.paymentMethod === 'cod' ? 'bg-gold text-white' : 'bg-charcoal/5 text-charcoal/50'}`}>
                                                        <Home size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-charcoal text-xs">Cash on Delivery</p>
                                                        <p className="text-[9px] text-charcoal/40 font-normal">Pay cash at your doorstep</p>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="py-4 px-4 rounded-2xl border border-dashed border-charcoal/10 bg-zinc-50/50 text-left flex items-center gap-3 opacity-50 select-none">
                                                    <div className="p-2.5 rounded-xl bg-charcoal/5 text-charcoal/30">
                                                        <Home size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-charcoal/40 text-xs">COD Unavailable</p>
                                                        <p className="text-[9px] text-charcoal/40">Only online payment methods active</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="pt-4 flex gap-4">
                                        {!isSubmitting && (
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="flex-1 py-3.5 border border-gold/20 text-charcoal font-bold rounded-xl text-sm hover:bg-gold/5 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                <ChevronLeft size={16} /> Back
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-3 py-3.5 gold-gradient text-white font-bold rounded-xl text-sm shadow-lg shadow-gold/20 transition-all text-center shimmer relative overflow-hidden cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                formData.paymentMethod === 'cod' 
                                                    ? 'Place COD Order' 
                                                    : formData.paymentMethod === 'upi' 
                                                        ? 'Generate UPI QR Code' 
                                                        : 'Pay with Razorpay'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 2.5: UPI QR Code Screen */}
                            {step === 2.5 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-5 text-center"
                                >
                                    <div className="space-y-1.5">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-[10px] font-bold text-gold uppercase tracking-widest">
                                            <QrCode size={14} /> Scan or Tap to Pay
                                        </div>
                                        <h2 className="text-2xl font-serif text-charcoal">Complete Payment</h2>
                                        
                                        {/* Countdown Timer Badge */}
                                        <div className="pt-1 flex items-center justify-center">
                                            {timeLeft > 0 ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-mono font-bold shadow-xs">
                                                    <Clock size={14} className="animate-pulse text-amber-600" />
                                                    <span>Pay within <strong className="text-amber-700">{formatTime(timeLeft)}</strong></span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-bold">
                                                    <Clock size={14} className="text-red-500" />
                                                    <span>Session Expired</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {timeLeft > 0 ? (
                                        <>
                                            {/* Golden QR Code Display Container */}
                                            <div className="bg-gradient-to-b from-amber-50 to-white p-5 rounded-3xl border-2 border-gold/30 shadow-lg max-w-sm mx-auto flex flex-col items-center gap-3">
                                                <div className="p-3 bg-white rounded-2xl border border-gold/20 shadow-md">
                                                    <canvas ref={canvasRef} className="rounded-xl" />
                                                </div>

                                                {/* Total Amount Badge */}
                                                <div className="w-full bg-gold/10 border border-gold/20 rounded-xl py-2.5 px-4 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest">Total Amount</span>
                                                    <span className="text-xl font-serif font-black text-gold">₹{price.toLocaleString()}</span>
                                                </div>

                                                {/* Order ID Box */}
                                                <div className="w-full text-left text-xs bg-white border border-gold/15 rounded-xl p-3 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-charcoal/40 uppercase">Order ID (Note)</p>
                                                        <p className="font-mono font-bold text-gold text-xs truncate max-w-[200px]">{orderSuccessId}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (orderSuccessId) {
                                                                navigator.clipboard.writeText(orderSuccessId);
                                                                setCopiedOrder(true);
                                                                setTimeout(() => setCopiedOrder(false), 2000);
                                                            }
                                                        }}
                                                        className="p-1.5 text-gold hover:bg-gold/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                                    >
                                                        {copiedOrder ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                                        {copiedOrder ? 'Copied' : 'Copy Note'}
                                                    </button>
                                                </div>

                                                {/* Direct App Launch Section */}
                                                <div className="w-full pt-1 space-y-2">
                                                    {/* Single Primary Installed UPI App Trigger */}
                                                    <button
                                                        type="button"
                                                        onClick={handlePrimaryPayViaApp}
                                                        className="w-full py-3.5 px-4 gold-gradient text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden group"
                                                    >
                                                        <Smartphone size={16} className="text-white group-hover:scale-110 transition-transform" /> 
                                                        <span>Pay with Installed UPI App</span>
                                                    </button>

                                                    <div className="text-center pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAppChooser((prev) => !prev)}
                                                            className="text-[10px] font-bold text-gold hover:text-amber-700 underline underline-offset-2 transition-colors cursor-pointer"
                                                        >
                                                            {showAppChooser ? 'Hide App Options ▲' : 'Choose specific UPI App (GPay, PhonePe, Paytm...) ▼'}
                                                        </button>
                                                    </div>

                                                    {/* Interactive App Chooser Options */}
                                                    <AnimatePresence>
                                                        {showAppChooser && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="w-full bg-white/95 border border-gold/20 rounded-2xl p-3 shadow-md text-left space-y-2.5 overflow-hidden"
                                                            >
                                                                <div className="flex justify-between items-center pb-1.5 border-b border-gold/10">
                                                                    <div>
                                                                        <p className="text-xs font-bold text-charcoal">Select UPI App</p>
                                                                        <p className="text-[9px] text-charcoal/40">If multiple UPI apps are installed, tap one below:</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowAppChooser(false)}
                                                                        className="p-1 text-charcoal/40 hover:text-gold rounded-full transition-colors cursor-pointer"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp();
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-gold/10 border border-gold/30 hover:bg-gold/20 rounded-xl text-xs font-bold text-gold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer col-span-2"
                                                                    >
                                                                        <Smartphone size={14} /> Auto-Detect / Default App
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp('tez://');
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-white border border-gold/20 hover:border-gold hover:bg-gold/5 rounded-xl text-xs font-bold text-charcoal/80 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Google Pay
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp('phonepe://');
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-white border border-gold/20 hover:border-gold hover:bg-gold/5 rounded-xl text-xs font-bold text-charcoal/80 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> PhonePe
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp('paytmmp://');
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-white border border-gold/20 hover:border-gold hover:bg-gold/5 rounded-xl text-xs font-bold text-charcoal/80 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Paytm
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp('bhim://');
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-white border border-gold/20 hover:border-gold hover:bg-gold/5 rounded-xl text-xs font-bold text-charcoal/80 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> BHIM
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp('amazonpay://');
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-white border border-gold/20 hover:border-gold hover:bg-gold/5 rounded-xl text-xs font-bold text-charcoal/80 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Amazon Pay
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handlePayViaApp('cred://');
                                                                            setShowAppChooser(false);
                                                                        }}
                                                                        className="py-2.5 px-3 bg-white border border-gold/20 hover:border-gold hover:bg-gold/5 rounded-xl text-xs font-bold text-charcoal/80 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-black" /> CRED UPI
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-2 max-w-sm mx-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Trigger Confetti & Step 3 Success
                                                        const colors = ['#bf953f', '#fcf6ba', '#b38728', '#fbf5b7', '#aa771c', '#ffffff', '#e5e7eb'];
                                                        const newParticles = Array.from({ length: 80 }).map((_, i) => ({
                                                            id: i,
                                                            x: Math.random() * 100,
                                                            y: -10 - Math.random() * 20,
                                                            color: colors[Math.floor(Math.random() * colors.length)],
                                                            angle: Math.random() * 360,
                                                            size: Math.random() * 8 + 4,
                                                            delay: Math.random() * 0.4,
                                                            duration: Math.random() * 2 + 1.5
                                                        }));
                                                        setParticles(newParticles);
                                                        setStep(3);
                                                    }}
                                                    className="w-full py-4 gold-gradient text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-gold/25 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={18} /> I Have Completed Payment
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center space-y-4 max-w-sm mx-auto">
                                            <p className="text-xs text-red-600 font-bold">Payment session has expired (5 minute limit reached).</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTimeLeft(300);
                                                    setStep(2);
                                                }}
                                                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
                                            >
                                                <RefreshCw size={14} /> Try Again
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 3: Success Screen */}
                            {step === 3 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 space-y-6"
                                >
                                    <div className="w-20 h-20 bg-green-50 rounded-full mx-auto flex items-center justify-center border border-green-200 shadow-lg shadow-green-100 relative">
                                        <CheckCircle2 className="text-green-500" size={48} />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: [1, 0], scale: [1, 2] }}
                                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                                            className="absolute inset-0 rounded-full border-2 border-green-400 pointer-events-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-serif text-charcoal">Order Placed!</h2>
                                        <p className="text-[10px] text-gold font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                                            <Sparkles size={12} /> Masterpiece Reserved <Sparkles size={12} />
                                        </p>
                                    </div>

                                    <div className="bg-gold/5 rounded-[24px] border border-gold/10 p-6 space-y-3 max-w-sm mx-auto text-left">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-bold text-charcoal/40 uppercase tracking-widest">Order ID</span>
                                            <p className="font-mono text-sm font-bold text-charcoal select-all truncate">{orderSuccessId}</p>
                                        </div>
                                        <div className="w-full h-px bg-gold/10" />
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-bold text-charcoal/40 uppercase tracking-widest">Payment Method</span>
                                            <p className="text-xs font-bold text-charcoal">
                                                {formData.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online'}
                                            </p>
                                        </div>
                                        <div className="w-full h-px bg-gold/10" />
                                        <p className="text-[10px] text-charcoal/50 leading-relaxed font-medium">
                                            A confirmation email with tracking details has been dispatched to <span className="font-bold text-charcoal/70">{formData.email}</span>.
                                        </p>
                                    </div>

                                    <div className="pt-4 max-w-xs mx-auto">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="w-full py-4 gold-gradient text-white font-bold rounded-2xl text-sm shadow-xl shadow-gold/25 transition-all text-center cursor-pointer uppercase tracking-widest"
                                        >
                                            Continue Journey
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
