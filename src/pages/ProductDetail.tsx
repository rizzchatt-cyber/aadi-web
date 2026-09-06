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
import AttarPerfumeOptionModal from '../components/AttarPerfumeOptionModal';
import { checkoutWithRazorpay } from '../utils/razorpay';
import { isAttarPerfumeProduct } from '../utils/productUtils';

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
    const [isShippingOpen, setIsShippingOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

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

    const handleShopNow = () => {
        setIsShippingOpen(true);
    };

    const handleShippingSubmit = async (addressData: AddressData) => {
        if (!product) return;
        setIsSubmitting(true);

        const emailToSave = addressData.email || user?.email || "guest@aadityaaura.com";
        const selectedFragrance = addressData.selectedFragrance || '';
        const productType = addressData.productType || 'Attar';

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
                    productType: productType,
                    fragranceOption: selectedFragrance,
                    items: [
                        {
                            productId: id,
                            productTitle: product.title,
                            price: product.price,
                            imageUrl: product.images?.[0] || '',
                            quantity: 1,
                            productType: productType,
                            selectedFragrance: selectedFragrance
                        }
                    ],
                    totalAmount: product.price,
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
                    productType: productType,
                    fragranceOption: selectedFragrance,
                    items: [
                        {
                            productId: id,
                            productTitle: product.title,
                            price: product.price,
                            imageUrl: product.images?.[0] || '',
                            quantity: 1,
                            productType: productType,
                            selectedFragrance: selectedFragrance
                        }
                    ],
                    totalAmount: product.price,
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
                amount: product.price,
                description: product.title,
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
                            productType: productType,
                            fragranceOption: selectedFragrance,
                            items: [
                                {
                                    productId: id,
                                    productTitle: product.title,
                                    price: product.price,
                                    imageUrl: product.images?.[0] || '',
                                    quantity: 1,
                                    productType: productType,
                                    selectedFragrance: selectedFragrance
                                }
                            ],
                            totalAmount: product.price,
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

    const handleWhatsAppClick = () => {
        if (!product) return;
        if (isAttarPerfumeProduct(product)) {
            setIsWhatsAppModalOpen(true);
        } else {
            const priceText = product.priceOnRequest ? "Exclusive Pricing via WhatsApp" : `₹${(product.price || 0).toLocaleString()}`;
            const imageUrl = product.images?.[0] || '';
            const messageText = `Hello! I'm interested in ordering: ${product.title} (${priceText}).\n\nImage: ${imageUrl}\n\nLink: ${window.location.href}`;
            const url = `https://wa.me/918653535303?text=${encodeURIComponent(messageText)}`;
            window.open(url, '_blank');
        }
    };

    const handleConfirmWhatsAppOption = (type: 'Attar' | 'Perfume', fragranceVariant: string) => {
        setIsWhatsAppModalOpen(false);
        const priceText = product.priceOnRequest ? "Exclusive Pricing via WhatsApp" : `₹${(product.price || 0).toLocaleString()}`;
        const imageUrl = product.images?.[0] || '';
        const optionStr = fragranceVariant ? `${type} (${fragranceVariant})` : type;
        const messageText = `Hello! I'm interested in ordering: ${product.title} (${priceText}).\nOption Selected: ${optionStr}\n\nImage: ${imageUrl}\n\nLink: ${window.location.href}`;
        const url = `https://wa.me/918653535303?text=${encodeURIComponent(messageText)}`;
        window.open(url, '_blank');
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

                            {product.discount > 0 && (
                                <div className="absolute top-8 left-8 bg-red-600 text-white font-black px-4 py-2 rounded-xl shadow-xl text-lg">
                                    {product.discount}% OFF
                                </div>
                            )}
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
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-gold/5 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                                    {product.material || 'Aura Selection'}
                                </span>
                                {product.showRating && product.rating > 0 && (
                                    <div className="flex items-center gap-1 text-gold">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-xs font-bold">{product.rating}</span>
                                        <span className="text-charcoal/30 text-[10px] font-bold">({product.reviewCount} Reviews)</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-serif text-charcoal mb-4 leading-tight">{product.title}</h1>
                            <div className="flex items-center gap-4">
                                {product.priceOnRequest ? (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-2xl md:text-3xl font-serif text-gold font-bold">Exclusive Pricing via WhatsApp</p>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsWhatsAppModalOpen(true)}
                                            className="px-6 py-3 bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-green-500/10 flex items-center justify-center gap-2 w-fit cursor-pointer"
                                        >
                                            <MessageCircle size={16} /> Order on WhatsApp
                                        </motion.button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-3xl font-serif text-charcoal">₹{(product.price || 0).toLocaleString()}</p>
                                        {product.discount > 0 && (
                                            <p className="text-xl text-charcoal/30 line-through decoration-red-500/50">
                                                ₹{Math.round(product.price * (1 + product.discount / 100)).toLocaleString()}
                                            </p>
                                        )}
                                    </>
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
                                        <p className="text-xs font-bold text-charcoal">{product.weight}</p>
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
                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: '#128C7E' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleWhatsAppClick}
                                    className="flex-grow py-5 bg-[#25D366] text-white font-bold rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 transition-all cursor-pointer"
                                >
                                    <MessageCircle size={24} />
                                    Order on WhatsApp
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleAddToCart}
                                    className="flex-grow py-5 bg-charcoal text-white font-bold rounded-2xl shadow-xl shadow-charcoal/10 flex items-center justify-center gap-3 relative overflow-hidden group border border-gold/10 hover:bg-charcoal/90 transition-colors cursor-pointer"
                                >
                                    <ShoppingCart size={24} />
                                    Add to Cart
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
                codAvailable={product?.codAvailable || false}
                price={product?.price || 0}
                availableFragrances={product?.fragranceOptions ? (Array.isArray(product.fragranceOptions) ? product.fragranceOptions : product.fragranceOptions.split(',').map((s: string) => s.trim())) : undefined}
                fragranceRequired={isAttarPerfumeProduct(product)}
            />

            {/* Attar / Perfume WhatsApp Option Popup */}
            <AttarPerfumeOptionModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                product={product}
                onConfirm={handleConfirmWhatsAppOption}
            />
        </div>
    );
}
