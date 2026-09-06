import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import Hero from '../components/Hero';
import WhyChooseUs from '../components/WhyChooseUs';
import { motion, AnimatePresence } from 'motion/react';
import SplitText from '../components/SplitText';
import Reveal from '../components/Reveal';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DriveImage from '../components/DriveImage';
import CarouselBanner from '../components/CarouselBanner';
import { where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ShippingModal, { AddressData } from '../components/ShippingModal';
import AttarPerfumeOptionModal from '../components/AttarPerfumeOptionModal';
import { checkoutWithRazorpay } from '../utils/razorpay';
import { isAttarPerfumeProduct } from '../utils/productUtils';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content] = useState({
    heroTagline: "Aesthetic appealing Jewellery, Attar & Perfume for aesthetic moment!",
    brandPromiseTitle: "Built on Trust. Designed with Purity.",
    brandPromiseDesc: "At Aaditya’s Aura, transparency is our foundation. Every piece of Jewellery, every drop of Attar, and every bottle of Perfume is a testament to our commitment to purity and hallmarked quality. We believe in luxury with integrity, ensuring that your trust is as enduring as our legacy."
  });

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppProduct, setWhatsAppProduct] = useState<any>(null);

  useEffect(() => {
    // Fetch Featured Products
    const qProducts = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(3));
    const unsubProducts = onSnapshot(qProducts,
      (snap) => {
        setFeaturedProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err: any) => {
        console.error("Home Products error:", err);
        setError(err.message);
      }
    );

    // Fetch Banners
    const qBanners = query(collection(db, "banners"), where("position", "==", "home"));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Categories
    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProducts?.();
      unsubBanners?.();
      unsubCategories?.();
    };
  }, []);

  const handleShopNow = (product: any) => {
    setSelectedProduct(product);
    setIsShippingOpen(true);
  };

  const handleOpenWhatsAppModal = (prod: any) => {
    if (isAttarPerfumeProduct(prod, categories)) {
      setWhatsAppProduct(prod);
      setIsWhatsAppModalOpen(true);
    } else {
      const priceText = prod.priceOnRequest ? "Exclusive Pricing via WhatsApp" : `₹${(prod.price || 0).toLocaleString()}`;
      const imageUrl = prod.images?.[0] || '';
      const messageText = `Hello! I'm interested in ordering: ${prod.title} (${priceText}). Please provide more details. Image: ${imageUrl}`;
      const url = `https://wa.me/918653535303?text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
    }
  };

  const handleConfirmWhatsAppOption = (type: 'Attar' | 'Perfume', fragranceVariant: string) => {
    setIsWhatsAppModalOpen(false);
    if (!whatsAppProduct) return;
    const priceText = whatsAppProduct.priceOnRequest ? "Exclusive Pricing via WhatsApp" : `₹${(whatsAppProduct.price || 0).toLocaleString()}`;
    const imageUrl = whatsAppProduct.images?.[0] || '';
    const optionStr = fragranceVariant ? `${type} (${fragranceVariant})` : type;
    const messageText = `Hello! I'm interested in ordering: ${whatsAppProduct.title} (${priceText}).\nOption Selected: ${optionStr}\n\nImage: ${imageUrl}\n\nLink: ${window.location.origin}/product/${whatsAppProduct.id}`;
    const url = `https://wa.me/918653535303?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleShippingSubmit = async (addressData: AddressData) => {
    if (!selectedProduct) return;
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
              productId: selectedProduct.id,
              productTitle: selectedProduct.title,
              price: selectedProduct.price,
              imageUrl: selectedProduct.images?.[0] || '',
              quantity: 1,
              productType: productType,
              selectedFragrance: selectedFragrance
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
              productType: productType,
              fragranceOption: selectedFragrance,
              items: [
                {
                  productId: selectedProduct.id,
                  productTitle: selectedProduct.title,
                  price: selectedProduct.price,
                  imageUrl: selectedProduct.images?.[0] || '',
                  quantity: 1,
                  productType: productType,
                  selectedFragrance: selectedFragrance
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-50"
    >
      {/* Primary Banner Section (Now on top of Hero) */}
      {banners.some(b => b.displayMode === 'top') && (
        <section className="w-full bg-zinc-50 mt-16 md:mt-28 pt-4 md:pt-8 pb-8 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="shadow-luxury rounded-[24px] overflow-hidden border border-gold/5">
              <CarouselBanner banners={banners.filter(b => b.displayMode === 'top')} />
            </div>
          </div>
        </section>
      )}

      <Hero
        tagline={content.heroTagline}
        bgBanners={banners.filter(b => b.displayMode === 'bg')}
      />

      {/* Brand Promise Section */}
      <section className="py-16 md:py-32 px-6 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 md:h-32 bg-linear-to-b from-gold/30 to-transparent" />
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-10">
            <SplitText
              text={content.brandPromiseTitle}
              className="text-4xl md:text-7xl font-serif text-charcoal justify-center leading-[1.1] tracking-tight"
            />
          </div>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 1 }}
            className="w-40 h-px bg-gold mx-auto mb-16 shimmer"
          />
          <Reveal delay={1.2} direction="up" distance={30} className="mx-auto">
            <p className="text-xl md:text-3xl text-charcoal/40 leading-relaxed font-light italic max-w-3xl mx-auto font-serif">
              {content.brandPromiseDesc}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Featured Preview Grid (Premium Aesthetic) */}
      <section className="py-16 md:py-32 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 md:mb-24 px-4 gap-6">
          <div className="max-w-xl">
            <Reveal direction="left" distance={20}>
              <p className="text-gold font-bold text-[10px] uppercase tracking-[0.4em] mb-4">Limited Edition</p>
            </Reveal>
            <SplitText
              text="A Glimpse of Our Craftsmanship"
              className="text-4xl md:text-6xl font-serif text-charcoal tracking-tighter"
            />
          </div>
          <motion.button
            onClick={() => navigate('/collections')}
            whileHover={{ x: 10, color: '#D4AF37' }}
            className="text-charcoal/30 text-xs font-bold flex items-center gap-3 border-b border-charcoal/10 pb-2 mb-2 cursor-pointer"
          >
            DISCOVER ALL COLLECTIONS <ChevronRight size={16} />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          <AnimatePresence>
            {error ? (
              <div className="col-span-full py-10 px-6 bg-red-50 border border-red-100 rounded-2xl text-center">
                <p className="text-red-600 font-bold mb-2">Access Issue Detected</p>
                <p className="text-red-500 text-sm">{error}</p>
                <p className="text-gray-500 text-[10px] mt-4 uppercase tracking-widest font-bold">Please Check Firestore Security Rules</p>
              </div>
            ) : featuredProducts.length > 0 ? featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col relative"
              >
                <motion.div
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white rounded-[24px] overflow-hidden border border-gold/5 shadow-premium hover:shadow-luxury hover:-translate-y-2 hover:scale-[1.01] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col h-full cursor-pointer transform-gpu"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    <DriveImage
                      src={product.images?.[0]}
                      alt={product.title}
                      priority={idx === 0}
                      className="w-full h-full object-contain p-4 object-center group-hover:scale-110 transition-transform duration-[2s] ease-[cubic-bezier(0.2,1,0.3,1)]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* Free Delivery Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-gold/10 text-gold border border-gold/20 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-xs w-fit">
                        Free Delivery
                      </div>
                    </div>

                    {/* Three Dots - "three dots" as requested */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Action for sharing or menu
                      }}
                      className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-gold hover:text-white"
                      aria-label="More options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div className="p-6 flex-grow flex flex-col text-center">
                    <h3 className="text-charcoal text-xs md:text-sm font-bold uppercase tracking-widest line-clamp-2 leading-tight mb-4 h-10 group-hover:text-gold transition-colors">
                      {product.title}
                    </h3>
                    <div className="w-8 h-px bg-gold/10 mx-auto mb-6 group-hover:w-16 group-hover:bg-gold transition-all duration-700" />
                    <div className="flex flex-col items-center mt-auto gap-4">
                      <div className="flex flex-col items-center">
                        {product.priceOnRequest ? null : (
                          <span className="text-sm font-black text-gray-900 tracking-tighter">₹{(product.price || 0).toLocaleString()}</span>
                        )}
                      </div>

                      {product.priceOnRequest ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWhatsAppModal(product);
                          }}
                          className="w-full py-2.5 bg-[#25D366] text-white text-[10px] font-bold rounded-xl shadow-md hover:bg-[#128C7E] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-center cursor-pointer"
                          aria-label={`Order ${product.title} on WhatsApp`}
                        >
                          Order Now
                        </button>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShopNow(product);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 py-2.5 gold-gradient text-white text-[10px] font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1 uppercase tracking-wider shimmer relative overflow-hidden cursor-pointer"
                          >
                            Shop Now
                          </motion.button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsAppModal(product);
                            }}
                            className="p-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                            aria-label={`Order ${product.title} on WhatsApp`}
                            title="Order on WhatsApp"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.224-3.826l.37.22c1.497.89 3.212 1.36 4.97 1.361h.005c5.805 0 10.529-4.73 10.533-10.541.002-2.81-1.093-5.45-3.08-7.44C17.09 1.83 14.45 .73 11.65.731c-5.838 0-10.589 4.75-10.593 10.56-.001 1.83.479 3.618 1.386 5.17l.244.417-.98 3.578 3.655-.959z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )) : (
              <div className="col-span-full py-24 text-gray-300 italic text-center w-full font-serif text-2xl">Curating the finest pieces...</div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <WhyChooseUs />
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
        price={selectedProduct?.price || 0}
        availableFragrances={selectedProduct?.fragranceOptions ? (Array.isArray(selectedProduct.fragranceOptions) ? selectedProduct.fragranceOptions : selectedProduct.fragranceOptions.split(',').map((s: string) => s.trim())) : undefined}
        fragranceRequired={isAttarPerfumeProduct(selectedProduct, categories)}
      />
      <AttarPerfumeOptionModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        product={whatsAppProduct}
        onConfirm={handleConfirmWhatsAppOption}
      />
    </motion.div>
  );
}

