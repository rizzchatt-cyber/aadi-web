import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getOptimizedImageUrl } from '../utils/imageFormatter';
import DriveImage from '../components/DriveImage';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronLeft,
    Star,
    MessageCircle,
    Calendar,
    Truck,
    ShieldCheck,
    Maximize2,
    X,
    Plus,
    Minus,
    Share2,
    ShoppingCart
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ShippingModal, { AddressData } from '../components/ShippingModal';
import FragranceSelectionModal, { SelectedFragranceVariant } from '../components/FragranceSelectionModal';
import { shareProductDirectly } from '../utils/shareUtils';
import { checkoutWithRazorpay } from '../utils/razorpay';
import { isFragranceProduct, getFragrancePricing } from '../utils/fragranceHelpers';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFragranceModalOpen, setIsFragranceModalOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<SelectedFragranceVariant | null>(null);
    const [isShippingOpen, setIsShippingOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error("Error fetching product:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        if (!product) return;

        const originalTitle = document.title;
        const pageTitle = `${product.title} | Aaditya's Aura`;
        document.title = pageTitle;

        const priceText = product.priceOnRequest
            ? 'Price on Request'
            : product.price
            ? `₹${Number(product.price).toLocaleString('en-IN')}`
            : '';

        const primaryImage = product.images?.[0]
            ? getOptimizedImageUrl(product.images[0])
            : 'https://aadityasaura.com/logo.png';

        const descriptionText = product.description
            ? `${priceText ? priceText + ' • ' : ''}${String(product.description).replace(/\s+/g, ' ').trim().slice(0, 180)}`
            : `${priceText ? priceText + ' - ' : ''}Discover ${product.title} at Aaditya's Aura. Pure Luxury Jewellery, Attar & Perfume.`;

        const updateMeta = (attr: string, key: string, content: string) => {
            let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        const currentUrl = window.location.href;

        // Open Graph
        updateMeta('property', 'og:title', pageTitle);
        updateMeta('property', 'og:description', descriptionText);
        updateMeta('property', 'og:image', primaryImage);
        updateMeta('property', 'og:url', currentUrl);
        updateMeta('property', 'og:type', 'product');

        // Twitter Card
        updateMeta('name', 'twitter:title', pageTitle);
        updateMeta('name', 'twitter:description', descriptionText);
        updateMeta('name', 'twitter:image', primaryImage);
        updateMeta('name', 'twitter:card', 'summary_large_image');

        // Canonical link
        let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonicalEl) {
            canonicalEl = document.createElement('link');
            canonicalEl.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalEl);
        }
        canonicalEl.setAttribute('href', currentUrl);

        return () => {
            document.title = originalTitle;
            updateMeta('property', 'og:title', "Aaditya’s Aura | Pure Luxury Jewellery, Attar & Perfume");
            updateMeta('property', 'og:image', "https://aadityasaura.com/logo.png");
            updateMeta('name', 'twitter:image', "https://aadityasaura.com/logo.png");
        };
    }, [product]);

    const handleAddToCart = async () => {
        if (!product) return;

        if (user) {
            try {
                // Save to Firestore
                await addDoc(collection(db, "carts"), {
                    userId: user.uid,
                    userEmail: user.email,
                    productId: id,
                    productTitle: product.title,
                    price: product.priceOnRequest ? 'On Request' : product.price,
                    imageUrl: product.images?.[0] || '',
                    status: 'active',
                    createdAt: new Date().toISOString()
                });
                alert("Successfully added to cart!");
            } catch (err) {
                console.error("Error adding to cart:", err);
                alert("Could not add to cart. Please try again.");
            }
        } else {
            // Redirect to login page to "save" their cart intention
            navigate('/login', { state: { returnTo: `/product/${id}`, action: 'add_to_cart', product: product } });
        }
    };

    const fragrancePricing = getFragrancePricing(product);

    const handleShopNow = () => {
        if (isFragranceProduct(product)) {
            setIsFragranceModalOpen(true);
        } else {
            setIsShippingOpen(true);
        }
    };

    const handleProceedFromFragranceModal = (variant: SelectedFragranceVariant) => {
        setSelectedVariant(variant);
        setIsFragranceModalOpen(false);
        setIsShippingOpen(true);
    };

    const handleShippingSubmit = async (addressData: AddressData) => {
        if (!product) return;
        setIsSubmitting(true);

        const emailToSave = addressData.email || user?.email || "guest@aadityaaura.com";
        const basePrice = selectedVariant ? selectedVariant.price : (product.price || 0);
        const isFragrance = isFragranceProduct(product);
        const codFee = (addressData.paymentMethod === 'cod')
            ? (product?.codPrice ? Math.max(0, product.codPrice - basePrice) : (isFragrance ? 50 : 0))
            : 0;
        const finalPrice = (addressData.paymentMethod === 'cod' && product?.codPrice) ? product.codPrice : (basePrice + codFee);
        const itemTitle = selectedVariant 
            ? `${product.title} (${selectedVariant.type} • ${selectedVariant.size})`
            : product.title;

        if (addressData.paymentMethod === 'cod') {
            const codPaymentId = `COD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            try {
                const orderRef = await addDoc(collection(db, "orders"), {
                    userId: user?.uid || "guest",
                    userEmail: emailToSave,
                    userName: addressData.fullName,
                    userPhone: addressData.phone,
                    paymentId: codPaymentId,
                    paymentMethod: 'cod',
                    shippingAddress: addressData,
                    selectedVariant: selectedVariant || null,
                    items: [
                        {
                            productId: id,
                            productTitle: itemTitle,
                            price: finalPrice,
                            imageUrl: product.images?.[0] || '',
                            quantity: 1
                        }
                    ],
                    totalAmount: finalPrice,
                    status: 'cod_pending',
                    createdAt: new Date().toISOString()
                });
                setOrderSuccessId(orderRef.id);
            } catch (err: any) {
                console.error("Error saving COD order:", err);
                alert(`Error placing order: ${err.message}`);
            } finally {
                setIsSubmitting(false);
            }
        } else if (addressData.paymentMethod === 'upi') {
            const upiPaymentId = `UPI_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            try {
                const orderRef = await addDoc(collection(db, "orders"), {
                    userId: user?.uid || "guest",
                    userEmail: emailToSave,
                    userName: addressData.fullName,
                    userPhone: addressData.phone,
                    paymentId: upiPaymentId,
                    paymentMethod: 'upi',
                    shippingAddress: addressData,
                    selectedVariant: selectedVariant || null,
                    items: [
                        {
                            productId: id,
                            productTitle: itemTitle,
                            price: finalPrice,
                            imageUrl: product.images?.[0] || '',
                            quantity: 1
                        }
                    ],
                    totalAmount: finalPrice,
                    status: 'upi_pending',
                    createdAt: new Date().toISOString()
                });
                setOrderSuccessId(orderRef.id);
            } catch (err: any) {
                console.error("Error saving UPI order:", err);
                alert(`Error placing order: ${err.message}`);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            checkoutWithRazorpay({
                amount: finalPrice,
                description: itemTitle,
                userName: addressData.fullName,
                userEmail: emailToSave,
                userPhone: addressData.phone,
                onSuccess: async (paymentId) => {
                    try {
                        const orderRef = await addDoc(collection(db, "orders"), {
                            userId: user?.uid || "guest",
                            userEmail: emailToSave,
                            userName: addressData.fullName,
                            userPhone: addressData.phone,
                            paymentId: paymentId,
                            paymentMethod: 'online',
                            shippingAddress: addressData,
                            selectedVariant: selectedVariant || null,
                            items: [
                                {
                                    productId: id,
                                    productTitle: itemTitle,
                                    price: finalPrice,
                                    imageUrl: product.images?.[0] || '',
                                    quantity: 1
                                }
                            ],
                            totalAmount: finalPrice,
                            status: 'paid',
                            createdAt: new Date().toISOString()
                        });
                        setOrderSuccessId(orderRef.id);
                    } catch (err) {
                        console.error("Error saving order:", err);
                        alert(`Payment successful (ID: ${paymentId}), but recording order failed. Please contact customer support.`);
                    } finally {
                        setIsSubmitting(false);
                    }
                },
                onDismiss: () => {
                    setIsSubmitting(false);
                }
            });
        }
    };

    const getWhatsAppLink = () => {
        const priceText = product.priceOnRequest 
            ? "Exclusive Pricing via WhatsApp" 
            : `₹${(product.price || 0).toLocaleString()}${product.codPrice ? ` (COD: ₹${product.codPrice.toLocaleString()})` : ''}`;
        const imageUrl = product.images?.[0] || '';
        const message = encodeURIComponent(`Hello! I'm interested in ordering: ${product.title} (${priceText}).\n\nImage: ${imageUrl}\n\nLink: ${window.location.href}`);
        return `https://wa.me/918653535303?text=${message}`;
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-luxury-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                    <p className="text-gold font-serif italic">Loading Masterpiece...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-luxury-white p-6">
                <h2 className="text-2xl font-serif mb-4">Product Not Found</h2>
                <button
                    onClick={() => navigate('/collections')}
                    className="px-8 py-3 gold-gradient text-white font-bold rounded-full"
                >
                    Back to Collection
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-luxury-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-charcoal/60 hover:text-gold mb-8 transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <p className="text-sm font-bold uppercase tracking-widest">Back to Collection</p>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Image Gallery */}
                    <div className="space-y-6">
                        <div className="relative aspect-square rounded-[40px] overflow-hidden bg-white border border-gold/10 shadow-luxury group">
                            <div key={activeImage} className="w-full h-full">
                                <DriveImage
                                    src={product.images?.[activeImage]}
                                    alt={product.title}
                                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>

                            <button
                                onClick={() => setIsZoomed(true)}
                                className="absolute bottom-6 right-6 p-4 bg-white/80 backdrop-blur-md rounded-full text-gold shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-gold hover:text-white"
                            >
                                <Maximize2 size={24} />
                            </button>

                            {/* Share button overlay */}
                            <button
                                onClick={() => shareProductDirectly(product)}
                                className="absolute top-8 right-8 z-10 w-11 h-11 bg-white/90 backdrop-blur-md rounded-full text-charcoal/70 shadow-md border border-gold/25 flex items-center justify-center transition-all hover:bg-gold hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                                aria-label="Share product"
                                title="Share product"
                            >
                                <Share2 size={18} />
                            </button>

                            {isFragranceProduct(product) ? (
                                <div className="absolute top-8 left-8 bg-red-600 text-white font-black px-4 py-2 rounded-xl shadow-xl text-lg">
                                    {fragrancePricing.overallMaxDiscount}% OFF
                                </div>
                            ) : product.discount > 0 ? (
                                <div className="absolute top-8 left-8 bg-red-600 text-white font-black px-4 py-2 rounded-xl shadow-xl text-lg">
                                    {product.discount}% OFF
                                </div>
                            ) : null}
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === idx ? 'border-gold shadow-lg shadow-gold/20' : 'border-gold/10 opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <DriveImage src={img} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Meta */}
                    <div className="flex flex-col">
                        <div className="mb-8">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <span className="px-3 py-1 bg-gold/5 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                                    {product.material || 'Aura Selection'}
                                </span>
                                <button
                                    onClick={() => shareProductDirectly(product)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-gold/25 text-charcoal/70 hover:text-gold shadow-xs hover:shadow text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                                >
                                    <Share2 size={13} className="text-gold" />
                                    <span>Share</span>
                                </button>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-4 leading-tight">{product.title}</h1>
                            <div className="flex items-center gap-4">
                                {isFragranceProduct(product) ? (
                                    <div className="flex flex-col gap-3 bg-gradient-to-r from-gold/10 via-amber-50/60 to-gold/10 p-4 md:p-5 rounded-2xl border border-gold/20 shadow-sm w-full">
                                        <div className="flex flex-wrap items-center gap-6">
                                            {/* Attar Starting */}
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Attar Starting</span>
                                                <div className="flex items-baseline gap-2 mt-0.5">
                                                    <span className="text-2xl font-serif font-black text-charcoal">₹{fragrancePricing.attar.minPrice.toLocaleString()}</span>
                                                    <span className="text-sm text-charcoal/40 line-through">₹{fragrancePricing.attar.minMrp.toLocaleString()}</span>
                                                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{fragrancePricing.attar.maxDiscount}% OFF</span>
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-gold/20 hidden sm:block" />
                                            {/* Perfume Starting */}
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Perfume Starting</span>
                                                <div className="flex items-baseline gap-2 mt-0.5">
                                                    <span className="text-2xl font-serif font-black text-charcoal">₹{fragrancePricing.perfume.minPrice.toLocaleString()}</span>
                                                    <span className="text-sm text-charcoal/40 line-through">₹{fragrancePricing.perfume.minMrp.toLocaleString()}</span>
                                                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{fragrancePricing.perfume.maxDiscount}% OFF</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gold/15 flex flex-wrap items-center gap-2 text-xs font-medium text-charcoal/70">
                                            <span className="font-bold text-charcoal uppercase tracking-wider text-[10px] bg-gold/10 px-2 py-0.5 rounded">Sizes:</span>
                                            <span className="font-bold text-charcoal">Attar</span> <span className="text-[10px] text-charcoal/50">(3ml, 6ml, 12ml)</span> • 
                                            <span className="font-bold text-charcoal">Perfume</span> <span className="text-[10px] text-charcoal/50">(10-15ml, 20-25ml, 30ml, 50-60ml, 100ml)</span>
                                        </div>
                                    </div>
                                ) : product.priceOnRequest ? (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-2xl md:text-3xl font-serif text-gold font-bold">Exclusive Pricing via WhatsApp</p>
                                        <motion.a
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            href={getWhatsAppLink()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-green-500/10 flex items-center justify-center gap-2 w-fit"
                                        >
                                            <MessageCircle size={16} /> Order on WhatsApp
                                        </motion.a>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-baseline gap-3">
                                        <p className="text-3xl font-serif text-charcoal">₹{(product.price || 0).toLocaleString()}</p>
                                        {product.discount > 0 && (
                                            <p className="text-xl text-charcoal/30 line-through decoration-red-500/50">
                                                ₹{Math.round(product.price * (1 + product.discount / 100)).toLocaleString()}
                                            </p>
                                        )}
                                        {product.codPrice && (
                                            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full">
                                                COD: ₹{product.codPrice.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Highlights */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            {product.hallmarkInfo && (
                                <div className="bg-gold/5 border border-gold/10 p-4 rounded-2xl flex items-center gap-4">
                                    <ShieldCheck className="text-gold" size={24} />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">Purity</p>
                                        <p className="text-xs font-bold text-charcoal">{product.hallmarkInfo}</p>
                                    </div>
                                </div>
                            )}
                            {product.weight && (
                                <div className="bg-gold/5 border border-gold/10 p-4 rounded-2xl flex items-center gap-4">
                                    <Maximize2 className="text-gold" size={24} />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">Weight & Size</p>
                                        <p className="text-xs font-bold text-charcoal">{product.weight.replace(/\b50\s*ml\b/gi, '50-60ml')}</p>
                                    </div>
                                </div>
                            )}
                            <div className="bg-gold/5 border border-gold/10 p-4 rounded-2xl flex items-center gap-4">
                                <Truck className="text-gold" size={24} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">Shipping</p>
                                    <p className="text-xs font-bold text-charcoal">Free Delivery</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-12">
                            <div className="relative group">
                                <div 
                                    className={`text-charcoal/70 text-base leading-relaxed font-serif italic transition-all duration-500 overflow-hidden ${!isExpanded && (product.description?.length > 300) ? 'max-h-[160px]' : 'max-h-[2000px]'}`}
                                >
                                    {(product.description || 'No description available for this exquisite masterpiece.')
                                        .replace(/\b50\s*ml\b/gi, '50-60ml')
                                        .replace(/(\u2014{2,}|-{2,})(?=\s*[\u2700-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF0-9])/g, '\n') // Split by long dashes if followed by point markers
                                        .split('\n')
                                        .map((line: string, i: number) => {
                                            const trimmedLine = line.trim();
                                            if (!trimmedLine) return <div key={i} className="h-4" />;
                                            
                                            // Detect points (starts with number, emoji, or bullet)
                                            const isPoint = /^[0-9]\.|^[\u2700-\u27BF]|^[\uD83C-\uDBFF\uDC00-\uDFFF]|^[\u2022\u2023\u25E6\u2043\u2219]/.test(trimmedLine);
                                            
                                            return (
                                                <p 
                                                    key={i} 
                                                    className={`${isPoint ? 'flex gap-3 items-start pl-2 mb-4 not-italic font-sans text-sm font-medium' : 'mb-4'}`}
                                                >
                                                    {isPoint && <span className="text-gold mt-1 text-[8px]">◆</span>}
                                                    <span className="flex-1">{trimmedLine}</span>
                                                </p>
                                            );
                                        })}
                                </div>
                                
                                {!isExpanded && (product.description?.length > 300) && (
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-luxury-white to-transparent pointer-events-none" />
                                )}
                            </div>

                            {product.description?.length > 300 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="mt-4 text-gold text-[10px] font-bold uppercase tracking-widest hover:tracking-[0.2em] transition-all flex items-center gap-2 group"
                                >
                                    {isExpanded ? (
                                        <>Show Less <Minus size={12} className="group-hover:rotate-180 transition-transform duration-500" /></>
                                    ) : (
                                        <>Read Full Description <Plus size={12} className="group-hover:rotate-90 transition-transform duration-500" /></>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4 mt-auto">
                            {!product.priceOnRequest && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleShopNow}
                                    className="w-full py-5 gold-gradient text-white font-bold rounded-2xl shadow-xl shadow-gold/30 flex items-center justify-center gap-3 transition-all shimmer relative overflow-hidden text-lg cursor-pointer"
                                >
                                    Shop Now
                                </motion.button>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.a
                                    whileHover={{ scale: 1.02, backgroundColor: '#128C7E' }}
                                    whileTap={{ scale: 0.98 }}
                                    href={getWhatsAppLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-grow py-5 bg-[#25D366] text-white font-bold rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 transition-all"
                                >
                                    <MessageCircle size={24} />
                                    Order on WhatsApp
                                </motion.a>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddToCart}
                                    className="flex-grow py-5 bg-charcoal text-white font-bold rounded-2xl shadow-xl shadow-charcoal/10 flex items-center justify-center gap-3 relative overflow-hidden group border border-gold/10 hover:bg-charcoal/90 transition-colors cursor-pointer"
                                >
                                    <ShoppingCart size={24} />
                                    Add to Cart
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => shareProductDirectly(product)}
                                    className="py-5 px-6 bg-luxury-cream border-2 border-gold/30 hover:border-gold text-charcoal font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 hover:bg-gold/10 transition-all cursor-pointer"
                                    title="Share Masterpiece"
                                    aria-label="Share Masterpiece"
                                >
                                    <Share2 size={22} className="text-gold" />
                                    <span className="sm:hidden text-sm">Share</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zoom Modal */}
            <AnimatePresence>
                {isZoomed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
                    >
                        <button
                            onClick={() => setIsZoomed(false)}
                            className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors p-2"
                        >
                            <X size={32} />
                        </button>
                        <DriveImage
                            src={product.images?.[activeImage]}
                            alt={product.title}
                            className="max-w-full max-h-full object-contain rounded-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fragrance Variant Selection Modal */}
            <FragranceSelectionModal
                isOpen={isFragranceModalOpen}
                onClose={() => setIsFragranceModalOpen(false)}
                product={product}
                onProceedToCheckout={handleProceedFromFragranceModal}
            />

            {/* Shipping Address Modal */}
            <ShippingModal
                isOpen={isShippingOpen}
                onClose={() => {
                    setIsShippingOpen(false);
                    if (orderSuccessId) {
                        setOrderSuccessId(null);
                        if (user) {
                            navigate('/dashboard');
                        } else {
                            navigate('/');
                        }
                    }
                    setIsSubmitting(false);
                }}
                onSubmit={handleShippingSubmit}
                isSubmitting={isSubmitting}
                orderSuccessId={orderSuccessId}
                defaultName={user?.displayName || ''}
                defaultEmail={user?.email || ''}
                codAvailable={isFragranceProduct(product) ? true : (product?.codAvailable || false)}
                price={selectedVariant ? selectedVariant.price : (product?.price || 0)}
                codPrice={product?.codPrice}
                selectedVariant={selectedVariant}
                isFragrance={isFragranceProduct(product)}
            />
        </div>
    );
}
