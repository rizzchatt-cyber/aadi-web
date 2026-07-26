import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, User, Phone, ChevronRight, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const { signInWithGoogle, user, role } = useAuth();

    // Automatic redirection logic
    useEffect(() => {
        const processRedirect = async () => {
            if (user && role) {
                if (role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (location.pathname !== '/admin/login' && location.pathname !== '/login') {
                    // Only auto-redirect non-admins if they are NOT on a login page
                    const state = location.state as any;
                    if (state?.action === 'add_to_cart' && state?.product) {
                        try {
                            const product = state.product;
                            await addDoc(collection(db, "carts"), {
                                userId: user.uid,
                                userEmail: user.email,
                                productId: product.id,
                                productTitle: product.title,
                                price: product.priceOnRequest ? 'On Request' : product.price,
                                imageUrl: product.images?.[0] || '',
                                status: 'active',
                                createdAt: new Date().toISOString()
                            });
                            alert("Successfully added to cart!");
                        } catch (err) {
                            console.error("Error adding to cart after login:", err);
                        }
                    }

                    const from = state?.from?.pathname || state?.returnTo || "/";
                    navigate(from);
                }
            }
        };
        processRedirect();
    }, [user, role, navigate, location]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignup) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match.");
                }
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const newUser = userCredential.user;
                const isAdminEmail = ['aadityas.aura.web@gmail.com', 'adityas.aura.web@gmail.com', 'aadityasaura@gmail.com', 'laksxhya@gmail.com'].includes(formData.email.trim().toLowerCase());
                const newRole = isAdminEmail ? 'admin' : 'user';

                await setDoc(doc(db, "users", newUser.uid), {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: newRole,
                    createdAt: new Date().toISOString()
                });
            } else {
                // Check if it's the special admin bypass
                const isSpecialAdmin = formData.email.trim().toLowerCase() === 'admin' && formData.password === '1246';
                const finalEmail = isSpecialAdmin ? 'aadityas.aura.web@gmail.com' : formData.email;
                const finalPassword = isSpecialAdmin ? 'admin123' : formData.password;

                await signInWithEmailAndPassword(auth, finalEmail, finalPassword);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center p-6 pt-24 pb-12 transition-colors duration-500">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-luxury-white rounded-[40px] shadow-2xl shadow-charcoal/5 border border-gold/10 overflow-hidden relative z-10"
            >
                {/* Header Bar */}
                <div className="h-1.5 w-full gold-gradient" />

                <div className="p-10 lg:p-12">
                    <div className="text-center mb-10">
                        <motion.div
                            key={isSignup ? 'signup-icon' : 'login-icon'}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 bg-gold/5 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-gold/20"
                        >
                            {isSignup ? <User className="text-gold" size={28} /> : <Lock className="text-gold" size={28} />}
                        </motion.div>
                        <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">
                            {isSignup ? 'Begin Your Journey' : 'Welcome Back'}
                        </h1>
                        <p className="text-xs text-charcoal/40 font-bold uppercase tracking-[0.2em]">
                            {isSignup ? 'Experience Pure Luxury' : 'Enter the Aura of Excellence'}
                        </p>
                    </div>

                    {user && role !== 'admin' && (
                        <div className="mb-8 p-4 bg-gold/5 border border-gold/10 rounded-2xl text-center">
                            <p className="text-xs text-charcoal/60 mb-2">Logged in as <span className="text-gold font-bold">{user.email}</span></p>
                            <button
                                onClick={() => auth.signOut()}
                                className="text-[10px] font-black uppercase tracking-widest text-gold hover:underline"
                            >
                                Logout to Access Admin
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {isSignup && (
                                    <motion.div
                                        key="name-field"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="relative group"
                                    >
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={20} />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-luxury-cream/20 border border-gold/10 rounded-2xl py-4 pl-14 pr-5 text-charcoal focus:outline-none focus:border-gold transition-all"
                                            placeholder="Your Full Name"
                                            required={isSignup}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={20} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-luxury-cream/20 border border-gold/10 rounded-2xl py-4 pl-14 pr-5 text-charcoal focus:outline-none focus:border-gold transition-all"
                                    placeholder="Email Address"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={20} />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-luxury-cream/20 border border-gold/10 rounded-2xl py-4 pl-14 pr-5 text-charcoal focus:outline-none focus:border-gold transition-all"
                                    placeholder="Security Password"
                                    required
                                />
                            </div>

                            <AnimatePresence mode="popLayout">
                                {isSignup && (
                                    <motion.div
                                        key="confirm-password"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="relative group"
                                    >
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gold/30 group-focus-within:text-gold transition-colors" size={20} />
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-luxury-cream/20 border border-gold/10 rounded-2xl py-4 pl-14 pr-5 text-charcoal focus:outline-none focus:border-gold transition-all"
                                            placeholder="Confirm Password"
                                            required={isSignup}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 gold-gradient text-luxury-white font-bold rounded-2xl shadow-xl shadow-gold/20 flex items-center justify-center gap-3 group disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shimmer"
                        >
                            {loading ? (isSignup ? 'Creating Account...' : 'Authenticating...') : (isSignup ? 'Create Account' : 'Access Your Aura')}
                            {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </button>

                        <div className="relative my-8 text-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gold/10"></div></div>
                            <span className="relative px-6 bg-luxury-white text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Or elevate with</span>
                        </div>

                        <button
                            type="button"
                            onClick={signInWithGoogle}
                            className="w-full py-4 border border-gold/20 rounded-2xl flex items-center justify-center gap-3 hover:bg-gold/5 transition-all font-bold text-charcoal text-sm"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="mt-8 pt-8 border-t border-gold/5 text-center">
                            <button
                                type="button"
                                onClick={() => setIsSignup(!isSignup)}
                                className="text-sm text-charcoal/50 hover:text-gold transition-colors"
                            >
                                {isSignup ? "Already have an account? " : "Don't have an account? "}
                                <span className="text-gold font-bold hover:underline">
                                    {isSignup ? "Login Instead" : "Create Master Account"}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Visual Accent */}
                <div className="bg-gold/5 p-6 text-center border-t border-gold/10">
                    <button
                        type="button"
                        onClick={() => { setFormData({ ...formData, email: 'admin', password: '1246' }); setIsSignup(false); }}
                        className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/30 hover:text-gold/60 transition-colors"
                    >
                        Security Override
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
