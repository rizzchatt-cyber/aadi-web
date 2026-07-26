import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  Star,
  Search,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Truck,
  ShieldCheck,
  Share2,
  X
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, where, addDoc } from 'firebase/firestore';
import CarouselBanner from '../components/CarouselBanner';
import SearchBar from '../components/SearchBar';
import { getOptimizedImageUrl } from '../utils/imageFormatter';
import DriveImage from '../components/DriveImage';
import { LazyImage } from '../components/LazyImage';
import { useAuth } from '../context/AuthContext';
import ShippingModal, { AddressData } from '../components/ShippingModal';
import { checkoutWithRazorpay } from '../utils/razorpay';

export default function Collections() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ id: 'all', name: 'All', imageUrl: 'https://iili.io/qfNn97R.jpg' }]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Derived category lists
  const allDbCats = categories.filter(c => c.id !== 'all');
  const topLevelCats = categories.filter(c => c.id === 'all' || !c.parentId || c.parentId === "");
  const subCats = allDbCats.filter(c => c.parentId && c.parentId === activeCategory && c.parentId !== "");

  useEffect(() => {
    // Real-time Products
    const unsubProducts = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      (snap) => {
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err: any) => {
        console.error("Products subscription error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Real-time Categories
    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snap) => {
        const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories([{ id: 'all', name: 'All', imageUrl: 'https://iili.io/qfNn97R.jpg' }, ...cats]);
      },
      (err: any) => {
        console.error("Categories subscription error:", err);
        setError(err.message);
      }
    );

    // Real-time Banners
    const unsubBanners = onSnapshot(
      query(collection(db, "banners"), where("position", "==", "collections")),
      (snap) => {
        setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err: any) => {
        console.error("Banners subscription error:", err);
        setError(err.message);
      }
    );

    return () => {
      unsubProducts?.();
      unsubCategories?.();
      unsubBanners?.();
    };
  }, []);

  const handleShopNow = (product: any) => {
    setSelectedProduct(product);
    setIsShippingOpen(true);
  };

  const handleShippingSubmit = async (addressData: AddressData) => {
    if (!selectedProduct) return;
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
          items: [
            {
              productId: selectedProduct.id,
              productTitle: selectedProduct.title,
              price: selectedProduct.price,
              imageUrl: selectedProduct.images?.[0] || '',
              quantity: 1
            }
          ],
          totalAmount: selectedProduct.price,
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
    } else {
      checkoutWithRazorpay({
        amount: selectedProduct.price,
        description: selectedProduct.title,
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
              items: [
                {
                  productId: selectedProduct.id,
                  productTitle: selectedProduct.title,
                  price: selectedProduct.price,
                  imageUrl: selectedProduct.images?.[0] || '',
                  quantity: 1
                }
              ],
              totalAmount: selectedProduct.price,
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

  const filteredProducts = useMemo(() => {
    let result = products;

    // Category Filter
    if (activeCategory !== 'all') {
      if (activeSubCategory) {
        // Filter to specific subcategory
        result = result.filter(p => {
          const cats = p.category_ids || (p.category_id ? [p.category_id] : []);
          return cats.includes(activeSubCategory);
        });
      } else {
        // If the selected category has subcategories, show products from all of them + the parent itself
        const childIds = allDbCats.filter(c => c.parentId === activeCategory).map(c => c.id);
        if (childIds.length > 0) {
          result = result.filter(p => {
            const cats = p.category_ids || (p.category_id ? [p.category_id] : []);
            return cats.includes(activeCategory) || cats.some((id: string) => childIds.includes(id));
          });
        } else {
          result = result.filter(p => {
            const cats = p.category_ids || (p.category_id ? [p.category_id] : []);
            return cats.includes(activeCategory);
          });
        }
      }
    }

    // Search Filter
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      result = result.filter(p => {
        const cats = p.category_ids || (p.category_id ? [p.category_id] : []);
        const matchesCategory = cats.some((id: string) => categories.find(c => c.id === id)?.name.toLowerCase().includes(queryStr));
        return p.title.toLowerCase().includes(queryStr) || matchesCategory;
      });
    }

    // Sort Logic
    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    return result;
  }, [products, activeCategory, activeSubCategory, searchQuery, sortBy, categories, allDbCats]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pt-[72px] min-h-[100dvh] bg-[#F8F9FA] transform-gpu"
    >
      {/* Premium Search Section */}
      <div className="relative z-50 mb-12 px-6 pt-8 transform-gpu">
        <SearchBar
          onSearch={setSearchQuery}
          onFilterChange={() => { }} // Category filtering is handled by the visual selector below
          onSortChange={setSortBy}
          suggestions={filteredProducts}
          categories={categories}
        />
      </div>

      <div className="w-full transform-gpu">
        {/* Banner Carousel */}
        <section className="mt-4 transform-gpu min-h-[200px] md:min-h-[400px]">
          <AnimatePresence mode="wait">
            {banners.length > 0 ? (
              <motion.div
                key="banner-content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl overflow-hidden shadow-lg"
              >
                <CarouselBanner banners={banners} />
              </motion.div>
            ) : (
              <div key="banner-skeleton" className="w-full aspect-[21/9] md:aspect-[3/1] bg-gold/5 rounded-xl animate-pulse flex items-center justify-center">
                <div className="w-20 h-2 bg-gold/10 rounded-full" />
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Visual Category Selector */}
        <section className="border-b border-gold/10 bg-white shadow-sm mb-8 transform-gpu">
          {/* Top-Level Categories */}
          <div className="py-8 md:py-12 px-4">
            <div className="flex gap-4 md:gap-8 overflow-x-auto hide-scrollbar pt-4 pb-4 snap-x snap-mandatory justify-start md:justify-center">
              {topLevelCats.length > 1 ? (
                topLevelCats.map((cat, idx) => {
                  const hasSubs = allDbCats.some(c => c.parentId === cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => { setActiveCategory(cat.id); setActiveSubCategory(null); }}
                      className="flex flex-col items-center gap-4 flex-shrink-0 group snap-center w-24 md:w-32 transform-gpu"
                    >
                      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl p-1 transition-all duration-300 ${activeCategory === cat.id ? 'bg-gold shadow-xl shadow-gold/20 -translate-y-2' : 'bg-transparent hover:bg-gold/10 hover:-translate-y-1'}`}>
                        <div className="w-full h-full rounded-2xl overflow-hidden bg-[#Fdfbf7] border border-gold/10">
                          {cat.imageUrl ? (
                            <LazyImage src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gold/30 group-hover:text-gold/60 transition-colors">
                              <LayoutGrid size={24} />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-center transition-colors flex items-center gap-1 ${activeCategory === cat.id ? 'text-gold' : 'text-charcoal/60 group-hover:text-gold'}`}>
                        {cat.name}
                      </span>
                    </motion.button>
                  );
                })
              ) : (
                [...Array(5)].map((_, i) => (
                  <div key={`cat-skel-${i}`} className="flex flex-col items-center gap-4 flex-shrink-0 w-20 md:w-24 animate-pulse">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gold/5 border border-gold/10" />
                    <div className="w-12 h-2 bg-gold/5 rounded-full" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subcategory Row */}
          <AnimatePresence>
            {subCats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-t border-gold/10"
              >
                <div className="flex gap-3 overflow-x-auto hide-scrollbar px-6 py-4 justify-start md:justify-center">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setActiveSubCategory(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${!activeSubCategory
                      ? 'bg-gold text-white border-gold shadow-md shadow-gold/20'
                      : 'border-gold/20 text-charcoal/50 hover:border-gold/40 hover:text-gold'
                      }`}
                  >
                    All
                  </motion.button>
                  {subCats.map((sub, idx) => (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setActiveSubCategory(sub.id)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${activeSubCategory === sub.id
                        ? 'bg-gold text-white border-gold shadow-md shadow-gold/20'
                        : 'border-gold/20 text-charcoal/50 hover:border-gold/40 hover:text-gold'
                        }`}
                    >
                      {sub.imageUrl && (
                        <LazyImage src={sub.imageUrl} alt={sub.name} className="w-5 h-5 rounded-full object-cover border border-white/30" />
                      )}
                      {sub.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Product Count & Grid */}
        <main className="px-4 py-8 transform-gpu">
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-xl text-gold">
                <LayoutGrid size={20} />
              </div>
              <h2 className="text-xl md:text-2xl font-serif text-charcoal">
                {activeCategory === 'all' ? 'The Aura Collection' : categories.find(c => c.id === activeCategory)?.name}
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/30 bg-gold/5 px-4 py-2 rounded-full border border-gold/5">
              {filteredProducts.length} Piece{filteredProducts.length !== 1 ? 's' : ''} Discovered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence mode="sync">
              {loading ? (
                // Loading Skeletons
                [...Array(8)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gold/5 flex flex-col animate-pulse">
                    <div className="aspect-square bg-gold/5" />
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gold/5 rounded-full w-3/4" />
                      <div className="h-6 bg-gold/5 rounded-full w-1/2" />
                      <div className="h-12 bg-gold/5 rounded-2xl" />
                    </div>
                  </div>
                ))
              ) : (
                filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: (idx % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className="product-card bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gold/10 hover:-translate-y-1.5 hover:scale-[1.01] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col group relative cursor-pointer transform-gpu"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-luxury-white">
                      <DriveImage
                        src={product.images?.[0]}
                        alt={product.title}
                        priority={idx < 4}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                      />

                      {/* Interactive Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.discount > 0 && (
                          <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg">
                            {product.discount}% OFF
                          </div>
                        )}
                        <div className="bg-gold/10 text-gold border border-gold/20 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs w-fit">
                          Free Delivery
                        </div>
                      </div>

                      {/* Share Button overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.share) {
                            navigator.share({
                              title: product.title,
                              url: window.location.origin + `/product/${product.id}`
                            });
                          }
                        }}
                        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-charcoal/40 hover:text-gold hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h3 className="text-charcoal text-xs md:text-sm font-bold font-serif line-clamp-2 leading-tight min-h-[32px] md:min-h-[40px] group-hover:text-gold transition-colors">
                          {product.title}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4">
                          <div className="flex flex-col justify-center">
                            {product.priceOnRequest ? null : (
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm md:text-lg font-serif font-bold text-charcoal">₹{(product.price || 0).toLocaleString()}</span>
                                {product.discount > 0 && (
                                  <span className="text-[8px] md:text-[10px] text-charcoal/20 line-through">₹{Math.round(product.price * (1 + product.discount / 100)).toLocaleString()}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {product.showRating && product.rating > 0 && (
                            <div className="flex items-center gap-1 bg-gold/5 text-gold px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-bold border border-gold/10 w-fit mt-1 md:mt-0">
                              {product.rating} <Star size={8} fill="currentColor" />
                            </div>
                          )}
                        </div>


                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => navigate(`/product/${product.id}`)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-2.5 md:py-3 gold-gradient text-white text-[8px] md:text-[10px] font-bold rounded-xl md:rounded-2xl shadow-lg shadow-gold/10 transition-all flex items-center justify-center gap-1 md:gap-1.5 uppercase tracking-[0.1em] shimmer relative overflow-hidden cursor-pointer"
                          >
                            Details <ChevronRight size={10} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {error && (
              <div className="col-span-full py-16 px-6 bg-red-50 border border-red-100 rounded-[32px] text-center shadow-xl">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="text-red-500" size={32} />
                </div>
                <h3 className="text-red-600 font-serif text-2xl mb-2">Access Issue Detected</h3>
                <p className="text-red-500/70 text-sm max-w-md mx-auto">{error}</p>
                <p className="text-gray-400 text-[10px] mt-6 uppercase tracking-widest font-black">Please check your network or firestore rules</p>
              </div>
            )}

            {filteredProducts.length === 0 && !loading && !error && (
              <div className="col-span-full py-40 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="w-32 h-32 bg-[#FFFDF9] rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-gold/5 border border-gold/10 relative">
                    <div className="absolute inset-0 bg-gold/5 animate-pulse rounded-full" />
                    <Search size={48} className="text-gold relative z-10" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-3xl font-serif text-charcoal mb-4">No Aura Discovered</h3>
                    <p className="text-charcoal/40 text-lg font-light leading-relaxed italic">
                      "Seeking perfection? Try a different fragrance note or collection to find your masterpiece."
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                    className="px-12 py-4 gold-gradient text-white text-xs font-black uppercase tracking-[0.3em] rounded-full shadow-luxury shimmer relative overflow-hidden"
                  >
                    Reset Journey
                  </motion.button>
                </motion.div>
              </div>
            )}
          </div>
        </main>
      </div>
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
        codAvailable={selectedProduct?.codAvailable || false}
      />
    </motion.div>
  );
}
