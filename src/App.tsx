import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnnouncementBar from './components/AnnouncementBar';
import SocialBubbles from './components/SocialBubbles';
import WhatsAppBottomPopup from './components/WhatsAppBottomPopup';
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Collections from './pages/Collections';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ProductDetail from './pages/ProductDetail';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <Home />
          </motion.div>
        } />
        <Route path="/collections" element={
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <Collections />
          </motion.div>
        } />
        <Route path="/about" element={
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <About />
          </motion.div>
        } />
        <Route path="/gallery" element={
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <Gallery />
          </motion.div>
        } />
        <Route path="/contact" element={
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <Contact />
          </motion.div>
        } />
        <Route path="/product/:id" element={
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <ProductDetail />
          </motion.div>
        } />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/signup" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-[100dvh] bg-luxury-white">
      <div className="flex flex-col min-h-[100dvh]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex-grow">
          <AnimatedRoutes />
        </main>

        {isHome && <Footer />}
        {isHome && <SocialBubbles />}

        {/* Mobile-Only WhatsApp Bottom Popup Bar */}
        {!isAdmin && <WhatsAppBottomPopup />}
      </div>
    </div>
  );
}

