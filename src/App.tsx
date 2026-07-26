import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnnouncementBar from './components/AnnouncementBar';
import SocialBubbles from './components/SocialBubbles';
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
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className="relative min-h-[100dvh] bg-luxury-white">
      <div className="flex flex-col min-h-[100dvh]">
        <AnnouncementBar />
        <Navbar />

        <main className="flex-grow">
          <AnimatedRoutes />
        </main>

        {isHome && <Footer />}

        {/* Sticky Mobile Order Button - Only on Home */}
        <AnimatePresence>
          {isHome && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-0 right-0 z-40 px-6 md:hidden"
            >
              <button
                onClick={() => navigate('/collections')}
                className="w-full py-4 gold-gradient text-luxury-white font-bold rounded-full shadow-[0_15px_35px_rgba(191,149,63,0.4)] hover:shadow-[0_20px_40px_rgba(191,149,63,0.6)] transition-all shimmer relative overflow-hidden active:scale-95"
              >
                Order Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isHome && <SocialBubbles />}
      </div>
    </div>
  );
}

