import { LazyImage } from '../components/LazyImage';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShoppingBag, MapPin, LogOut, ShoppingCart, Trash2 } from 'lucide-react';
import { auth, db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, addDoc, getDoc } from 'firebase/firestore';
import ShippingModal, { AddressData } from '../components/ShippingModal';
import { checkoutWithRazorpay } from '../utils/razorpay';

export default function UserDashboard() {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const [carts, setCarts] = useState<any[]>([]);
    const [isShippingOpen, setIsShippingOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
    const [codAvailable, setCodAvailable] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);

    const purchasableItems = carts.filter(item => typeof item.price === 'number');
    const totalAmount = purchasableItems.reduce((sum, item) => sum + item.price, 0);

    const handleCartCheckout = () => {
        setIsShippingOpen(true);
    };

    const handleShippingSubmit = async (addressData: AddressData) => {
        if (purchasableItems.length === 0) return;
        setIsSubmitting(true);

        const emailToSave = addressData.email || user?.email || "guest@aadityaaura.com";

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
                    items: purchasableItems.map(item => ({
                        productId: item.productId,
                        productTitle: item.productTitle,
                        price: item.price,
                        imageUrl: item.imageUrl || '',
                        quantity: 1
                    })),
                    totalAmount: totalAmount,
                    status: 'cod_pending',
                    createdAt: new Date().toISOString()
                });

                for (const item of purchasableItems) {
                    await deleteDoc(doc(db, "carts", item.id));
                }

                setOrderSuccessId(orderRef.id);
            } catch (err: any) {
                console.error("Error saving COD cart order:", err);
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
                    items: purchasableItems.map(item => ({
                        productId: item.productId,
                        productTitle: item.productTitle,
                        price: item.price,
                        imageUrl: item.imageUrl || '',
                        quantity: 1
                    })),
                    totalAmount: totalAmount,
                    status: 'upi_pending',
                    createdAt: new Date().toISOString()
                });

                for (const item of purchasableItems) {
                    await deleteDoc(doc(db, "carts", item.id));
                }

                setOrderSuccessId(orderRef.id);
            } catch (err: any) {
                console.error("Error saving UPI cart order:", err);
                alert(`Error placing order: ${err.message}`);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            checkoutWithRazorpay({
                amount: totalAmount,
                description: `Checkout of ${purchasableItems.length} item(s)`,
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
                            items: purchasableItems.map(item => ({
                                productId: item.productId,
                                productTitle: item.productTitle,
                                price: item.price,
                                imageUrl: item.imageUrl || '',
                                quantity: 1
                            })),
                            totalAmount: totalAmount,
                            status: 'paid',
                            createdAt: new Date().toISOString()
                        });

                        for (const item of purchasableItems) {
                            await deleteDoc(doc(db, "carts", item.id));
                        }

                        setOrderSuccessId(orderRef.id);
                    } catch (err) {
                        console.error("Error creating order from cart:", err);
                        alert(`Payment successful (ID: ${paymentId}), but recording order failed. Please contact support.`);
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

    useEffect(() => {
        const checkCod = async () => {
            if (purchasableItems.length === 0) {
                setCodAvailable(false);
                return;
            }
            try {
                const codList = await Promise.all(purchasableItems.map(async (item) => {
                    const docSnap = await getDoc(doc(db, "products", item.productId));
                    return docSnap.exists() && docSnap.data().codAvailable;
                }));
                setCodAvailable(codList.every(v => v === true));
            } catch (err) {
                console.error("Error checking COD availability for cart:", err);
                setCodAvailable(false);
            }
        };
        checkCod();
    }, [carts]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "carts"),
            where("userId", "==", user.uid)
        );
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setCarts(list);
        });
        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid)
        );
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(list);
        });
        return () => unsub();
    }, [user]);

    const handleRemoveFromCart = async (cartId: string) => {
        if (!window.confirm("Remove this item from your cart?")) return;
        try {
            await deleteDoc(doc(db, "carts", cartId));
        } catch (err) {
            console.error("Error removing from cart", err);
        }
    };

    const handleLogout = () => {
        auth.signOut();
        navigate('/admin/login');
    };

    if (!user) return null;

    return (
        <div className="pt-24 min-h-[100dvh] bg-luxury-cream/10 pb-12">
            <div className="max-w-4xl mx-auto px-6">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif text-charcoal">Welcome, {user.displayName || 'Guest'}</h1>
                        <p className="text-sm text-gold font-medium uppercase tracking-widest mt-1">Aura Member</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-charcoal/60 hover:text-red-500 transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="md:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-luxury-white p-8 rounded-3xl border border-gold/10 shadow-sm"
                        >
                            <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
                                <User className="text-gold" size={20} />
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-charcoal/40 uppercase">Email Address</label>
                                    <p className="font-medium text-charcoal">{user.email}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-charcoal/40 uppercase">Member Since</label>
                                    <p className="font-medium text-charcoal">{new Date(user.metadata.creationTime || '').toLocaleDateString()}</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-luxury-white p-8 rounded-3xl border border-gold/10 shadow-sm"
                            id="carts"
                        >
                            <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
                                <ShoppingCart className="text-gold" size={20} />
                                My Cart
                            </h2>
                            {carts.length === 0 ? (
                                <div className="text-center py-12 px-6 border-2 border-dashed border-gold/10 rounded-2xl">
                                    <p className="text-charcoal/40 italic">“Your cart is waiting for a masterpiece.”</p>
                                    <button
                                        onClick={() => navigate('/collections')}
                                        className="mt-6 btn btn-gold text-xs px-8 py-3 shimmer"
                                    >
                                        Explore Collections
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {carts.map(cart => (
                                            <motion.div
                                                key={cart.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-4 bg-white border border-gold/10 p-4 rounded-2xl group transition-all hover:shadow-md"
                                            >
                                                {cart.imageUrl && (
                                                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gold/5">
                                                        <LazyImage src={cart.imageUrl} alt={cart.productTitle} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-grow">
                                                    <h3 className="font-bold text-charcoal">{cart.productTitle}</h3>
                                                    <p className="text-sm font-medium text-gold">
                                                        {cart.price === 'On Request' ? 'Exclusive Pricing' : `₹${cart.price.toLocaleString()}`}
                                                    </p>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleRemoveFromCart(cart.id)}
                                                    className="p-3 text-red-500/50 hover:text-red-500 rounded-xl transition-all"
                                                    title="Remove from cart"
                                                >
                                                    <Trash2 size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => navigate(`/product/${cart.productId}`)}
                                                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider bg-gold/5 text-gold hover:bg-gold hover:text-white rounded-xl transition-colors"
                                                >
                                                    View
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {purchasableItems.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-charcoal/40 uppercase tracking-wider">Subtotal ({purchasableItems.length} item{purchasableItems.length > 1 ? 's' : ''})</p>
                                                <p className="text-2xl font-serif text-charcoal font-bold">₹{totalAmount.toLocaleString()}</p>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleCartCheckout}
                                                className="w-full sm:w-auto px-8 py-4 gold-gradient text-white font-bold rounded-2xl shadow-xl shadow-gold/20 flex items-center justify-center gap-3 transition-all shimmer relative overflow-hidden cursor-pointer"
                                            >
                                                Checkout with Razorpay
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* My Orders Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-luxury-white p-8 rounded-3xl border border-gold/10 shadow-sm"
                        >
                            <h2 className="text-xl font-serif mb-6 flex items-center gap-2 text-charcoal">
                                <ShoppingBag className="text-gold" size={20} />
                                Order History
                            </h2>
                            {orders.length === 0 ? (
                                <div className="text-center py-12 px-6 border-2 border-dashed border-gold/10 rounded-2xl">
                                    <p className="text-charcoal/40 italic">“You haven't placed any orders yet.”</p>
                                    <button
                                        onClick={() => navigate('/collections')}
                                        className="mt-6 btn btn-gold text-xs px-8 py-3 shimmer"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.map((order) => {
                                        // Calculate expected delivery date (4 days after order date)
                                        const orderDate = new Date(order.createdAt);
                                        const estDeliveryDate = new Date(orderDate);
                                        estDeliveryDate.setDate(orderDate.getDate() + 4);
                                        const formattedEstDate = estDeliveryDate.toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        });

                                        return (
                                            <div key={order.id} className="border border-gold/10 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow text-left">
                                                {/* Order Header info */}
                                                <div className="bg-gold/5 px-6 py-4 flex flex-wrap justify-between items-center gap-2 border-b border-gold/10">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block">Order ID</span>
                                                        <span className="text-xs font-mono font-bold text-charcoal">{order.id}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block">Order Date</span>
                                                        <span className="text-xs font-medium text-charcoal/70">
                                                            {orderDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block">Estimated Delivery</span>
                                                        <span className="text-xs font-bold text-gold">
                                                            {order.status === 'completed' 
                                                                ? 'Delivered' 
                                                                : order.status === 'cancelled' || order.status === 'rejected'
                                                                    ? 'N/A'
                                                                    : formattedEstDate
                                                            }
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-bold text-charcoal/40 uppercase block mb-0.5">Status</span>
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            order.status === 'cod_pending' ? 'bg-amber-100 text-amber-800' :
                                                            order.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'completed' ? 'bg-zinc-100 text-zinc-800' :
                                                            order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-emerald-100 text-emerald-800' // 'paid'
                                                        }`}>
                                                            {order.status === 'cod_pending' ? 'COD Pending' :
                                                             order.status === 'approved' ? 'Approved' :
                                                             order.status === 'shipped' ? 'Shipped' :
                                                             order.status === 'completed' ? 'Completed' :
                                                             order.status === 'rejected' ? 'Rejected' :
                                                             order.status === 'cancelled' ? 'Cancelled' :
                                                             'Paid'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Items List */}
                                                <div className="p-6 divide-y divide-gold/5">
                                                    {order.items?.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                                                            {item.imageUrl && (
                                                                <div className="w-12 h-12 bg-zinc-50 border border-gold/10 rounded-xl overflow-hidden flex-shrink-0">
                                                                    <LazyImage src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                                                </div>
                                                            )}
                                                            <div className="flex-grow">
                                                                <h4 className="text-xs font-bold text-charcoal leading-tight">{item.productTitle}</h4>
                                                                <p className="text-[10px] text-charcoal/50 mt-1">Qty: {item.quantity || 1}</p>
                                                            </div>
                                                            <div className="text-xs font-bold text-gold text-right">
                                                                ₹{(item.price || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Total and Shipping Info */}
                                                <div className="px-6 py-4 bg-zinc-50/50 border-t border-gold/5 flex justify-between items-center text-xs">
                                                    <span className="text-charcoal/50">
                                                        Payment: <span className="font-bold text-charcoal capitalize">{order.paymentMethod === 'cod' ? 'COD' : 'Online'}</span>
                                                    </span>
                                                    <span className="font-bold text-charcoal">
                                                        Total Amount: <span className="text-sm font-serif font-black text-gold ml-1">₹{(order.totalAmount || 0).toLocaleString()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Sidebar / Quick Links */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gold/5 p-6 rounded-3xl border border-gold/10"
                        >
                            <h3 className="font-bold text-gold text-xs uppercase tracking-widest mb-4">Quick Actions</h3>
                            <nav className="space-y-3">
                                <button className="w-full text-left px-4 py-3 bg-white border border-gold/5 rounded-xl text-sm text-charcoal hover:shadow-md transition-all">Track Order</button>
                                <button className="w-full text-left px-4 py-3 bg-white border border-gold/5 rounded-xl text-sm text-charcoal hover:shadow-md transition-all">Shipping Address</button>
                                <button className="w-full text-left px-4 py-3 bg-white border border-gold/5 rounded-xl text-sm text-charcoal hover:shadow-md transition-all">Gift Cards</button>
                            </nav>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-luxury-white p-6 rounded-3xl border border-gold/10 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="text-gold" size={20} />
                                <h3 className="font-bold text-charcoal text-xs uppercase tracking-widest">Main Store</h3>
                            </div>
                            <p className="text-xs text-charcoal/60 leading-relaxed">
                                Shop No. 1, Aura Plaza,<br />
                                Grand Gold Street,<br />
                                Mumbai, Maharashtra
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Shipping Address Modal */}
            <ShippingModal
                isOpen={isShippingOpen}
                onClose={() => {
                    setIsShippingOpen(false);
                    if (orderSuccessId) {
                        setOrderSuccessId(null);
                        // Refresh cart / user views
                    }
                    setIsSubmitting(false);
                }}
                onSubmit={handleShippingSubmit}
                isSubmitting={isSubmitting}
                orderSuccessId={orderSuccessId}
                defaultName={user?.displayName || ''}
                defaultEmail={user?.email || ''}
                codAvailable={codAvailable}
                price={totalAmount}
            />
        </div>
    );
}
