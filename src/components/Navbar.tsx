import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogOut, User as UserIcon, ShoppingCart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import logo from '../assets/logo.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
    setIsOpen(false);
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: 'About', href: '/about' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-gray-100 shadow-sm py-3`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">

        {/* Left: Logo + Brand Name */}
        <Link to="/" className="flex items-center gap-4 group flex-shrink-0 relative">
          <div className="relative">
            <div>
              <motion.img
                src={logo}
                alt="Aaditya's Aura Logo"
                width="48"
                height="48"
                className="h-12 w-auto drop-shadow-md"
                whileHover={{ scale: 1.1, rotate: 12 }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=Aura';
                }}
              />
            </div>
            <div className="absolute -inset-2 bg-gold/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-[0.5em] text-gold/60 font-black mb-1 group-hover:text-gold transition-colors duration-500">Aaditya's</span>
            <span className="font-serif font-black text-xl gold-text-gradient uppercase tracking-[0.2em] group-hover:tracking-[0.25em] transition-all duration-700">Aura</span>
          </div>
        </Link>

        {/* Center: Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`relative text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 group ${location.pathname === item.href ? 'text-gold' : 'text-charcoal/60 hover:text-gold'
                }`}
            >
              {item.name}
              <span className={`absolute -bottom-1 left-0 h-px bg-gold transition-all duration-500 ${location.pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
            </Link>
          ))}
        </div>

        {/* Right: Auth Area */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to={role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal/60 hover:text-gold transition-colors"
                title="Dashboard"
              >
                <UserIcon size={18} className="text-gold" />
              </Link>
              {role !== 'admin' && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-charcoal/60 hover:text-gold transition-colors"
                  title="My Cart"
                >
                  <ShoppingCart size={18} className="text-gold" />
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-charcoal/30 hover:text-red-500 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 border-2 border-gold text-gold rounded-lg hover:bg-gold hover:text-white transition-all duration-300"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          {user && (
            <div className="flex gap-4">
              <Link to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-gold">
                <UserIcon size={22} />
              </Link>
              {role !== 'admin' && (
                <Link to="/dashboard" className="text-gold">
                  <ShoppingCart size={22} />
                </Link>
              )}
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gold p-2 bg-gold/5 rounded-xl"
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-luxury-white border-b border-gold/10 overflow-hidden shadow-md"
          >
            <motion.div
              variants={{
                open: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
                closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.2 }}
              className="px-8 py-12 flex flex-col space-y-8"
            >
              {navItems.map((item) => (
                <motion.div
                  key={item.name}
                  variants={{
                    open: { y: 0, opacity: 1 },
                    closed: { y: 20, opacity: 0 }
                  }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-2xl md:text-3xl font-serif tracking-tight transition-colors py-1 block ${location.pathname === item.href ? 'text-gold' : 'text-charcoal/80 hover:text-gold'
                      }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                variants={{
                  open: { y: 0, opacity: 1 },
                  closed: { y: 20, opacity: 0 }
                }}
                className="pt-4 border-t border-gold/10 flex flex-col gap-4"
              >
                {user ? (
                  <>
                    <Link
                      to={role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                      onClick={() => setIsOpen(false)}
                      className="w-full py-4 bg-gold/5 border border-gold/20 text-gold font-bold rounded-2xl text-center text-sm tracking-widest uppercase"
                    >
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 text-red-500 font-bold border border-red-50 border-double rounded-2xl text-sm tracking-widest uppercase"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4 gold-gradient text-white font-bold rounded-2xl text-center shadow-[0_10px_20px_rgba(191,149,63,0.2)] text-sm shimmer relative overflow-hidden tracking-widest uppercase"
                  >
                    Login to Aura
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

