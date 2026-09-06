import { LazyImage } from '../components/LazyImage';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard,
    ShoppingBag,
    Image as ImageIcon,
    LogOut,
    Save,
    Trash2,
    Plus,
    ChevronRight,
    Search,
    Grid,
    Upload,
    X,
    Filter,
    Edit3,
    ShoppingCart,
    CheckSquare,
    Square,
    Copy,
    Check,
    Bell,
    Clock,
    CreditCard,
    Coins,
    Sparkles
} from 'lucide-react';
import { db, auth } from '../firebase/config';

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    where,
    setDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import DriveImage from '../components/DriveImage';
import HLSVideo from '../components/HLSVideo';
import { checkoutWithRazorpay } from '../utils/razorpay';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const isHLS = (url: string) => url.toLowerCase().includes('.m3u8');

    const formatImageUrl = (url: string, isVideo: boolean = false) => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            let fileId: string | null = null;

            if (urlObj.hostname === 'lh3.googleusercontent.com' && urlObj.pathname.startsWith('/d/')) {
                const raw = urlObj.pathname.replace('/d/', '');
                fileId = raw.split('=')[0];
            }
            else if (urlObj.searchParams.has('id')) {
                fileId = urlObj.searchParams.get('id');
            }
            else if (urlObj.pathname.includes('/file/d/')) {
                const parts = urlObj.pathname.split('/');
                const dIndex = parts.indexOf('d');
                if (dIndex !== -1 && parts.length > dIndex + 1) {
                    fileId = parts[dIndex + 1];
                }
            }

            if (fileId) {
                if (isVideo) {
                    return `https://drive.google.com/uc?export=download&id=${fileId}`;
                }
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
            }
        } catch (e) {
            // Ignore invalid URLs
        }
        return url;
    };

    const { logout, user, role } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);

    // Test Payment States
    const [testAmount, setTestAmount] = useState('1');
    const [testDescription, setTestDescription] = useState('Admin Gateway Test');



    // Data states
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [banners, setBanners] = useState<any[]>([]);
    const [carts, setCarts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({ products: 0, categories: 0, banners: 0, carts: 0, orders: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    // Orders Filtering, Searching, & Notification States
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [orderFilter, setOrderFilter] = useState('all');
    const [notifications, setNotifications] = useState<{ id: string; orderId: string; message: string }[]>([]);
    const prevOrderIdsRef = useRef<string[]>([]);
    const isInitialLoadRef = useRef(true);

    const playChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Pleasant chime synth
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            gain1.gain.setValueAtTime(0.1, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.4);
            
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.12);
            osc2.stop(ctx.currentTime + 0.6);
        } catch (err) {
            console.warn("Audio chime blocked or unsupported:", err);
        }
    };

    const showOrderNotification = (orderId: string, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setNotifications(prev => [...prev, { id, orderId, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 8000);
    };

    const filteredOrders = orders.filter(order => {
        const queryStr = orderSearchQuery.toLowerCase();
        const matchesSearch = 
            (order.id || '').toLowerCase().includes(queryStr) ||
            (order.userName || '').toLowerCase().includes(queryStr) ||
            (order.userEmail || '').toLowerCase().includes(queryStr) ||
            (order.userPhone || '').toLowerCase().includes(queryStr) ||
            (order.paymentId || '').toLowerCase().includes(queryStr);
            
        const matchesFilter = orderFilter === 'all' || (order.status || 'paid') === orderFilter;
        
        return matchesSearch && matchesFilter;
    });

    // UI States
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [bulkUpdateType, setBulkUpdateType] = useState('category');
    const [bulkUpdateValue, setBulkUpdateValue] = useState('');
    const [copyUrlsSuccess, setCopyUrlsSuccess] = useState(false);

    // Form States
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', imageUrl: '', parentId: '' });
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [newBanner, setNewBanner] = useState({ title: '', description: '', position: 'home', imageUrl: '', mediaType: 'image', displayMode: 'top', objectFit: 'cover', mobileObjectFit: 'cover', hideHeroText: false, heroTextColor: 'white', borderRadius: '0', aspectRatio: '21/9', mobileAspectRatio: '16/9' });
    const [editingBanner, setEditingBanner] = useState<any>(null);
    const [productImages, setProductImages] = useState<string[]>([]);
    const [newImgUrl, setNewImgUrl] = useState('');
    const [selectedCategoryIdsForm, setSelectedCategoryIdsForm] = useState<string[]>([]);
    const [announcement, setAnnouncement] = useState({ show: false, text: '', showTimer: false, endDate: '' });

    useEffect(() => {
        return onSnapshot(doc(db, 'settings', 'announcement'), (snap) => {
            if (snap.exists()) setAnnouncement(snap.data() as any);
        });
    }, []);

    const handleSaveAnnouncement = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, 'settings', 'announcement'), {
                ...announcement,
                updatedAt: new Date().toISOString()
            });
            alert('Store announcement updated!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRunTestPayment = () => {
        const amountNum = parseFloat(testAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        checkoutWithRazorpay({
            amount: amountNum,
            description: testDescription || "Admin Gateway Test",
            userName: "Admin Tester",
            userEmail: user?.email || "admin@example.com",
            onSuccess: (paymentId) => {
                alert(`Test Payment Successful! Transaction ID: ${paymentId}`);
            },
            onDismiss: () => {
                alert("Test Payment Dismissed.");
            }
        });
    };

    // Sync productImages when editingProduct changes
    useEffect(() => {
        if (editingProduct) {
            setProductImages(editingProduct.images || []);
            setSelectedCategoryIdsForm(editingProduct.category_ids || (editingProduct.category_id ? [editingProduct.category_id] : []));
        } else {
            setProductImages([]);
            setSelectedCategoryIdsForm([]);
        }
    }, [editingProduct]);

    useEffect(() => {
        if (editingCategory) {
            setNewCategory({
                name: editingCategory.name || '',
                slug: editingCategory.slug || '',
                imageUrl: editingCategory.imageUrl || '',
                parentId: editingCategory.parentId || ''
            });
        } else {
            setNewCategory({ name: '', slug: '', imageUrl: '', parentId: '' });
        }
    }, [editingCategory]);

    // Protect Route
    useEffect(() => {
        if (!user || role !== 'admin') {
            navigate('/login');
        }
    }, [user, role, navigate]);

    // Real-time Listeners
    useEffect(() => {
        if (!user) return;

        const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
            const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(prods);
            setStats(prev => ({ ...prev, products: prods.length }));
        });

        const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
            const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(cats);
            setStats(prev => ({ ...prev, categories: cats.length }));
        });

        const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => {
            const bans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBanners(bans);
            setStats(prev => ({ ...prev, banners: bans.length }));
        });

        const unsubCarts = onSnapshot(query(collection(db, "carts"), orderBy("createdAt", "desc")), (snap) => {
            const cartList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCarts(cartList);
            setStats(prev => ({ ...prev, carts: cartList.length }));
        });

        const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
            const orderList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            
            // Check for new orders to trigger notifications
            if (!isInitialLoadRef.current) {
                const prevIds = prevOrderIdsRef.current;
                const newOrders = orderList.filter(o => !prevIds.includes(o.id));
                if (newOrders.length > 0) {
                    playChime();
                    newOrders.forEach(newOrder => {
                        const itemTitle = newOrder.items?.[0]?.productTitle || 'exquisite piece';
                        const message = `New Order from ${newOrder.userName || 'Guest'} for "${itemTitle}"!`;
                        showOrderNotification(newOrder.id, message);
                    });
                }
            } else {
                isInitialLoadRef.current = false;
            }
            
            prevOrderIdsRef.current = orderList.map(o => o.id);
            setOrders(orderList);
            setStats(prev => ({ ...prev, orders: orderList.length }));
        });

        return () => {
            unsubProducts();
            unsubCategories();
            unsubBanners();
            unsubCarts();
            unsubOrders();
        };
    }, [user]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // --- Product Handlers ---
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            const title = formData.get('title') as string;
            const price = Number(formData.get('price'));
            const discount = Number(formData.get('discount') || 0);
            const category_id = selectedCategoryIdsForm.length > 0 ? selectedCategoryIdsForm[0] : '';
            const category_ids = selectedCategoryIdsForm;
            const description = formData.get('description') as string;
            const gender = formData.get('gender') as string;
            const weight = formData.get('weight') as string;
            const material = formData.get('material') as string;
            const hallmarkInfo = formData.get('hallmarkInfo') as string;
            const deliveryInfo = formData.get('deliveryInfo') as string;
            const rating = Number(formData.get('rating') || 0);
            const reviewCount = Number(formData.get('reviewCount') || 0);
            const showRating = formData.get('showRating') === 'on';
            const priceOnRequest = formData.get('priceOnRequest') === 'on';
            const codAvailable = formData.get('codAvailable') === 'on';
            const hasFragranceOptions = formData.get('hasFragranceOptions') === 'on';
            const rawFragranceOptions = (formData.get('fragranceOptions') as string) || '';
            const fragranceOptions = rawFragranceOptions
                ? rawFragranceOptions.split(',').map((s: string) => s.trim()).filter(Boolean)
                : [];

            const productData = {
                title, price, discount, category_id, category_ids, description,
                gender, weight, material, hallmarkInfo, deliveryInfo,
                rating, reviewCount, showRating, priceOnRequest, codAvailable,
                hasFragranceOptions, fragranceOptions,
                images: productImages.filter(url => url.trim() !== ''),
                updatedAt: new Date().toISOString()
            };

            if (editingProduct?.id) {
                await updateDoc(doc(db, "products", editingProduct.id), productData);
                alert('Product updated!');
            } else {
                await addDoc(collection(db, "products"), {
                    ...productData,
                    createdAt: new Date().toISOString()
                });
                alert('Product published!');
            }

            setEditingProduct(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (p: any) => {
        if (!window.confirm('Delete this product permanently?')) return;
        try {
            await deleteDoc(doc(db, "products", p.id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    // --- Category Handlers ---
    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data: any = {
                name: newCategory.name,
                slug: newCategory.slug,
                imageUrl: newCategory.imageUrl,
                updatedAt: new Date().toISOString()
            };
            if (newCategory.parentId) data.parentId = newCategory.parentId;
            
            if (editingCategory?.id) {
                await updateDoc(doc(db, "categories", editingCategory.id), data);
                alert('Category updated!');
            } else {
                data.createdAt = new Date().toISOString();
                await addDoc(collection(db, "categories"), data);
                alert('Category created!');
            }
            setNewCategory({ name: '', slug: '', imageUrl: '', parentId: '' });
            setEditingCategory(null);
            setIsCategoryModalOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (c: any) => {
        if (!window.confirm(`Delete category "${c.name}"? This will not delete products in this category.`)) return;
        try {
            await deleteDoc(doc(db, "categories", c.id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    // --- Banner Handlers ---
    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const imageUrl = newBanner.imageUrl;

            if (!imageUrl) return alert('Please provide an image URL');

            const bannerData = {
                title: newBanner.title,
                description: newBanner.description,
                position: newBanner.position,
                image_path: imageUrl,
                mediaType: newBanner.mediaType || 'image',
                displayMode: newBanner.displayMode || 'top',
                objectFit: newBanner.objectFit || 'cover',
                mobileObjectFit: newBanner.mobileObjectFit || 'cover',
                hideHeroText: newBanner.hideHeroText || false,
                heroTextColor: newBanner.heroTextColor || 'white',
                borderRadius: newBanner.borderRadius || '0',
                aspectRatio: newBanner.aspectRatio || '21/9',
                mobileAspectRatio: newBanner.mobileAspectRatio || '16/9',
                updatedAt: new Date().toISOString()
            };

            if (editingBanner) {
                await updateDoc(doc(db, "banners", editingBanner.id), bannerData);
                alert('Banner updated!');
            } else {
                await addDoc(collection(db, "banners"), {
                    ...bannerData,
                    createdAt: new Date().toISOString()
                });
                alert('Banner created!');
            }

            setNewBanner({ title: '', description: '', position: 'home', imageUrl: '', mediaType: 'image', displayMode: 'top', objectFit: 'cover', mobileObjectFit: 'cover', hideHeroText: false, heroTextColor: 'white', borderRadius: '0', aspectRatio: '21/9', mobileAspectRatio: '16/9' });
            setEditingBanner(null);
            setIsBannerModalOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditBanner = (b: any) => {
        setEditingBanner(b);
        setNewBanner({
            title: b.title || '',
            description: b.description || '',
            position: b.position || 'home',
            imageUrl: b.image_path || '',
            mediaType: b.mediaType || 'image',
            displayMode: b.displayMode || 'top',
            objectFit: b.objectFit || 'cover',
            mobileObjectFit: b.mobileObjectFit || 'cover',
            hideHeroText: b.hideHeroText || false,
            heroTextColor: b.heroTextColor || 'white',
            borderRadius: b.borderRadius || '0',
            aspectRatio: b.aspectRatio || '21/9',
            mobileAspectRatio: b.mobileAspectRatio || '16/9'
        });
        setIsBannerModalOpen(true);
    };

    const handleDeleteBanner = async (b: any) => {
        if (!window.confirm('Delete this banner?')) return;
        try {
            await deleteDoc(doc(db, "banners", b.id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    // --- Bulk Imports ---
    const handleBulkImportUnisex = async () => {
        if (!window.confirm('Import Unisex collection products?')) return;
        setLoading(true);
        try {
            const driveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`;
            const productsList = [
    {
        title: "Baccarat Rouge 540",
        driveId: "1-LhNr4FrR_FHQ8f1mjwbGBOrynnYv_3L",
        description: "A radiant fragrance inspired by warm amber and airy sweetness. Smooth, elegant, and unforgettable, it leaves a luxurious scent trail that feels both bold and refined.",
        material: "Luxury Inspired Scent"
    },
    {
        title: "Vanilla",
        driveId: "1TZ1Yhq1sQ5sYpVN2Tjj109Es8el7_7DC",
        description: "Soft, creamy, and comforting. This fragrance highlights the natural sweetness of vanilla, creating a warm and inviting scent perfect for everyday elegance.",
        material: "Gourmand"
    },
    {
        title: "Chocolate",
        driveId: "1OtStGr7U8lO8UIRTuxRBzlxvWl1iQJSp",
        description: "Rich and indulgent, Chocolate delivers the deep aroma of dark cocoa with a smooth gourmand sweetness. A bold fragrance that feels warm and deliciously luxurious.",
        material: "Gourmand"
    },
    {
        title: "Coffee",
        driveId: "1OpRF3Brp6GVe4FBxxboZBub0igYNpYo3",
        description: "Inspired by the rich aroma of freshly roasted coffee beans, this scent is deep, warm, and energizing. Perfect for those who love bold and cozy fragrances.",
        material: "Aromatic"
    },
    {
        title: "Sandalwood",
        driveId: "1nyjPcvcup01ZjfSSk0HyfRkNFa25xrjr",
        description: "A timeless woody fragrance built around the calming depth of sandalwood. Smooth, warm, and naturally elegant with a peaceful and grounding character.",
        material: "Woody"
    },
    {
        title: "Tobacco Vanilla",
        driveId: "10QweBWQ-uyQm883gfAUttXYysoYQaYKm",
        description: "A luxurious blend of warm tobacco leaves and smooth vanilla sweetness. Deep, rich, and sophisticated with a slightly smoky warmth.",
        material: "Oriental"
    },
    {
        title: "Lost Cherry",
        driveId: null, // No Drive image provided — update manually from admin dashboard
        description: "A vibrant fragrance bursting with sweet cherry notes balanced with a smooth warm base. Playful, bold, and irresistibly captivating.",
        material: "Fruity"
    }
] ;

            let attarPerfumeId = categories.find(c => {
                const n = (c.name || '').toLowerCase().trim();
                return (n === 'attar, perfume' || n === 'attar perfume') && (!c.parentId);
            })?.id;
            if (!attarPerfumeId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Attar, Perfume', slug: 'attar-perfume', createdAt: new Date().toISOString() });
                attarPerfumeId = ref.id;
            }

            let unisexId = categories.find(c => c.name.toLowerCase().trim() === 'unisex' && c.parentId === attarPerfumeId)?.id;
            if (!unisexId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Unisex', slug: 'unisex', parentId: attarPerfumeId, createdAt: new Date().toISOString() });
                unisexId = ref.id;
            }

            for (const prod of productsList) {
                const imageUrl = prod.driveId ? driveUrl(prod.driveId) : '';
                await addDoc(collection(db, 'products'), {
                    title: prod.title,
                    description: prod.description,
                    price: 0,
                    priceOnRequest: true,
                    category_id: unisexId,
                    images: imageUrl ? [imageUrl] : [],
                    discount: 0,
                    rating: 0,
                    reviewCount: 0,
                    showRating: false,
                    gender: 'unisex',
                    weight: '',
                    material: prod.material || 'Premium Scent',
                    hallmarkInfo: '',
                    deliveryInfo: 'Free delivery available',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            alert('Import complete!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImportAttars = async () => {
        if (!window.confirm('Import Traditional Attars?')) return;
        setLoading(true);
        try {
            const driveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`;
            const productsList = [
    {
        title: "Mitti Attar",
        driveId: "1aTARhvQSwppIbNhryhD58BJb9RCsRUGv",
        description: "Mitti Attar captures the magical aroma of the first rain touching dry earth. This traditional fragrance brings the nostalgic scent of wet soil, creating a calm and grounding experience. Soft, earthy, and natural, Mitti Attar is perfect for those who love the pure essence of nature."
    },
    {
        title: "Rain Drop Mitti Attar",
        driveId: "17dwyI0wKi5b82M-3JOS_nQ9_CYD2wkgZ",
        description: "Rain Drop Mitti Attar blends the soothing scent of fresh rain with the rich aroma of earth. It creates a refreshing fragrance that feels like standing outside during a gentle monsoon shower. Light, clean, and comforting, this attar is perfect for daily wear."
    },
    {
        title: "Dark Mitti Attar",
        driveId: "1Cjzr1KnewStnGDBNZ4H2_JUxJnpxsyk_",
        description: "Dark Mitti Attar is a deeper and richer version of the classic earthy fragrance. With intense soil notes and a warm natural base, it gives a bold and long-lasting aroma inspired by deep wet earth after heavy rain."
    },
    {
        title: "Kesar Attar",
        driveId: "13HL23sIjClmQv1ulC9oKqmk2n42Z7LV3",
        description: "Kesar Attar is a luxurious fragrance inspired by pure saffron. Warm, rich, and slightly sweet, this attar carries the royal essence of one of the world's most precious spices. Perfect for special occasions and elegant evenings."
    },
    {
        title: "Kesar Chandan Attar",
        driveId: "1Hpkk8gEswx7tDf7P5zhfZeETii6AC64X",
        description: "Kesar Chandan Attar beautifully blends the richness of saffron with the calming warmth of sandalwood. The result is a smooth, royal fragrance that feels both spiritual and luxurious. Ideal for traditional gatherings and festive moments."
    },
    {
        title: "Royal Saffron Attar",
        driveId: "1Mk3PncMPe2En4S2ItFCFf7EQd00vGSre",
        description: "Royal Saffron Attar is a bold and majestic fragrance crafted from the essence of saffron. With its deep warm notes and luxurious aroma, it reflects elegance and richness, making it perfect for those who appreciate royal-style perfumes."
    },
    {
        title: "Chandan Attar",
        driveId: "1XF2tf26Z9tadJrIokCbxMSSjcJ1Oy3Il",
        description: "Chandan Attar is a timeless fragrance made from the soothing aroma of sandalwood. Known for its calming and spiritual character, this attar provides a soft, woody scent that feels peaceful and refreshing throughout the day."
    },
    {
        title: "Kasturi Attar",
        driveId: "19ojj2P5GeTvEuN3KGs5twcGqXYluM1rL",
        description: "Kasturi Attar carries the deep, mysterious aroma inspired by traditional musk fragrances. Warm, sensual, and rich, this attar offers a powerful scent that leaves a strong and unforgettable impression."
    },
    {
        title: "Kewda Attar",
        driveId: "1evBumDtfjE9E7VKYrsTDp0C85HlFRn__",
        description: "Kewda Attar is a fresh floral fragrance derived from the delicate aroma of kewda flowers. Light, sweet, and refreshing, it brings a natural floral elegance that is perfect for everyday wear."
    }
] ;

            let attarPerfumeId = categories.find(c => {
                const n = (c.name || '').toLowerCase().trim();
                return (n === 'attar, perfume' || n === 'attar perfume') && (!c.parentId);
            })?.id;
            if (!attarPerfumeId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Attar, Perfume', slug: 'attar-perfume', createdAt: new Date().toISOString() });
                attarPerfumeId = ref.id;
            }

            let traditionalId = categories.find(c => c.name.toLowerCase().trim() === 'traditional' && c.parentId === attarPerfumeId)?.id;
            if (!traditionalId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Traditional', slug: 'traditional', parentId: attarPerfumeId, createdAt: new Date().toISOString() });
                traditionalId = ref.id;
            }

            for (const prod of productsList) {
                await addDoc(collection(db, 'products'), {
                    title: prod.title,
                    description: prod.description,
                    price: 0,
                    priceOnRequest: true,
                    category_id: traditionalId,
                    images: [driveUrl(prod.driveId)],
                    discount: 0,
                    rating: 0,
                    reviewCount: 0,
                    showRating: false,
                    gender: 'unisex',
                    weight: '',
                    material: 'Pure Attar',
                    hallmarkInfo: '',
                    deliveryInfo: 'Free delivery available',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            alert('Import complete!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImportMensCollection = async () => {
        if (!window.confirm("Import Men's Collection?")) return;
        setLoading(true);
        try {
            const driveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`;
            
            // 17 items inside Men's collection
            const mensCollection = [
                { title: "Inspired by Bleu de Chanel — Office Wear", desc: "A refined and confident fragrance for the modern professional. Fresh citrus and woody notes create a clean, sophisticated scent that leaves a lasting impression in meetings, offices, and formal environments.", category: "Office Wear", img: "1KnEXfvaFNxA8qCarFoH0uf3FCEdBvTRy" },
                { title: "Inspired by Prada L'Homme — Office Wear", desc: "A smooth and elegant fragrance with powdery and fresh notes. Perfect for office environments where subtle sophistication and class matter.", category: "Office Wear", img: "1LAHf-7FGrHW2bzZvvGhcaOtMAawTWOZQ" },
                { title: "Inspired by Armani Code — Office Wear", desc: "A balanced blend of citrus, spice, and warm woods. Ideal for professionals who want a confident yet smooth fragrance during long workdays.", category: "Office Wear", img: "1hC0NdTKtkUq3n_xGpqT4UHwRTmIKABzo" },
                { title: "Inspired by Weekend by Burberry — Office & Casual Wear", desc: "A relaxed fresh fragrance with soft citrus and woody notes. Perfect for workdays that transition into casual evenings.", category: "Office Wear", img: "1sFyZnX4nScXPm0T1V1DrsnKrQvVQbsZv" },
                { title: "Inspired by Jaguar Classic — Office Wear", desc: "A clean masculine fragrance with a bold dark character. Perfect for office wear with a powerful and stylish professional vibe.", category: "Office Wear", img: "14CCcjNoQb_kiOWIUYcsRbTUZLeUoELPb" },
                { title: "Inspired by Azzaro Chrome — Office Wear", desc: "A refreshing aquatic fragrance that feels crisp and energizing. Great for office environments and daytime professional settings.", category: "Office Wear", img: "1WoSjgNdNJJtHD0llcv223Th7f7kcfA57" },
                { title: "Inspired by Mr. Burberry — Office Wear", desc: "A classy and modern fragrance blending citrus freshness with woody depth. Ideal for professionals who want a refined signature scent.", category: "Office Wear", img: "1gNZhjs97BN0Ypn6hLwwY8uQ1Olmf5P5j" },
                { title: "Inspired by CK One — Fresh Daily Wear", desc: "A light and refreshing fragrance perfect for everyday use. Citrus freshness keeps you feeling clean and energetic all day long.", category: "Daily Wear", img: "1v3iM8DR-ELfJP9D-GK8MHplCtXfb4ZVj" },
                { title: "Aura Splash — Fresh Casual Daily Wear", desc: "A bright and uplifting fragrance designed for everyday freshness. Perfect for casual outings, college, and daily routines.", category: "Daily Wear", img: "14533hhVSDZg911lHdjKuy7t77IJUFBvh" },
                { title: "Aura Astron — Light Fresh Daily Wear", desc: "A smooth and refreshing scent designed for comfortable daily wear with a modern fresh vibe that lasts all day.", category: "Daily Wear", img: "1NCkrlH2skS2UJAtn8gXG73ZCKC3Vbx7D" },
                { title: "Aura Re Energy — Energetic Fresh Daily Wear", desc: "A lively and refreshing fragrance that boosts your mood and keeps you feeling energized throughout the day.", category: "Daily Wear", img: "1TJBvOJsaUtuEA90CpsQjQQbyxxMywJLe" },
                { title: "Aura Lemon Grass — Natural Fresh Daily Wear", desc: "A crisp herbal fragrance with bright citrus and lemon grass notes. Perfect for those who enjoy clean, natural freshness.", category: "Daily Wear", img: "1ns48zxfY_5YkP-CQqvO65HH6DkV12XEu" },
                { title: "Inspired by Acqua di Gio — Aquatic Daily Wear", desc: "A fresh aquatic fragrance with citrus and marine notes. Ideal for warm days and everyday freshness.", category: "Daily Wear", img: "1xeu6dqJOTfN46_x27LxH91ex5lMmWMR9" },
                { title: "Inspired by Cool Water Intense — Daily Wear", desc: "A bold aquatic fragrance with deep, fresh energy. Perfect for daily wear and warm-weather adventures.", category: "Daily Wear", img: "1yz6uOk4d8sEa8_YJCSmj60TIvgwEcYl4" },
                { title: "Cool Khus — Ultra Fresh Gym Wear", desc: "A cooling earthy fragrance with traditional khus freshness. Perfect after workouts or for hot summer days outdoors.", category: "Gym Wear", img: "1aOMEGGPVjH-L6HCdYAiDAEWUZPy7td6y" },
                { title: "Royal Khamis — Fresh Herbal Gym Wear", desc: "A refreshing herbal fragrance designed to keep you feeling clean and energized after intense physical activity.", category: "Gym Wear", img: "1NS_fs8o5zGQVwPbWenuoNWq28r99qngF" },
                { title: "Santruni — Citrus Fresh Gym Wear", desc: "A vibrant citrus fragrance that feels bright, energetic, and refreshing after workouts or outdoor activities.", category: "Gym Wear", img: "1uKZmwjhwfY6vG4o0u92jWCnHsm1kbsN1" }
            ];

            let attarPerfumeId = categories.find(c => {
                const n = (c.name || '').toLowerCase().trim();
                return (n === 'attar, perfume' || n === 'attar perfume') && (!c.parentId);
            })?.id;
            if (!attarPerfumeId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Attar, Perfume', slug: 'attar-perfume', createdAt: new Date().toISOString() });
                attarPerfumeId = ref.id;
            }

            let mensCollectionId = categories.find(c => c.name.toLowerCase().trim() === "men's collection" && c.parentId === attarPerfumeId)?.id;
            if (!mensCollectionId) {
                const ref = await addDoc(collection(db, 'categories'), { name: "Men's Collection", slug: 'mens-collection', parentId: attarPerfumeId, createdAt: new Date().toISOString() });
                mensCollectionId = ref.id;
            }

            for (const item of mensCollection) {
                let subSubId = categories.find(c => c.name.toLowerCase().trim() === item.category.toLowerCase().trim() && c.parentId === mensCollectionId)?.id;
                if (!subSubId) {
                    const ref = await addDoc(collection(db, 'categories'), { name: item.category, slug: item.category.toLowerCase().replace(/ /g, '-'), parentId: mensCollectionId, createdAt: new Date().toISOString() });
                    subSubId = ref.id;
                }

                await addDoc(collection(db, "products"), {
                    title: item.title,
                    description: item.desc,
                    price: 0,
                    priceOnRequest: true,
                    category_id: subSubId,
                    images: [driveUrl(item.img)],
                    discount: 0,
                    rating: 0,
                    reviewCount: 0,
                    showRating: false,
                    gender: 'men',
                    weight: '100ml',
                    material: 'Premium Fragrance',
                    hallmarkInfo: '',
                    deliveryInfo: 'Free delivery available',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            alert('Import complete!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImportNewUploads = async () => {
        if (!window.confirm("Import products from Uploads?")) return;
        setLoading(true);
        try {
            alert("Please run bulk_import_uploads.mjs via CLI to import uploads products!");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImportRings = async () => {
        if (!window.confirm("Import Rings collection?")) return;
        setLoading(true);
        try {
            const driveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`;
            const productsList = [
    { title: "Solitaire Radiance Gold Band", driveId: "12k1mGJcbl_94uMNYXiVkCbV994FZGIxy" },
    { title: "Elegance Oval Sparkle Gold Ring", driveId: "19jYZSy3F-7EAkqiBu0JU_ETnCrf-qmvj" },
    { title: "Majestic Solitaire Gold Ring", driveId: "1X-f9ONYeMXlI5hOZfmJ9VP_pm9dSljdM" },
    { title: "Vintage Brilliance Gold Ring", driveId: "1pV14ruG1ZE97Ckaq3pSVDdn52YvqOj1H" },
    { title: "Classic Halo Gold Ring", driveId: "1sj_lPw6MlIL_QuLrUcUfaKUFVy3tbhe4" },
    { title: "Luminous Gemstone Gold Ring", driveId: "1wN46OIqrCoqbc_tnf-avov6E_pmbeX6s" }
] ;

            let ringsCatId = categories.find(c => {
                const n = (c.name || '').toLowerCase().trim();
                return n === 'rings' || n === 'gold rings';
            })?.id;

            if (!ringsCatId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Rings', slug: 'rings', createdAt: new Date().toISOString() });
                ringsCatId = ref.id;
            }

            for (const prod of productsList) {
                await addDoc(collection(db, 'products'), {
                    title: prod.title,
                    description: `A meticulously crafted gold ring designed for timeless elegance.`,
                    price: 0,
                    priceOnRequest: true,
                    category_id: ringsCatId,
                    images: [driveUrl(prod.driveId)],
                    discount: 0,
                    rating: 0,
                    reviewCount: 0,
                    showRating: false,
                    gender: 'unisex',
                    weight: 'Standard',
                    material: 'Gold',
                    hallmarkInfo: 'Hallmarked 916',
                    deliveryInfo: 'Free delivery available',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            alert('Import complete!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImportNewChains = async () => {
        if (!window.confirm("Add all 10 chains?")) return;
        setLoading(true);
        try {
            const driveUrl = (id: string) => `https://lh3.googleusercontent.com/d/${id}=w1000`;
            const newChains = [
                { title: "Heavy Textured Bismarck Chain", driveId: "1EZ_qLJWODUiHx9F7aPW7wvnIOmPnjNtR", description: "A substantial, multi-strand gold chain with a complex, textured pattern and exquisite detailing. A bold and luxurious piece." },
                { title: "Woven Mesh Chain with Filigree", driveId: "1DuwoH-SBg8SXtIooaMXRbxdj4xZvCQAd", description: "A thick, woven gold mesh chain punctuated by decorative, barrel-shaped filigree stations. Classic and intricate." },
                { title: "Classic Gold Rope Chain", driveId: "1GQdIjgzHEsEZpTufTN9civ6o8EECMluX", description: "A traditional gold rope chain with a classic twisted, braided texture. A versatile staple for any collection." },
                { title: "Trio of Rope Chains", driveId: "1Zch2vNLdYKiDmwyUXGQFPw0hMtgPjyNx", description: "Three classic gold rope chains of varying lengths, highlighting their characteristic thick, spiraling design." },
                { title: "Tiered Gold Bead Chain", driveId: "1mD_v08eCRZor_aDPgdmIn1G4xnfktc4g", description: "A highly ornate, tiered chain featuring rows of small gold beads arranged cylindrically, separated by textured cylindrical links." },
                { title: "Double Woven Gold Chains", driveId: "1PMDj9Affly_BBuOGJAso7UuSCuwERRq9", description: "A pair of bold gold chains showcasing a thick woven mesh style alongside a slightly more compact braided design." },
                { title: "Spiraling Gold Rope Chain", driveId: "11KaKP2ijYWbqFynoki1HSjnjlwpCspaI", description: "A beautifully crafted medium-thickness gold rope chain highlighting its spiraling, textured links and solid profile." },
                { title: "Textured Wheat Mesh Chain", driveId: "1G6HFfGUGFbDxNefui8In5M8fXU2KHB0z", description: "A very thick gold chain with a detailed, scaly surface texture, featuring smooth gold cylindrical sleeves spaced along its length." },
                { title: "Multi-Strand Segmented Chain", driveId: "1KqdJTW4AsFH2R178BlYgG4f1WavzMZQw", description: "A heavy, wide gold chain featuring intricate locking segments that create a unique, textured, multi-strand look." },
                { title: "Byzantine Filigree Box Chain", driveId: "1EXuQigDXq0DKdzPc4lrAsDCkqeqTQB3n", description: "A unique and highly ornate chain with boxy links, meticulously crafted with filigree-textured designs in an architectural style." }
            ];

            let chainsCatId = categories.find(c => c.name.toLowerCase().trim() === 'chains' && !c.parentId)?.id;
            if (!chainsCatId) {
                const ref = await addDoc(collection(db, 'categories'), { name: 'Chains', slug: 'chains', createdAt: new Date().toISOString() });
                chainsCatId = ref.id;
            }

            for (const prod of newChains) {
                await addDoc(collection(db, 'products'), {
                    title: prod.title,
                    description: prod.description,
                    price: 0,
                    priceOnRequest: true,
                    category_id: chainsCatId,
                    images: [driveUrl(prod.driveId)],
                    discount: 0,
                    rating: 0,
                    reviewCount: 0,
                    showRating: false,
                    gender: 'unisex',
                    weight: 'Standard',
                    material: 'Gold',
                    hallmarkInfo: 'Hallmarked 916',
                    deliveryInfo: 'Free delivery available',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            alert('Import complete!');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAttarCollection = async () => {
        if (!window.confirm("Delete all products in Traditional Attars?")) return;
        setLoading(true);
        try {
            const attarPerfumeId = categories.find(c => c.name.toLowerCase().trim().includes('attar'))?.id;
            const subId = categories.find(c => c.name.toLowerCase().trim() === 'traditional' && c.parentId === attarPerfumeId)?.id;
            if (!subId) return alert("Traditional category not found");

            const q = query(collection(db, "products"), where("category_id", "==", subId));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
                await deleteDoc(doc(db, "products", d.id));
            }
            alert('Deleted ' + snap.size + ' products.');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnisexCollection = async () => {
        if (!window.confirm("Delete all products in Unisex?")) return;
        setLoading(true);
        try {
            const attarPerfumeId = categories.find(c => c.name.toLowerCase().trim().includes('attar'))?.id;
            const subId = categories.find(c => c.name.toLowerCase().trim() === 'unisex' && c.parentId === attarPerfumeId)?.id;
            if (!subId) return alert("Unisex category not found");

            const q = query(collection(db, "products"), where("category_id", "==", subId));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
                await deleteDoc(doc(db, "products", d.id));
            }
            alert('Deleted ' + snap.size + ' products.');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMensCollection = async () => {
        if (!window.confirm("Delete Men's Collection products?")) return;
        setLoading(true);
        try {
            const attarPerfumeId = categories.find(c => c.name.toLowerCase().trim().includes('attar'))?.id;
            const mensCollectionId = categories.find(c => c.name.toLowerCase().trim() === "men's collection" && c.parentId === attarPerfumeId)?.id;
            if (!mensCollectionId) return alert("Men's Collection not found");

            const subSubIds = categories.filter(c => c.parentId === mensCollectionId).map(c => c.id);
            const allTargetIds = [mensCollectionId, ...subSubIds];

            let count = 0;
            for (const targetId of allTargetIds) {
                const q = query(collection(db, "products"), where("category_id", "==", targetId));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await deleteDoc(doc(db, "products", d.id));
                    count++;
                }
            }
            alert('Deleted ' + count + ' products.');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpdate = async () => {
        if (selectedProductIds.length === 0) return;
        setLoading(true);
        try {
            const updates: any = {};
            if (bulkUpdateType === 'category') {
                updates.category_id = bulkUpdateValue;
            } else if (bulkUpdateType === 'price') {
                updates.price = Number(bulkUpdateValue);
            } else if (bulkUpdateType === 'weight') {
                updates.weight = bulkUpdateValue;
            } else if (bulkUpdateType === 'discount') {
                updates.discount = Number(bulkUpdateValue);
            } else if (bulkUpdateType === 'material') {
                updates.material = bulkUpdateValue;
            } else if (bulkUpdateType === 'priceOnRequest') {
                updates.priceOnRequest = bulkUpdateValue === 'true';
            }

            for (const id of selectedProductIds) {
                await updateDoc(doc(db, "products", id), {
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
            }
            alert('Updated ' + selectedProductIds.length + ' products!');
            setSelectedProductIds([]);
            setShowBulkUpdateModal(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyImageUrls = () => {
        if (selectedProductIds.length === 0) return;
        const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
        const urls = selectedProducts.map(p => p.images?.[0] || '').filter(url => url !== '').join('\n');
        navigator.clipboard.writeText(urls)
            .then(() => {
                setCopyUrlsSuccess(true);
                setTimeout(() => setCopyUrlsSuccess(false), 2000);
            })
            .catch(err => alert("Copy failed: " + err));
    };

    const handleBulkDelete = async () => {
        if (selectedProductIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedProductIds.length} selected products permanently?`)) return;
        setLoading(true);
        try {
            for (const id of selectedProductIds) {
                await deleteDoc(doc(db, "products", id));
            }
            alert('Deleted ' + selectedProductIds.length + ' products!');
            setSelectedProductIds([]);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleProductSelection = (id: string) => {
        if (selectedProductIds.includes(id)) {
            setSelectedProductIds(selectedProductIds.filter(x => x !== id));
        } else {
            setSelectedProductIds([...selectedProductIds, id]);
        }
    };

    const toggleAllProductsSelection = () => {
        if (selectedProductIds.length === filteredProducts.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(filteredProducts.map(p => p.id));
        }
    };

    // Filtered Products
    const filteredProducts = products.filter(p => {
        const queryStr = searchQuery.toLowerCase().trim();
        return (
            (p.title || '').toLowerCase().includes(queryStr) ||
            (p.description || '').toLowerCase().includes(queryStr) ||
            (p.material || '').toLowerCase().includes(queryStr)
        );
    });

    return (
        <div className="min-h-screen bg-[#faf9f6] flex flex-col lg:flex-row font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-80 bg-charcoal text-white p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gold/10 shrink-0">
                <div>
                    {/* Brand Header */}
                    <div className="flex items-center gap-4 mb-10 pb-8 border-b border-white/10 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 bg-gold-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-gold/25">
                            <span className="font-serif font-bold text-xl text-white">A</span>
                        </div>
                        <div>
                            <h2 className="font-serif text-lg tracking-wider font-bold">AADITYA’S AURA</h2>
                            <p className="text-[9px] uppercase tracking-widest text-gold font-bold">Admin Console</p>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-grow">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { id: 'products', label: 'Products', icon: ShoppingBag },
                            { id: 'categories', label: 'Categories', icon: Grid },
                            { id: 'banners', label: 'Banners', icon: ImageIcon },
                            { id: 'carts', label: 'Carts', icon: ShoppingCart },
                            { id: 'orders', label: 'Orders & Payments', icon: CreditCard },
                            { id: 'settings', label: 'Store Settings', icon: Bell },
                            { id: 'testPayment', label: 'Payment Test', icon: Coins },
                        ].map(item => (
                            <motion.button
                                key={item.id}
                                whileHover={{ x: 4, backgroundColor: 'rgba(191, 149, 63, 0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setActiveTab(item.id); setSelectedProductIds([]); }}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest ${
                                    activeTab === item.id ? 'gold-gradient text-white shadow-xl shadow-gold/10' : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </motion.button>
                        ))}
                    </nav>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 hidden lg:block">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest">
                        <LogOut size={18} />
                        <span>Exit Console</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow p-6 md:p-12 pb-24 lg:pb-12 max-w-[1600px] overflow-y-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-serif mb-1 md:mb-2 text-charcoal">
                            {activeTab === 'dashboard' && 'Portfolio Overview'}
                            {activeTab === 'products' && 'Product Master'}
                            {activeTab === 'categories' && 'Global Categories'}
                            {activeTab === 'banners' && 'Visual Banners'}
                            {activeTab === 'carts' && 'Active Shopping Carts'}
                            {activeTab === 'orders' && 'Orders & Payments'}
                            {activeTab === 'settings' && 'Store Control Center'}
                            {activeTab === 'testPayment' && 'Gateway Test Tool'}
                        </h1>
                        <p className="text-charcoal/30 text-xs md:text-sm font-light italic">“Powering the Aaditya Aura Experience”</p>
                    </div>

                    {/* Quick Action Button */}
                    <div className="flex gap-4">
                        {activeTab === 'products' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setEditingProduct({ title: '', price: 0, images: [], category_ids: [], showRating: true, codAvailable: false })}
                                className="px-6 py-4 bg-charcoal text-white font-bold rounded-2xl text-xs flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-charcoal/10"
                            >
                                <Plus size={16} />
                                Add Piece
                            </motion.button>
                        )}
                        {activeTab === 'categories' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-6 py-4 bg-charcoal text-white font-bold rounded-2xl text-xs flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-charcoal/10"
                            >
                                <Plus size={16} />
                                Add Category
                            </motion.button>
                        )}
                        {activeTab === 'banners' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsBannerModalOpen(true)}
                                className="px-6 py-4 bg-charcoal text-white font-bold rounded-2xl text-xs flex items-center gap-2 uppercase tracking-widest shadow-xl shadow-charcoal/10"
                            >
                                <Plus size={16} />
                                Add Banner
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Tab Views */}
                <div className="space-y-8">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                                <div className="bg-white border border-gold/10 p-6 rounded-[24px] group hover:border-gold/30 transition-all shadow-sm">
                                    <ShoppingBag className="text-gold mb-4" size={28} />
                                    <h3 className="text-3xl font-serif mb-1 text-charcoal">{stats.products}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Live Products</p>
                                </div>
                                <div className="bg-white border border-gold/10 p-6 rounded-[24px] group hover:border-gold/30 transition-all shadow-sm">
                                    <Grid className="text-gold mb-4" size={28} />
                                    <h3 className="text-3xl font-serif mb-1 text-charcoal">{stats.categories}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Categories</p>
                                </div>
                                <div className="bg-white border border-gold/10 p-6 rounded-[24px] group hover:border-gold/30 transition-all shadow-sm">
                                    <CreditCard className="text-gold mb-4" size={28} />
                                    <h3 className="text-3xl font-serif mb-1 text-charcoal">{stats.orders}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Orders & Payments</p>
                                </div>
                                <div className="bg-white border border-gold/10 p-6 rounded-[24px] group hover:border-gold/30 transition-all shadow-sm">
                                    <ShoppingCart className="text-gold mb-4" size={28} />
                                    <h3 className="text-3xl font-serif mb-1 text-charcoal">{stats.carts}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Active Carts</p>
                                </div>
                                <div className="bg-white border border-gold/10 p-6 rounded-[24px] group hover:border-gold/30 transition-all shadow-sm">
                                    <ImageIcon className="text-gold mb-4" size={28} />
                                    <h3 className="text-3xl font-serif mb-1 text-charcoal">{stats.banners}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Visual Banners</p>
                                </div>
                            </div>

                            {/* Seeding Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {/* Attars Seeding */}
                                <div className="bg-white border border-gold/10 p-8 rounded-[32px] shadow-sm">
                                    <h3 className="font-serif text-xl mb-2 text-charcoal">Traditional Attars</h3>
                                    <p className="text-xs text-charcoal/40 mb-6 leading-relaxed">Import 9 traditional earth-based Mitti & Saffron attars with pre-configured images and description lists.</p>
                                    <div className="flex gap-4">
                                        <button onClick={handleBulkImportAttars} disabled={loading} className="px-5 py-3 bg-gold text-white font-bold rounded-xl text-xs hover:bg-gold/90 transition-colors disabled:opacity-50">Bulk Add</button>
                                        <button onClick={handleDeleteAttarCollection} disabled={loading} className="px-5 py-3 border border-red-200 text-red-500 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors disabled:opacity-50">Clear All</button>
                                    </div>
                                </div>

                                {/* Unisex Perfumes Seeding */}
                                <div className="bg-white border border-gold/10 p-8 rounded-[32px] shadow-sm">
                                    <h3 className="font-serif text-xl mb-2 text-charcoal">Unisex Perfumes</h3>
                                    <p className="text-xs text-charcoal/40 mb-6 leading-relaxed">Import 7 premium unisex collection perfumes (Baccarat Rouge 540, Sandalwood, Tobacco Vanilla, Vanilla, etc.).</p>
                                    <div className="flex gap-4">
                                        <button onClick={handleBulkImportUnisex} disabled={loading} className="px-5 py-3 bg-gold text-white font-bold rounded-xl text-xs hover:bg-gold/90 transition-colors disabled:opacity-50">Bulk Add</button>
                                        <button onClick={handleDeleteUnisexCollection} disabled={loading} className="px-5 py-3 border border-red-200 text-red-500 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors disabled:opacity-50">Clear All</button>
                                    </div>
                                </div>

                                {/* Men's collection Seeding */}
                                <div className="bg-white border border-gold/10 p-8 rounded-[32px] shadow-sm">
                                    <h3 className="font-serif text-xl mb-2 text-charcoal">Men's Fragrances</h3>
                                    <p className="text-xs text-charcoal/40 mb-6 leading-relaxed">Import 17 signature inspired men's fragrances separated into Office Wear, Gym Wear, and Daily Wear.</p>
                                    <div className="flex gap-4">
                                        <button onClick={handleBulkImportMensCollection} disabled={loading} className="px-5 py-3 bg-gold text-white font-bold rounded-xl text-xs hover:bg-gold/90 transition-colors disabled:opacity-50">Bulk Add</button>
                                        <button onClick={handleDeleteMensCollection} disabled={loading} className="px-5 py-3 border border-red-200 text-red-500 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors disabled:opacity-50">Clear All</button>
                                    </div>
                                </div>

                                {/* Rings Seeding */}
                                <div className="bg-white border border-gold/10 p-8 rounded-[32px] shadow-sm">
                                    <h3 className="font-serif text-xl mb-2 text-charcoal">Gold Rings</h3>
                                    <p className="text-xs text-charcoal/40 mb-6 leading-relaxed">Import 6 luxury designer gold rings (Halo, Solitaire Radiance, Vintage Brilliance, etc.).</p>
                                    <div className="flex gap-4">
                                        <button onClick={handleBulkImportRings} disabled={loading} className="px-5 py-3 bg-gold text-white font-bold rounded-xl text-xs hover:bg-gold/90 transition-colors disabled:opacity-50">Bulk Add</button>
                                    </div>
                                </div>

                                {/* Chains Seeding */}
                                <div className="bg-white border border-gold/10 p-8 rounded-[32px] shadow-sm">
                                    <h3 className="font-serif text-xl mb-2 text-charcoal">Gold Chains</h3>
                                    <p className="text-xs text-charcoal/40 mb-6 leading-relaxed">Import 10 Byzantine Box, Bismarck, and Mesh gold chain models with structured detail metadata.</p>
                                    <div className="flex gap-4">
                                        <button onClick={handleBulkImportNewChains} disabled={loading} className="px-5 py-3 bg-gold text-white font-bold rounded-xl text-xs hover:bg-gold/90 transition-colors disabled:opacity-50">Bulk Add</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            {/* Search bar */}
                            <div className="flex items-center gap-4 bg-white border border-gold/10 rounded-2xl p-4 shadow-xs">
                                <Search className="text-gold/40" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search catalog by title, material, concentration..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent outline-none text-charcoal text-sm"
                                />
                            </div>

                            {/* Product List Table */}
                            <div className="bg-white border border-gold/10 rounded-[32px] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gold/5 bg-gold/5">
                                                <th className="px-8 py-5 text-center w-12">
                                                    <button onClick={toggleAllProductsSelection} className="text-gold">
                                                        {selectedProductIds.length === filteredProducts.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                </th>
                                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Product</th>
                                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Details</th>
                                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Price</th>
                                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gold/10">
                                            {filteredProducts.map((p) => (
                                                <tr key={p.id} className="hover:bg-gold/[0.01]">
                                                    <td className="px-8 py-5 text-center">
                                                        <button onClick={() => toggleProductSelection(p.id)} className="text-gold/40 hover:text-gold transition-colors">
                                                            {selectedProductIds.includes(p.id) ? <CheckSquare size={18} className="text-gold" /> : <Square size={18} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            {p.images?.[0] && (
                                                                <div className="w-14 h-14 bg-zinc-50 border border-gold/10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                    <DriveImage src={p.images[0]} className="w-full h-full object-cover" alt="" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h4 className="font-bold text-charcoal text-sm leading-tight">{p.title}</h4>
                                                                <p className="text-[10px] font-medium text-gold uppercase tracking-wider mt-1">{p.gender} • {p.weight || 'Standard'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="inline-block px-3 py-1 bg-charcoal/5 border border-charcoal/10 rounded-full text-[9px] font-bold uppercase text-charcoal/60 tracking-wider">{p.material || 'Generic'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 font-serif font-bold text-charcoal">
                                                        {p.priceOnRequest ? (
                                                            <span className="text-[10px] font-bold tracking-wider text-green-600 uppercase">On Request</span>
                                                        ) : (
                                                            `₹${(p.price || 0).toLocaleString()}`
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingProduct(p)} className="p-3 text-gold hover:bg-gold/10 rounded-xl transition-all"><Edit3 size={16} /></button>
                                                            <button onClick={() => handleDeleteProduct(p)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-12 text-center text-charcoal/40 font-serif">No products found matching query.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Carts Tab */}
                    {activeTab === 'carts' && (
                        <motion.div
                            key="carts"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white border border-gold/10 rounded-[40px] overflow-hidden shadow-sm"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gold/5 bg-gold/5">
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">User</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Product</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Price</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 text-right">Date Added</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gold/10">
                                        <AnimatePresence mode="popLayout">
                                            {carts.map((cart, idx) => (
                                                <motion.tr
                                                    key={cart.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group hover:bg-gold/[0.02] transition-colors"
                                                >
                                                    <td className="px-8 py-5 text-charcoal text-sm font-medium">
                                                        {cart.userEmail}
                                                    </td>
                                                    <td className="px-8 py-5 text-charcoal">
                                                        <div className="flex items-center gap-4">
                                                            {cart.imageUrl && (
                                                                <div className="w-12 h-12 rounded-xl border border-gold/10 overflow-hidden bg-white shadow-sm flex-shrink-0">
                                                                    <DriveImage src={cart.imageUrl} className="w-full h-full object-cover" alt={cart.productTitle} />
                                                                </div>
                                                            )}
                                                            <div className="font-bold text-charcoal text-sm">{cart.productTitle}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 font-serif text-charcoal">
                                                        {cart.price === 'On Request' ? (
                                                            <span className="text-sm font-bold text-green-600 tracking-wider uppercase">Exclusive Pricing</span>
                                                        ) : (
                                                            `₹${(cart.price || 0).toLocaleString()}`
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 text-right text-xs text-charcoal/50">
                                                        {new Date(cart.createdAt).toLocaleDateString()}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {carts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-12 text-center text-charcoal/40 text-sm">
                                                    No active carts found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white border border-gold/10 rounded-[40px] overflow-hidden shadow-sm"
                        >
                            {/* Search and Filters */}
                            <div className="p-6 border-b border-gold/10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/30" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone, order ID..."
                                        value={orderSearchQuery}
                                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                                        className="w-full bg-zinc-50 border border-gold/10 rounded-xl py-2.5 pl-11 pr-4 text-xs text-charcoal focus:outline-none focus:border-gold transition-all"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto max-w-full w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                                    {[
                                        { id: 'all', label: 'All Orders' },
                                        { id: 'cod_pending', label: 'COD Pending' },
                                        { id: 'paid', label: 'Paid Online' },
                                        { id: 'approved', label: 'Approved' },
                                        { id: 'shipped', label: 'Shipped' },
                                        { id: 'completed', label: 'Completed' },
                                        { id: 'rejected', label: 'Rejected' },
                                        { id: 'cancelled', label: 'Cancelled' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setOrderFilter(tab.id)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                                                orderFilter === tab.id
                                                    ? 'bg-gold text-white shadow-sm'
                                                    : 'bg-zinc-50 border border-gold/5 text-charcoal/60 hover:border-gold/20'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gold/5 bg-gold/5">
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Order Date</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Customer Details</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Items Ordered</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Shipping Address</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Payment Info</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 text-right">Total Amount</th>
                                            <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gold/10">
                                        <AnimatePresence mode="popLayout">
                                            {filteredOrders.map((order, idx) => (
                                                <motion.tr
                                                    key={order.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group hover:bg-gold/[0.02] transition-colors"
                                                >
                                                    <td className="px-8 py-5 text-xs text-charcoal/60 whitespace-nowrap">
                                                        {new Date(order.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </td>
                                                    <td className="px-8 py-5 text-charcoal">
                                                        <div className="font-bold text-sm">{order.userName || 'Guest'}</div>
                                                        <div className="text-xs text-charcoal/50 mt-0.5">{order.userEmail}</div>
                                                        <div className="text-xs text-gold font-medium mt-0.5">{order.userPhone}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-charcoal max-w-xs">
                                                        <div className="space-y-3">
                                                            {order.items?.map((item: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    {item.imageUrl && (
                                                                        <div className="w-10 h-10 rounded-lg border border-gold/10 overflow-hidden bg-white shadow-xs flex-shrink-0">
                                                                            <DriveImage src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-bold truncate max-w-[150px]" title={item.productTitle}>{item.productTitle}</div>
                                                                        <div className="text-[10px] text-gold font-medium mt-0.5">₹{(item.price || 0).toLocaleString()}</div>
                                                                        {(item.selectedFragrance || order.shippingAddress?.selectedFragrance || order.selectedFragrance || order.fragranceOption) && (
                                                                            <div className="mt-1">
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold rounded-md text-[9px] font-bold">
                                                                                    <Sparkles size={10} /> {item.selectedFragrance || order.shippingAddress?.selectedFragrance || order.selectedFragrance || order.fragranceOption}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs text-charcoal/70 leading-relaxed max-w-xs">
                                                        {order.shippingAddress ? (
                                                            <div>
                                                                <p className="font-bold text-charcoal">{order.shippingAddress.fullName}</p>
                                                                <p>{order.shippingAddress.addressLine1}</p>
                                                                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - <span className="font-bold">{order.shippingAddress.pinCode}</span></p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-charcoal/30 italic">No Address Details</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider mb-1">ID Details</div>
                                                        <div className="text-xs font-mono font-bold text-charcoal" title="Firestore Document ID">Order: {order.id}</div>
                                                        <div className="text-[10px] font-mono text-charcoal/50" title="Payment transaction ID">Payment: {order.paymentId || 'N/A'}</div>
                                                        <div className="mt-2">
                                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                                                order.paymentMethod === 'cod'
                                                                    ? 'bg-amber-50 text-amber-600 border border-amber-200/50'
                                                                    : 'bg-blue-50 text-blue-600 border border-blue-200/50'
                                                            }`}>
                                                                {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online'}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3">
                                                            <label className="text-[8px] font-bold uppercase text-charcoal/40 tracking-wider block mb-1">Status</label>
                                                            <select
                                                                value={order.status || (order.paymentMethod === 'cod' ? 'cod_pending' : 'paid')}
                                                                onChange={async (e) => {
                                                                    const newStatus = e.target.value;
                                                                    try {
                                                                        await updateDoc(doc(db, "orders", order.id), { status: newStatus });
                                                                        alert(`Order status updated to ${newStatus}`);
                                                                    } catch (err: any) {
                                                                        alert(`Failed to update status: ${err.message}`);
                                                                    }
                                                                }}
                                                                className="bg-white border border-gold/15 rounded-lg px-2 py-1 text-xs text-charcoal focus:outline-none focus:border-gold cursor-pointer font-sans"
                                                            >
                                                                <option value="cod_pending">COD Pending</option>
                                                                <option value="paid">Paid</option>
                                                                <option value="approved">Approved</option>
                                                                <option value="shipped">Shipped</option>
                                                                <option value="completed">Completed</option>
                                                                <option value="rejected">Rejected</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-serif font-bold text-lg text-charcoal whitespace-nowrap">
                                                        ₹{(order.totalAmount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-5 text-right whitespace-nowrap">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {order.status === 'cod_pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await updateDoc(doc(db, "orders", order.id), { status: 'approved' });
                                                                                alert("Order approved successfully!");
                                                                            } catch (err: any) {
                                                                                alert(`Failed to approve order: ${err.message}`);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                                                        title="Approve Order"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await updateDoc(doc(db, "orders", order.id), { status: 'rejected' });
                                                                                alert("Order rejected!");
                                                                            } catch (err: any) {
                                                                                alert(`Failed to reject order: ${err.message}`);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                                                        title="Reject Order"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={async () => {
                                                                    if (!window.confirm("Are you sure you want to delete this order permanently? This cannot be undone.")) return;
                                                                    try {
                                                                        await deleteDoc(doc(db, "orders", order.id));
                                                                        alert("Order deleted successfully!");
                                                                    } catch (err: any) {
                                                                        alert(`Failed to delete order: ${err.message}`);
                                                                    }
                                                                }}
                                                                className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                                                                title="Delete Order Permanently"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {filteredOrders.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-12 text-center text-charcoal/40 text-sm">
                                                    No orders found matching search or filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {categories.map((c, idx) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5 }}
                                        className="bg-white border border-gold/10 p-8 rounded-3xl flex justify-between items-center group hover:border-gold/30 transition-all shadow-sm relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            {c.imageUrl ? (
                                                <div className="w-16 h-16 rounded-full overflow-hidden border border-gold/20 flex-shrink-0">
                                                    <DriveImage src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gold/5 flex items-center justify-center text-gold/40 flex-shrink-0">
                                                    <Grid size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-serif text-xl mb-1 text-charcoal">{c.name}</h4>
                                                <p className="text-[10px] text-charcoal/30 uppercase tracking-widest">{c.slug}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: -10 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setEditingCategory(c);
                                                    setIsCategoryModalOpen(true);
                                                }}
                                                className="p-3 text-gold hover:bg-gold/10 rounded-xl transition-all"
                                                title="Edit category"
                                            >
                                                <Edit3 size={18} />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 10 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDeleteCategory(c)}
                                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete category"
                                            >
                                                <Trash2 size={18} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Banners Tab */}
                    {activeTab === 'banners' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {banners.map((b) => (
                                <div key={b.id} className="bg-white border border-gold/10 rounded-[32px] overflow-hidden group hover:border-gold/30 transition-all shadow-sm flex flex-col h-full">
                                    <div className="relative aspect-[21/9] bg-zinc-100 overflow-hidden">
                                        {b.mediaType === 'video' ? (
                                            <HLSVideo src={b.image_path} className="w-full h-full object-cover" objectFit="cover" />
                                        ) : (
                                            <DriveImage src={b.image_path} className="w-full h-full object-cover" alt={b.title || "Banner Image"} />
                                        )}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button onClick={() => handleEditBanner(b)} className="p-3 bg-white/90 hover:bg-white text-gold rounded-full transition-all shadow-md">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteBanner(b)} className="p-3 bg-white/90 hover:bg-white text-red-500 rounded-full transition-all shadow-md">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-grow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <h4 className="font-serif text-xl text-charcoal">{b.title || 'Untitled Banner'}</h4>
                                                <span className="px-3 py-1 bg-gold/5 border border-gold/10 text-gold rounded-full text-[9px] font-bold uppercase tracking-wider">{b.position}</span>
                                            </div>
                                            <p className="text-xs text-charcoal/50 leading-relaxed mb-4">{b.description || 'No description provided.'}</p>
                                        </div>
                                        <div className="text-[9px] font-mono text-charcoal/20 select-all truncate">{b.image_path}</div>
                                    </div>
                                </div>
                            ))}
                            {banners.length === 0 && (
                                <div className="col-span-2 text-center py-20 text-charcoal/40 font-serif text-lg">
                                    No visual banners added yet.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <div className="max-w-2xl bg-white border border-gold/10 p-8 md:p-12 rounded-[40px] shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <Bell className="text-gold" size={28} />
                                    <h3 className="font-serif text-2xl text-charcoal">Top Announcement Bar</h3>
                                </div>
                                <p className="text-sm text-charcoal/40 leading-relaxed">
                                    This bar appears at the very top of your website. Perfect for "Coming Soon" notices, flash sales, or special events.
                                </p>
                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center justify-between p-4 bg-gold/5 rounded-2xl border border-gold/10">
                                        <div>
                                            <h4 className="font-bold text-sm text-charcoal">Show Announcement</h4>
                                            <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">Enable or disable the top bar</p>
                                        </div>
                                        <button
                                            onClick={() => setAnnouncement({ ...announcement, show: !announcement.show })}
                                            className={`w-14 h-8 rounded-full transition-all relative ${announcement.show ? 'bg-gold' : 'bg-charcoal/10'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${announcement.show ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40 tracking-widest">Announcement Text</label>
                                        <input
                                            type="text"
                                            value={announcement.text}
                                            onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                                            className="w-full bg-zinc-50 border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                            placeholder="Ex: Something Luxurious is Coming Soon..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gold/5">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-charcoal flex items-center gap-2">
                                                    <Clock size={16} className="text-gold" />
                                                    Show Timer
                                                </h4>
                                                <button
                                                    onClick={() => setAnnouncement({ ...announcement, showTimer: !announcement.showTimer })}
                                                    className={`w-10 h-6 rounded-full transition-all relative ${announcement.showTimer ? 'bg-gold' : 'bg-charcoal/10'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${announcement.showTimer ? 'left-4.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-charcoal/40 leading-tight">Display a live countdown reflecting the end date below.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-charcoal/40 tracking-widest">End Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={announcement.endDate}
                                                onChange={(e) => setAnnouncement({ ...announcement, endDate: e.target.value })}
                                                className="w-full bg-zinc-50 border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveAnnouncement}
                                        disabled={loading}
                                        className="w-full py-5 gold-gradient text-white font-bold rounded-2xl shadow-xl shadow-gold/20 disabled:opacity-50 shimmer mt-4"
                                    >
                                        {loading ? 'Saving Settings...' : 'Save Store Settings'}
                                    </motion.button>
                                </div>
                            </div>


                        </div>
                    )}

                    {/* Test Payment Tab */}
                    {activeTab === 'testPayment' && (
                        <div className="max-w-2xl bg-white border border-gold/10 p-8 md:p-12 rounded-[40px] shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <Coins className="text-gold" size={28} />
                                <h3 className="font-serif text-2xl text-charcoal">Gateway Test Tool</h3>
                            </div>
                            <p className="text-sm text-charcoal/40 leading-relaxed mb-6">
                                Use this tool to test your Razorpay integration. Input an amount below to trigger a live or test payment transaction.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40 tracking-widest">Test Payment Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={testAmount}
                                        onChange={(e) => setTestAmount(e.target.value)}
                                        className="w-full bg-zinc-50 border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none font-bold text-lg text-charcoal"
                                        placeholder="Enter amount (e.g., 10)"
                                    />
                                    <p className="text-[10px] text-charcoal/30">Min: ₹1. All payments are processed through your configured Razorpay gateway.</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40 tracking-widest">Payment Description</label>
                                    <input
                                        type="text"
                                        value={testDescription}
                                        onChange={(e) => setTestDescription(e.target.value)}
                                        className="w-full bg-zinc-50 border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm text-charcoal"
                                        placeholder="Razorpay Gateway Test"
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleRunTestPayment}
                                    className="w-full py-5 gold-gradient text-white font-bold rounded-2xl shadow-xl shadow-gold/20 flex items-center justify-center gap-2 cursor-pointer text-lg mt-4"
                                >
                                    <Coins size={20} />
                                    Pay ₹{Number(testAmount || 0).toLocaleString()} Now
                                </motion.button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Selection Floating Action Bar */}
            <AnimatePresence>
                {selectedProductIds.length > 0 && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] bg-charcoal text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-8 border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-white text-xs font-bold">{selectedProductIds.length}</div>
                            <span className="text-sm font-bold text-white/60 tracking-wider">SELECTED</span>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex gap-6">
                            <button onClick={() => setShowBulkUpdateModal(true)} className="flex items-center gap-2 text-xs font-bold hover:text-gold transition-colors uppercase tracking-widest">
                                <Grid size={16} className="text-gold" />
                                Bulk Update Mode
                            </button>
                            <button onClick={handleCopyImageUrls} className={`flex items-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest ${copyUrlsSuccess ? 'text-emerald-400' : 'text-white/70 hover:text-white'}`}>
                                {copyUrlsSuccess ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                {copyUrlsSuccess ? 'Copied!' : 'Copy URLs'}
                            </button>
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-widest">
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <button onClick={() => setSelectedProductIds([])} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                            <X size={20} className="text-white/20 group-hover:text-white" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals Section */}
            {/* Product Modal */}
            <AnimatePresence>
                {editingProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.form
                            onSubmit={handleAddProduct}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-50 border border-gold/20 w-full max-w-2xl rounded-[32px] md:rounded-[40px] p-6 md:p-10 overflow-y-auto max-h-[90vh] relative shadow-2xl"
                        >
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="absolute top-6 md:top-8 right-6 md:right-8 text-charcoal/20 hover:text-charcoal transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl md:text-3xl font-serif mb-6 md:mb-8 text-charcoal">
                                {editingProduct.id ? "Edit Masterpiece" : "Add New Piece"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Product Title</label>
                                    <input
                                        name="title"
                                        defaultValue={editingProduct.title}
                                        required
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="Royal Saffron Perfume..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Price (₹)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        defaultValue={editingProduct.price}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="2499"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Discount (%)</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        defaultValue={editingProduct.discount || 0}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40 font-medium">Select Categories</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-white border border-gold/10 rounded-2xl max-h-48 overflow-y-auto">
                                        {categories.map((c) => (
                                            <label key={c.id} className="flex items-center gap-2 text-xs text-charcoal hover:text-gold cursor-pointer py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategoryIdsForm.includes(c.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCategoryIdsForm([...selectedCategoryIdsForm, c.id]);
                                                        } else {
                                                            setSelectedCategoryIdsForm(selectedCategoryIdsForm.filter(id => id !== c.id));
                                                        }
                                                    }}
                                                    className="rounded text-gold focus:ring-gold"
                                                />
                                                {c.parentId && "— "} {c.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Description</label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingProduct.description}
                                        rows={4}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none resize-none"
                                        placeholder="Describe the aesthetic, fragrance notes, or luxury detail..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Gender Type</label>
                                    <select
                                        name="gender"
                                        defaultValue={editingProduct.gender || 'unisex'}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                    >
                                        <option value="unisex">Unisex</option>
                                        <option value="men">Men</option>
                                        <option value="female">Women</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Weight / Volume</label>
                                    <input
                                        name="weight"
                                        defaultValue={editingProduct.weight}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="100ml / 50g..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Material / Concentration</label>
                                    <input
                                        name="material"
                                        defaultValue={editingProduct.material}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="Eau de Parfum / Pure Oil..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Delivery Info</label>
                                    <input
                                        name="deliveryInfo"
                                        defaultValue={editingProduct.deliveryInfo || 'Free delivery available'}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="Ships in 2-3 business days..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Hallmark / Authenticity Info</label>
                                    <input
                                        name="hallmarkInfo"
                                        defaultValue={editingProduct.hallmarkInfo}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="100% Genuine, Certified..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Rating (0-5)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="rating"
                                        defaultValue={editingProduct.rating || 0}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="4.8"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Reviews Count</label>
                                    <input
                                        type="number"
                                        name="reviewCount"
                                        defaultValue={editingProduct.reviewCount || 0}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="12"
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-2">
                                    <input
                                        type="checkbox"
                                        name="showRating"
                                        defaultChecked={editingProduct.showRating}
                                        className="rounded text-gold focus:ring-gold"
                                    />
                                    <label className="text-xs font-bold uppercase text-charcoal/60 tracking-wider">Show Rating on Website</label>
                                </div>
                                <div className="flex items-center gap-2 p-2">
                                    <input
                                        type="checkbox"
                                        name="priceOnRequest"
                                        defaultChecked={editingProduct.priceOnRequest}
                                        className="rounded text-gold focus:ring-gold"
                                    />
                                    <label className="text-xs font-bold uppercase text-charcoal/60 tracking-wider">Price on Request</label>
                                </div>
                                <div className="flex items-center gap-2 p-2">
                                    <input
                                        type="checkbox"
                                        name="codAvailable"
                                        defaultChecked={editingProduct.codAvailable}
                                        className="rounded text-gold focus:ring-gold"
                                    />
                                    <label className="text-xs font-bold uppercase text-charcoal/60 tracking-wider">Cash on Delivery (COD) Available</label>
                                </div>

                                <div className="flex items-center gap-2 p-2 col-span-2 sm:col-span-1">
                                    <input
                                        type="checkbox"
                                        name="hasFragranceOptions"
                                        id="hasFragranceOptions"
                                        defaultChecked={editingProduct.hasFragranceOptions}
                                        className="rounded text-gold focus:ring-gold"
                                    />
                                    <label htmlFor="hasFragranceOptions" className="text-xs font-bold uppercase text-charcoal/60 tracking-wider cursor-pointer">
                                        Enable Fragrance / Perfume Options
                                    </label>
                                </div>

                                <div className="col-span-2 space-y-2 bg-gold/5 p-4 rounded-2xl border border-gold/10">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/60 tracking-wider">
                                            Fragrance / Perfume Options (Comma-Separated)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                const container = e.currentTarget.closest('.space-y-2');
                                                const input = container?.querySelector('input');
                                                if (input) {
                                                    input.value = "Vanilla, Chocolate, Sandalwood, Baccarat Rouge 540, Tobacco Vanilla, Lost Cherry, Mitti Attar, Kesar Chandan";
                                                }
                                            }}
                                            className="text-[9px] font-bold text-gold hover:underline cursor-pointer"
                                        >
                                            + Load Default Options
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        name="fragranceOptions"
                                        defaultValue={Array.isArray(editingProduct.fragranceOptions) ? editingProduct.fragranceOptions.join(', ') : (editingProduct.fragranceOptions || '')}
                                        className="w-full bg-white border border-gold/15 rounded-xl p-3 focus:border-gold outline-none text-xs"
                                        placeholder="e.g. Vanilla, Chocolate, Sandalwood, Baccarat Rouge 540"
                                    />
                                    <p className="text-[9px] text-charcoal/40 italic">
                                        These options will be presented to the user to choose from when placing an order.
                                    </p>
                                </div>

                                <div className="col-span-2 space-y-4 pt-4 border-t border-gold/5">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40 block">Product Images (URLs)</label>
                                    <div className="space-y-2">
                                        {productImages.map((img, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={img}
                                                    onChange={(e) => {
                                                        const newImgs = [...productImages];
                                                        newImgs[i] = formatImageUrl(e.target.value);
                                                        setProductImages(newImgs);
                                                    }}
                                                    className="flex-grow bg-white border border-gold/10 rounded-2xl p-3 text-xs outline-none focus:border-gold"
                                                    placeholder="Google Drive link or raw image URL"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setProductImages(productImages.filter((_, idx) => idx !== i))}
                                                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2 pt-2">
                                            <input
                                                type="text"
                                                value={newImgUrl}
                                                onChange={(e) => setNewImgUrl(e.target.value)}
                                                className="flex-grow bg-white border border-gold/10 rounded-2xl p-3 text-xs outline-none"
                                                placeholder="Add new Image URL..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (newImgUrl.trim()) {
                                                        setProductImages([...productImages, formatImageUrl(newImgUrl.trim())]);
                                                        setNewImgUrl('');
                                                    }
                                                }}
                                                className="px-4 py-3 bg-gold text-white font-bold rounded-2xl text-xs hover:bg-gold/90 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 gold-gradient text-white font-bold rounded-2xl shadow-xl shadow-gold/20 disabled:opacity-50 shimmer"
                            >
                                {loading ? 'Publishing...' : (editingProduct.id ? 'Save Changes' : 'Publish Masterpiece')}
                            </motion.button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Category Modal */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.form
                            onSubmit={handleSaveCategory}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-50 border border-gold/20 w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 relative shadow-2xl"
                        >
                            <button
                                type="button"
                                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategory({ name: '', slug: '', imageUrl: '', parentId: '' }); }}
                                className="absolute top-6 md:top-8 right-6 md:right-8 text-charcoal/20 hover:text-charcoal transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl md:text-2xl font-serif mb-6 text-charcoal">
                                {editingCategory ? "Edit Category" : "New Category"}
                            </h2>
                            <div className="space-y-4 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Name</label>
                                    <input
                                        value={newCategory.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewCategory({
                                                ...newCategory,
                                                name: val,
                                                slug: editingCategory ? newCategory.slug : val.toLowerCase().replace(/ /g, '-')
                                            });
                                        }}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="Gold Collections"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Slug</label>
                                    <input
                                        value={newCategory.slug}
                                        onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                        placeholder="gold-collections"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Parent Category (optional)</label>
                                    <select
                                        value={newCategory.parentId}
                                        onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                    >
                                        <option value="">— None (Top-Level Category) —</option>
                                        {categories.filter(c => !c.parentId && c.id !== editingCategory?.id).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Category Image URL</label>
                                    <input
                                        type="text"
                                        value={newCategory.imageUrl}
                                        onChange={(e) => setNewCategory({ ...newCategory, imageUrl: formatImageUrl(e.target.value) })}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        placeholder="https://example.com/... or Google Drive Link"
                                    />
                                    {newCategory.imageUrl && (
                                        <div className="mt-2 w-16 h-16 rounded-xl border border-gold/20 overflow-hidden bg-gray-50 flex items-center justify-center">
                                            <DriveImage src={newCategory.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full py-4 gold-gradient text-white font-bold rounded-2xl shadow-lg shadow-gold/20 shimmer"
                            >
                                {editingCategory ? "Save Changes" : "Create Category"}
                            </motion.button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Banner Modal */}
            <AnimatePresence>
                {isBannerModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.form
                            onSubmit={handleAddBanner}
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-50 border border-gold/20 w-full max-w-md rounded-[40px] p-6 md:p-10 overflow-y-auto max-h-[90vh] relative shadow-2xl"
                        >
                            <button
                                type="button"
                                onClick={() => { setIsBannerModalOpen(false); setEditingBanner(null); setNewBanner({ title: '', description: '', position: 'home', imageUrl: '', mediaType: 'image', displayMode: 'top', objectFit: 'cover', mobileObjectFit: 'cover', hideHeroText: false, heroTextColor: 'white', borderRadius: '0', aspectRatio: '21/9', mobileAspectRatio: '16/9' }); }}
                                className="absolute top-6 md:top-8 right-6 md:right-8 text-charcoal/20 hover:text-charcoal transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-serif mb-6 text-gold">
                                {editingBanner ? "Refine Visual" : "New Visual Banner"}
                            </h2>
                            <div className="space-y-4 mb-8">
                                <input
                                    value={newBanner.title}
                                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                    className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                    placeholder="Banner Title"
                                    required
                                />
                                <input
                                    value={newBanner.description}
                                    onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                                    className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                    placeholder="Short Description"
                                />
                                <select
                                    value={newBanner.position}
                                    onChange={(e) => setNewBanner({ ...newBanner, position: e.target.value })}
                                    className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none"
                                >
                                    <option value="home">Home Page</option>
                                    <option value="collections">Collections Top</option>
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Media Type</label>
                                        <select
                                            value={newBanner.mediaType}
                                            onChange={(e) => {
                                                const isVideo = e.target.value === 'video';
                                                setNewBanner({
                                                    ...newBanner,
                                                    mediaType: e.target.value,
                                                    imageUrl: formatImageUrl(newBanner.imageUrl, isVideo)
                                                });
                                            }}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        >
                                            <option value="image">Image</option>
                                            <option value="video">Video</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Display Mode</label>
                                        <select
                                            value={newBanner.displayMode}
                                            onChange={(e) => setNewBanner({ ...newBanner, displayMode: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        >
                                            <option value="top">Top Section</option>
                                            <option value="bg">Hero Background</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Crop Mode (Object Fit)</label>
                                        <select
                                            value={newBanner.objectFit}
                                            onChange={(e) => setNewBanner({ ...newBanner, objectFit: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        >
                                            <option value="cover">Perfect Cover (Fills Container)</option>
                                            <option value="contain">Show All (Adds Borders)</option>
                                            <option value="fill">Stretch Fit (No Cropping, Distorts)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Hero Text Style</label>
                                        <select
                                            value={newBanner.heroTextColor}
                                            onChange={(e) => setNewBanner({ ...newBanner, heroTextColor: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        >
                                            <option value="white">White Text</option>
                                            <option value="charcoal">Charcoal Text</option>
                                            <option value="gold">Golden Text</option>
                                            <option value="hidden">Hide Aura Title</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Mobile Crop Mode</label>
                                        <select
                                            value={newBanner.mobileObjectFit}
                                            onChange={(e) => setNewBanner({ ...newBanner, mobileObjectFit: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        >
                                            <option value="cover">Perfect Cover</option>
                                            <option value="contain">Show All</option>
                                            <option value="fill">Stretch Fit</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Border Radius (px)</label>
                                        <input
                                            value={newBanner.borderRadius}
                                            onChange={(e) => setNewBanner({ ...newBanner, borderRadius: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                            placeholder="0 or 24 or 32..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Desktop Aspect Ratio</label>
                                        <input
                                            value={newBanner.aspectRatio}
                                            onChange={(e) => setNewBanner({ ...newBanner, aspectRatio: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                            placeholder="21/9 or 16/9..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-charcoal/40">Mobile Aspect Ratio</label>
                                        <input
                                            value={newBanner.mobileAspectRatio}
                                            onChange={(e) => setNewBanner({ ...newBanner, mobileAspectRatio: e.target.value })}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                            placeholder="16/9 or 1/1..."
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2">
                                    <input
                                        type="checkbox"
                                        checked={newBanner.hideHeroText}
                                        onChange={(e) => setNewBanner({ ...newBanner, hideHeroText: e.target.checked })}
                                        className="rounded text-gold focus:ring-gold"
                                        id="hideHeroText"
                                    />
                                    <label htmlFor="hideHeroText" className="text-xs font-bold uppercase text-charcoal/60 tracking-wider cursor-pointer">Hide Entire Hero Text Block</label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Media URL</label>
                                    <input
                                        type="text"
                                        value={newBanner.imageUrl}
                                        onChange={(e) => setNewBanner({ ...newBanner, imageUrl: formatImageUrl(e.target.value, newBanner.mediaType === 'video') })}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-sm"
                                        placeholder="Google Drive link or raw media URL"
                                        required
                                    />
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full py-4 gold-gradient text-white font-bold rounded-2xl shadow-lg shadow-gold/20 shimmer"
                            >
                                {editingBanner ? "Save Changes" : "Create Banner"}
                            </motion.button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Update Modal */}
            <AnimatePresence>
                {showBulkUpdateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-50 border border-gold/20 w-full max-w-md rounded-[40px] p-6 md:p-10 relative shadow-2xl"
                        >
                            <button
                                type="button"
                                onClick={() => { setShowBulkUpdateModal(false); setBulkUpdateValue(''); }}
                                className="absolute top-6 md:top-8 right-6 md:right-8 text-charcoal/20 hover:text-charcoal transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-2xl font-serif mb-6 text-gold">Bulk Update Products</h2>
                            <div className="space-y-4 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">Select Attribute to Update</label>
                                    <select
                                        value={bulkUpdateType}
                                        onChange={(e) => {
                                            setBulkUpdateType(e.target.value);
                                            setBulkUpdateValue('');
                                        }}
                                        className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-charcoal"
                                    >
                                        <option value="category">Category</option>
                                        <option value="price">Price</option>
                                        <option value="weight">Weight / Volume</option>
                                        <option value="discount">Discount (%)</option>
                                        <option value="material">Material / Concentration</option>
                                        <option value="priceOnRequest">Price on Request</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase text-charcoal/40">New Value</label>
                                    {bulkUpdateType === 'category' ? (
                                        <select
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-charcoal"
                                            value={bulkUpdateValue}
                                            onChange={(e) => setBulkUpdateValue(e.target.value)}
                                        >
                                            <option value="">Select Target Category...</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.parentId ? "— " : ""}{c.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : bulkUpdateType === 'priceOnRequest' ? (
                                        <select
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-charcoal"
                                            value={bulkUpdateValue}
                                            onChange={(e) => setBulkUpdateValue(e.target.value)}
                                        >
                                            <option value="">Select Option...</option>
                                            <option value="true">Enable Exclusive Pricing</option>
                                            <option value="false">Disable Exclusive Pricing</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={bulkUpdateType === 'price' || bulkUpdateType === 'discount' ? 'number' : 'text'}
                                            className="w-full bg-white border border-gold/10 rounded-2xl p-4 focus:border-gold outline-none text-charcoal"
                                            value={bulkUpdateValue}
                                            onChange={(e) => setBulkUpdateValue(e.target.value)}
                                            placeholder={`Enter new ${bulkUpdateType}`}
                                        />
                                    )}
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBulkUpdate}
                                disabled={loading || String(bulkUpdateValue).trim() === ""}
                                className="w-full py-4 gold-gradient text-white font-bold rounded-2xl shadow-lg shadow-gold/20 disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Update Selected"}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gold/10 px-4 py-3 flex justify-around items-center shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
                {[
                    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
                    { id: 'products', label: 'Products', icon: ShoppingBag },
                    { id: 'categories', label: 'Cats', icon: Grid },
                    { id: 'banners', label: 'Banners', icon: ImageIcon },
                    { id: 'settings', label: 'Store', icon: Bell },
                    { id: 'testPayment', label: 'Test', icon: Coins }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); window.scrollTo(0,0); }}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-gold' : 'text-charcoal/30'}`}
                    >
                        <item.icon size={20} className={activeTab === item.id ? 'scale-110' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-400">
                    <LogOut size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Exit</span>
                </button>
            </div>

            {/* Real-time Order Toast Notifications */}
            <div className="fixed bottom-24 md:bottom-8 right-6 z-[200] space-y-4 max-w-sm w-full pointer-events-none font-sans">
                <AnimatePresence>
                    {notifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, scale: 0.9 }}
                            className="bg-charcoal border border-gold/20 p-5 rounded-2xl shadow-2xl flex gap-4 pointer-events-auto items-start relative overflow-hidden text-left"
                            style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)' }}
                        >
                            {/* Gold accent line at the left */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />
                            
                            <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center shrink-0">
                                <Bell className="text-gold animate-bounce" size={20} />
                            </div>
                            
                            <div className="flex-grow min-w-0 pr-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gold mb-1">New Order Received</h4>
                                <p className="text-xs text-white/90 font-medium leading-relaxed">{notif.message}</p>
                                <button
                                    onClick={() => {
                                        setActiveTab('orders');
                                        setOrderSearchQuery(notif.orderId);
                                        setOrderFilter('all');
                                        setNotifications(prev => prev.filter(n => n.id !== notif.id));
                                    }}
                                    className="mt-2 text-[9px] font-bold text-gold uppercase tracking-wider hover:underline cursor-pointer"
                                >
                                    View Details
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                                className="text-white/20 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
