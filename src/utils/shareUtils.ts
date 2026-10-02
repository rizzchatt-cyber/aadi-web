export interface ShareProductData {
  id: string;
  title: string;
  price?: number;
  images?: string[];
  priceOnRequest?: boolean;
}

export const showShareToast = (message: string) => {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('share-toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'share-toast-notification';
  toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-[#1a1a1a] text-white text-xs font-semibold px-5 py-3 rounded-full shadow-2xl border border-[#BF953F]/40 flex items-center gap-2 pointer-events-none transition-opacity duration-300';
  toast.innerHTML = `<span style="color: #BF953F;">✨</span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 2200);
};

export const shareProductDirectly = async (product: ShareProductData) => {
  if (!product) return;

  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' || 
     window.location.hostname.startsWith('192.168.') ||
     window.location.hostname.startsWith('10.'));

  const publicOrigin = isLocalHost 
    ? 'https://aadityasaura.com' 
    : (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://aadityasaura.com');

  const shareUrl = `${publicOrigin}/product/${product.id}`;
  const priceDisplay = product.priceOnRequest
    ? 'Price on Request'
    : product.price
    ? `₹${Number(product.price).toLocaleString('en-IN')}`
    : '';

  const shareText = `✨ *${product.title}*${priceDisplay ? ` (${priceDisplay})` : ''}\nHandcrafted Luxury Jewellery, Attar & Perfume.`;

  // Auto open More Apps (Native System Share Sheet) directly without opening popup
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `${product.title} | Aaditya's Aura`,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed/cancelled the native share sheet
        return;
      }
      console.warn('Native share failed, falling back to copy:', err);
    }
  }

  // Fallback for browsers without native share support (e.g. desktop):
  // Copy link and show brief toast
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showShareToast('Link copied to clipboard!');
    }
  } catch (copyErr) {
    console.error('Failed to copy link:', copyErr);
  }
};
