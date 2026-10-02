import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Sparkles, ExternalLink } from 'lucide-react';
import DriveImage from './DriveImage';

export interface ShareProductData {
  id: string;
  title: string;
  price?: number;
  images?: string[];
  priceOnRequest?: boolean;
}

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShareProductData | null;
}

export default function ProductShareModal({ isOpen, onClose, product }: ProductShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  // Resolve public domain: use current origin if on live domain, or production domain if on local dev
  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.startsWith('192.168.') ||
     window.location.hostname.startsWith('10.'));

  const publicOrigin = isLocalHost 
    ? 'https://aadityasaura.com' 
    : (typeof window !== 'undefined' ? window.location.origin : 'https://aadityasaura.com');

  const shareUrl = `${publicOrigin}/product/${product.id}`;
  const priceDisplay = product.priceOnRequest
    ? 'Price on Request'
    : product.price
    ? `₹${Number(product.price).toLocaleString('en-IN')}`
    : '';

  const shareText = `✨ *${product.title}*${priceDisplay ? ` (${priceDisplay})` : ''}\nHandcrafted Luxury Jewellery, Attar & Perfume.`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy. Please copy manually.');
    }
  };

  // 1. WhatsApp Chat
  const handleWhatsAppChat = () => {
    const text = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  // 2. WhatsApp Status
  const handleWhatsAppStatus = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied! Open WhatsApp & paste to Status');
    } catch {}
    const text = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`whatsapp://send?text=${text}`, '_blank');
  };

  // 3. Instagram Story / DM
  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied! Paste link sticker in Instagram Story');
    } catch {}
    // Open Instagram app or web
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }, 400);
  };

  // 4. Snapchat Story
  const handleSnapchat = () => {
    // Official Snapchat Attachment URL
    const snapUrl = `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`;
    window.open(snapUrl, '_blank', 'noopener,noreferrer');
  };

  // 5. Facebook
  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  // 6. X (Twitter)
  const handleTwitter = () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  // 7. Telegram
  const handleTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  // 8. Native System Share (Opens all mobile apps: Instagram, WhatsApp, Snap, etc.)
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${product.title} | Aaditya's Aura`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      subtitle: 'Chat & Groups',
      bg: 'bg-[#25D366]',
      textCol: 'text-white',
      borderCol: 'border-[#25D366]',
      action: handleWhatsAppChat,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.101-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.225-.653.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.101-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.235-.245-.586-.494-.507-.678-.516-.176-.008-.377-.01-.578-.01-.201 0-.527.075-.803.377-.276.301-1.054 1.03-1.054 2.512 0 1.482 1.079 2.913 1.23 3.114.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.229 1.379.197 1.898.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.351zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.183L2 22l4.957-1.402C8.423 21.498 10.151 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.628 0-3.14-.473-4.417-1.288l-.317-.201-3.267.923.945-3.18-.21-.334A8.156 8.156 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2s8.2 3.679 8.2 8.2-3.679 8.2-8.2 8.2z"/>
        </svg>
      )
    },
    {
      name: 'WhatsApp Status',
      subtitle: 'Post to Status',
      bg: 'bg-emerald-600',
      textCol: 'text-white',
      borderCol: 'border-emerald-500',
      action: handleWhatsAppStatus,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-current" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    },
    {
      name: 'Instagram Story',
      subtitle: 'Story & Direct',
      bg: 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]',
      textCol: 'text-white',
      borderCol: 'border-pink-500/30',
      action: handleInstagram,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      name: 'Snap Story',
      subtitle: 'Snapchat Link',
      bg: 'bg-[#FFFC00]',
      textCol: 'text-black',
      borderCol: 'border-yellow-400',
      action: handleSnapchat,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
          <path d="M12.001 2c-3.9 0-6.4 2.9-6.4 5.9 0 .9.3 1.8.6 2.4-.4.1-.9.4-1.1.7-.3.4-.3.9-.1 1.3.4.8 1.3 1.1 2.3 1.1.3 0 .7-.1 1.1-.2.4.9 1.3 1.7 2.3 2.1-.8.4-2.3 1.1-4.2 1.3-.4.1-.7.4-.7.8 0 .4.3.7.6.9 1.3.7 2.7.9 3.8.9 0 .3-.1.6-.2.9-.3.9-1.3 1.4-2.5 1.4h-.2c-.3 0-.6.2-.7.5-.1.3 0 .6.2.8.9.9 2.2 1.4 3.6 1.4h1.7c.6 0 1.3-.1 1.9-.3.6.2 1.3.3 1.9.3h1.7c1.4 0 2.7-.5 3.6-1.4.2-.2.3-.5.2-.8-.1-.3-.4-.5-.7-.5h-.2c-1.2 0-2.2-.5-2.5-1.4-.1-.3-.2-.6-.2-.9 1.1 0 2.5-.2 3.8-.9.3-.2.6-.5.6-.9 0-.4-.3-.7-.7-.8-1.9-.2-3.4-.9-4.2-1.3 1-.4 1.9-1.2 2.3-2.1.4.1.8.2 1.1.2 1 0 1.9-.3 2.3-1.1.2-.4.2-.9-.1-1.3-.2-.3-.7-.6-1.1-.7.3-.6.6-1.5.6-2.4 0-3-2.5-5.9-6.4-5.9z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      subtitle: 'Feed & Story',
      bg: 'bg-[#1877F2]',
      textCol: 'text-white',
      borderCol: 'border-[#1877F2]',
      action: handleFacebook,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'X (Twitter)',
      subtitle: 'Post Link',
      bg: 'bg-black',
      textCol: 'text-white',
      borderCol: 'border-neutral-700',
      action: handleTwitter,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'Telegram',
      subtitle: 'Send to Chat',
      bg: 'bg-[#229ED9]',
      textCol: 'text-white',
      borderCol: 'border-[#229ED9]',
      action: handleTelegram,
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      )
    },
    {
      name: 'More Apps',
      subtitle: 'System Share',
      bg: 'gold-gradient',
      textCol: 'text-white',
      borderCol: 'border-gold/40',
      action: handleNativeShare,
      icon: <Share2 className="w-6 h-6" />
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_rgba(191,149,63,0.2),0_20px_50px_rgba(0,0,0,0.3)] border-t-2 md:border-2 border-gold/30 z-10 overflow-hidden flex flex-col max-h-[88vh]"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gold Accent Bar */}
          <div className="h-1.5 w-full gold-gradient shrink-0" />

          {/* Modal Header */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gold/15">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                <Share2 size={16} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-charcoal text-lg leading-tight flex items-center gap-1.5">
                  Share Masterpiece
                  <Sparkles size={14} className="text-gold" />
                </h3>
                <p className="text-[11px] text-charcoal/50 font-medium">Choose an app or copy the direct link</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-luxury-cream border border-gold/30 text-charcoal/60 hover:text-charcoal hover:bg-white flex items-center justify-center transition-all active:scale-90"
              aria-label="Close share dialog"
            >
              <X size={16} />
            </button>
          </div>

          {/* Product Mini Preview Card */}
          <div className="px-6 pt-4 pb-2">
            <div className="p-3 bg-luxury-cream/60 rounded-2xl border border-gold/20 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-gold/20 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                {product.images?.[0] ? (
                  <DriveImage
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Share2 className="text-gold" size={24} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif font-bold text-charcoal text-sm truncate leading-snug">
                  {product.title}
                </h4>
                {priceDisplay && (
                  <p className="text-gold font-bold text-xs mt-0.5 font-serif">
                    {priceDisplay}
                  </p>
                )}
                <span className="text-[10px] uppercase tracking-wider text-charcoal/40 font-semibold">
                  Aaditya's Aura
                </span>
              </div>
            </div>
          </div>

          {/* Social Apps Grid */}
          <div className="px-6 py-4 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3">
              {shareOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={opt.action}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-luxury-cream/80 transition-all duration-200 group active:scale-95 cursor-pointer text-center"
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${opt.bg} ${opt.textCol} shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-200 border ${opt.borderCol}`}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-[11px] font-bold text-charcoal leading-tight line-clamp-1">
                    {opt.name}
                  </span>
                  <span className="text-[9px] text-charcoal/45 font-medium leading-none hidden sm:block">
                    {opt.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Link Footer Bar */}
          <div className="px-6 pt-2 pb-3">
            <div className="flex items-center gap-2 p-1.5 pl-3.5 bg-luxury-cream/70 border border-gold/25 rounded-2xl">
              <span className="text-xs text-charcoal/60 truncate flex-1 font-mono select-all">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'gold-gradient text-white shadow-md hover:brightness-105 active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Floating Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-16 left-6 right-6 z-30 pointer-events-none flex justify-center"
              >
                <div className="bg-charcoal text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl border border-gold/30 flex items-center gap-2">
                  <Sparkles size={14} className="text-gold" />
                  <span>{toastMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
