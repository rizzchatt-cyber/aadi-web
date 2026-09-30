import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import aaPhoto from '../assets/aa.jpeg';
import logo from '../assets/logo.png';

interface WhatsAppBottomPopupProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function WhatsAppBottomPopup({ onVisibilityChange }: WhatsAppBottomPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // WhatsApp Configuration
  const displayName = "Aaditya soni";
  const displayPhone = "+91 86535 35303";
  const rawPhoneNumber = "918653535303";
  const defaultText = encodeURIComponent(
    "Hello Aaditya Soni, I am interested in your Jewellery, Attar & Perfume collection!"
  );
  const whatsappUrl = `https://wa.me/${rawPhoneNumber}?text=${defaultText}`;

  useEffect(() => {
    // When web loads, popup slides up smoothly after 600ms
    const timer = setTimeout(() => {
      setIsVisible(true);
      onVisibilityChange?.(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [onVisibilityChange]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
    onVisibilityChange?.(false);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          role="complementary"
          aria-label="WhatsApp quick chat"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-auto"
        >
          {/* Main White Luxury Bar (Mobile Only) */}
          <div
            className="relative bg-white/95 backdrop-blur-md text-charcoal px-4 py-3 shadow-[0_-10px_35px_rgba(191,149,63,0.18),0_-2px_10px_rgba(0,0,0,0.04)] border-t-2 border-gold/40 transition-all"
            style={{
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              aria-label="Close WhatsApp chat prompt"
              className="absolute -top-3 right-3 w-6 h-6 bg-white border border-gold/40 hover:border-gold text-charcoal/60 hover:text-charcoal rounded-full flex items-center justify-center transition-all active:scale-90 shadow-sm hover:shadow"
            >
              <X size={12} strokeWidth={2.5} />
            </button>

            <div className="flex items-center justify-between gap-3">
              {/* Left Side: Avatar + Name + Number */}
              <div
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                title="Chat with Aaditya soni on WhatsApp"
              >
                {/* Circular Avatar with aa photo (no text inside) */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-luxury-cream border-2 border-gold/40 overflow-hidden flex items-center justify-center shadow-xs group-hover:border-gold transition-colors">
                    <img
                      src={aaPhoto}
                      alt={displayName}
                      className="w-full h-full object-cover object-[50%_18%]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = logo;
                        (e.target as HTMLImageElement).className = "w-full h-full object-contain p-1";
                      }}
                    />
                  </div>
                  {/* Subtle online status indicator */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25D366] border-2 border-white rounded-full shadow-xs" />
                </div>

                {/* Name & Verified Scallop Badge & Phone Number */}
                <div className="flex flex-col min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-charcoal text-[15px] tracking-tight truncate group-hover:text-gold transition-colors">
                      {displayName}
                    </span>
                    {/* 16-point Scalloped Verified Badge */}
                    <span
                      className="inline-flex items-center justify-center shrink-0"
                      title="Verified Business"
                    >
                      <svg
                        viewBox="0 0 22 22"
                        className="w-[18px] h-[18px] shrink-0"
                        fill="none"
                      >
                        <path
                          d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"
                          fill="#2ea5ff"
                        />
                        <path
                          d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                          fill="#ffffff"
                        />
                      </svg>
                    </span>
                  </div>
                  <span className="text-xs text-charcoal/60 font-mono font-medium tracking-wider truncate mt-0.5">
                    {displayPhone}
                  </span>
                </div>
              </div>

              {/* Right Side: WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-md shadow-green-600/25 transition-all duration-200"
                aria-label="Open chat in WhatsApp"
              >
                {/* WhatsApp Logo */}
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  className="shrink-0"
                >
                  <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.101-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.225-.653.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.235-.245-.586-.494-.507-.678-.516-.176-.008-.377-.01-.578-.01-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.913 1.23 3.114.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.229 1.379.197 1.898.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.351z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.183L2 22l4.957-1.402C8.423 21.498 10.151 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.628 0-3.14-.473-4.417-1.288l-.317-.201-3.267.923.945-3.18-.21-.334A8.156 8.156 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2s8.2 3.679 8.2 8.2-3.679 8.2-8.2 8.2z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
