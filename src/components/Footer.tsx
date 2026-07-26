import { motion } from 'motion/react';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pt-24 pb-12 px-6 border-t border-gold/10 bg-luxury-cream/20 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="text-3xl font-serif font-black gold-text-gradient mb-6 tracking-luxury">Aaditya’s Aura</div>
            <p className="text-charcoal/50 text-sm leading-relaxed mb-8 font-light italic">
              “Crafting pieces that transcend time, built on the foundations of purity and unparalleled trust.”
            </p>
            <div className="flex gap-5">
              {[Instagram, Facebook, Twitter].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center text-gold transition-all duration-300"
                  aria-label={`Visit our ${Icon.name || 'social media'} page`}
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-charcoal font-bold uppercase tracking-[0.2em] text-xs mb-8">Quick Links</h4>
            <ul className="space-y-4">
              {['Home', 'Collections', 'About', 'Gallery', 'Contact'].map((item) => (
                <li key={item}>
                  <Link
                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                    className="text-charcoal/60 text-sm hover:text-gold transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-4 h-px bg-gold mr-0 group-hover:mr-2 transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-charcoal font-bold uppercase tracking-[0.2em] text-xs mb-8">Contact Us</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4 text-charcoal/60 text-sm group">
                <div className="w-8 h-8 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
                  <Mail size={14} />
                </div>
                <span>aadityasaura@gmail.com</span>
              </li>
              <li className="flex items-start gap-4 text-charcoal/60 text-sm group">
                <div className="w-8 h-8 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
                  <Phone size={14} />
                </div>
                <div className="flex flex-col">
                  <span>+91 86-53-53-53-03</span>
                  <span>+91 9685152530</span>
                </div>
              </li>
              <li className="flex items-start gap-4 text-charcoal/60 text-sm group">
                <div className="w-8 h-8 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:bg-gold/10 transition-colors">
                  <MapPin size={14} />
                </div>
                <span>premium Jewellery, Attar & Perfume,<br />Aaditya’s Aura, Dalli road,<br />Sankar Nagar, Bhanupratappur,<br />Chhattisgarh 494669</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-charcoal font-bold uppercase tracking-[0.2em] text-xs mb-8">Newsletter</h4>
            <p className="text-charcoal/50 text-sm mb-6 font-light">Join our elite circle for private collection reveals.</p>
            <div className="relative">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full bg-transparent border-b border-gold/20 py-3 text-sm focus:outline-none focus:border-gold transition-colors font-light"
              />
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gold hover:translate-x-1 transition-transform"
                aria-label="Subscribe to newsletter"
              >
                <Mail size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-gold/5 flex flex-col md:row justify-between items-center gap-6">
          <p className="text-charcoal/60 text-[10px] uppercase tracking-widest">
            © {currentYear} Aaditya’s Aura. Built on Trust & Transparency.
            <Link to="/admin/login" className="hover:text-gold transition-colors ml-3 underline decoration-gold/10">Admin Portal</Link>
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-charcoal/60 text-[10px] uppercase tracking-widest hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="text-charcoal/60 text-[10px] uppercase tracking-widest hover:text-gold transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
