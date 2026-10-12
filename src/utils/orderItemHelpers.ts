// Helper utility for parsing and formatting order items, fragrance types, and ml sizes
export interface ParsedOrderItem {
    productTitle: string;
    cleanTitle: string;
    categoryType: 'Attar' | 'Perfume' | 'Jewellery' | 'Other';
    size: string;
    sizeLabel: string;
    isFragrance: boolean;
    badgeLabel: string;
    badgeStyle: 'attar' | 'perfume' | 'jewel' | 'other';
    packagingGuide: string;
    notes?: string;
}

/**
 * Robust parser that inspects item metadata, order-level variants, and product title patterns
 * to accurately identify whether the product is Attar or Perfume, and its exact volume in ML.
 */
export function parseOrderItem(item: any, order?: any): ParsedOrderItem {
    const rawTitle = (item?.productTitle || item?.title || '').trim();
    let cleanTitle = rawTitle;

    // 1. Check item-level explicit variant properties
    let type: string | null = item?.type || item?.variantType || item?.selectedVariant?.type || null;
    let size: string | null = item?.size || item?.variantSize || item?.selectedVariant?.size || null;
    let sizeLabel: string | null = item?.sizeLabel || item?.variantSizeLabel || item?.selectedVariant?.sizeLabel || null;

    // 2. Check order-level variant properties if single-item or not set
    if (!type && order?.selectedVariant?.type) {
        type = order.selectedVariant.type;
    }
    if (!size && order?.selectedVariant?.size) {
        size = order.selectedVariant.size;
    }
    if (!sizeLabel && order?.selectedVariant?.sizeLabel) {
        sizeLabel = order.selectedVariant.sizeLabel;
    }

    // 3. Parse title pattern: e.g. "Flora (Attar • 6ml)" or "Kashmir 1947 (Perfume • 50-60ml)"
    const bracketMatch = rawTitle.match(/\((Attar|Perfume)\s*[•·\-\/]\s*([^)]+)\)/i);
    if (bracketMatch) {
        if (!type) type = bracketMatch[1].trim();
        if (!size) size = bracketMatch[2].trim();
        // Remove the bracket suffix to get the pure product title
        cleanTitle = rawTitle.replace(/\s*\((Attar|Perfume)\s*[•·\-\/]\s*[^)]+\)/gi, '').trim();
    }

    // 4. Fallback search in title for type and ml if still missing
    const lowerTitle = rawTitle.toLowerCase();

    // Check for jewellery indicators
    const jewelKeywords = [
        'jewel', 'jewellery', 'jewelry', 'bangle', 'locket', 'chain', 'ring',
        'bracelet', 'mangtika', 'kada', 'earring', 'payal', 'rani har', 'har',
        'bichiya', 'utensil', '22k', '18k', '925 silver', 'silver'
    ];
    const isJewel = jewelKeywords.some(kw => lowerTitle.includes(kw)) &&
                    !lowerTitle.includes('attar') &&
                    !lowerTitle.includes('perfume') &&
                    !lowerTitle.includes('ittar');

    if (!type) {
        if (isJewel) {
            type = 'Jewellery';
        } else if (lowerTitle.includes('attar') || lowerTitle.includes('ittar') || lowerTitle.includes('aatra')) {
            type = 'Attar';
        } else if (lowerTitle.includes('perfume') || lowerTitle.includes('edp') || lowerTitle.includes('parfum')) {
            type = 'Perfume';
        }
    }

    // Search for ML in title if still missing
    if (!size) {
        const mlMatch = rawTitle.match(/\b(10-15|20-25|50-60|100|60|50|30|25|20|15|12|10|9|6|3)\s*ml\b/i);
        if (mlMatch) {
            size = `${mlMatch[1]}ml`;
        }
    }

    // Normalize type
    let categoryType: 'Attar' | 'Perfume' | 'Jewellery' | 'Other' = 'Other';
    if (type) {
        const norm = type.toLowerCase();
        if (norm.includes('attar') || norm.includes('ittar') || norm.includes('aatra')) {
            categoryType = 'Attar';
        } else if (norm.includes('perfume') || norm.includes('edp') || norm.includes('spray')) {
            categoryType = 'Perfume';
        } else if (norm.includes('jewel') || isJewel) {
            categoryType = 'Jewellery';
        }
    } else if (isJewel) {
        categoryType = 'Jewellery';
    } else {
        // Default to Attar if fragrance brand default
        categoryType = 'Attar';
    }

    // Standardize ML sizes
    let finalSize = size || (categoryType === 'Attar' ? '6ml' : categoryType === 'Perfume' ? '50-60ml' : '');
    // Clean size string e.g. "6 ml" -> "6ml"
    finalSize = finalSize.replace(/\s+/g, '');
    if (finalSize && !finalSize.toLowerCase().endsWith('ml') && /^\d+/.test(finalSize)) {
        finalSize = `${finalSize}ml`;
    }

    // Standardize size labels
    if (!sizeLabel && finalSize) {
        if (categoryType === 'Attar') {
            if (finalSize === '3ml') sizeLabel = 'Small (3ml)';
            else if (finalSize === '6ml') sizeLabel = 'Medium (6ml)';
            else if (finalSize === '12ml' || finalSize === '9ml') sizeLabel = 'Large (12ml)';
            else sizeLabel = finalSize;
        } else if (categoryType === 'Perfume') {
            if (finalSize === '10-15ml' || finalSize === '10ml' || finalSize === '15ml') sizeLabel = 'Pocket (10-15ml)';
            else if (finalSize === '20-25ml' || finalSize === '20ml' || finalSize === '25ml') sizeLabel = 'Travel (20-25ml)';
            else if (finalSize === '30ml') sizeLabel = 'Small (30ml)';
            else if (finalSize === '50-60ml' || finalSize === '50ml' || finalSize === '60ml') sizeLabel = 'Medium (50-60ml)';
            else if (finalSize === '100ml') sizeLabel = 'Large (100ml)';
            else sizeLabel = finalSize;
        } else {
            sizeLabel = finalSize;
        }
    }

    // Format badge label and style
    let badgeLabel = '';
    let badgeStyle: 'attar' | 'perfume' | 'jewel' | 'other' = 'other';
    let packagingGuide = '';

    if (categoryType === 'Attar') {
        badgeStyle = 'attar';
        badgeLabel = `🌿 ATTAR (Ittar) • ${finalSize || '6ml'}`;
        packagingGuide = `Pack 1x ${finalSize || '6ml'} Traditional Attar Roll-on / Stopper Bottle (Alcohol-Free Pure Perfume Oil)`;
    } else if (categoryType === 'Perfume') {
        badgeStyle = 'perfume';
        badgeLabel = `✨ PERFUME (Spray EDP) • ${finalSize || '50-60ml'}`;
        packagingGuide = `Pack 1x ${finalSize || '50-60ml'} French Vaporisateur Spray Bottle (35% Eau De Parfum)`;
    } else if (categoryType === 'Jewellery') {
        badgeStyle = 'jewel';
        badgeLabel = `💎 FINE JEWELLERY`;
        packagingGuide = `Pack in Velvet Luxury Jewellery Box with Certificate Card`;
    } else {
        badgeStyle = 'other';
        badgeLabel = finalSize ? `PRODUCT • ${finalSize}` : 'STANDARD PRODUCT';
        packagingGuide = `Pack carefully with bubble wrap and protective casing`;
    }

    return {
        productTitle: rawTitle,
        cleanTitle: cleanTitle || rawTitle,
        categoryType,
        size: finalSize,
        sizeLabel: sizeLabel || finalSize,
        isFragrance: categoryType === 'Attar' || categoryType === 'Perfume',
        badgeLabel,
        badgeStyle,
        packagingGuide
    };
}

/**
 * Returns human-readable label and Tailwind styling for order statuses
 */
export function getOrderStatusMeta(status: string) {
    const s = (status || 'paid').toLowerCase();
    switch (s) {
        case 'cod_pending':
            return {
                label: 'COD Pending',
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                dotColor: 'bg-amber-500',
                description: 'Cash on delivery order awaiting admin verification & confirmation.'
            };
        case 'upi_pending':
            return {
                label: 'UPI Pending',
                badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
                dotColor: 'bg-orange-500',
                description: 'UPI payment submitted, awaiting transaction verification.'
            };
        case 'paid':
            return {
                label: 'Paid Online',
                badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                dotColor: 'bg-emerald-500',
                description: 'Payment captured successfully via Razorpay / online gateway.'
            };
        case 'approved':
            return {
                label: 'Approved',
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                dotColor: 'bg-blue-500',
                description: 'Order confirmed and approved for packaging & dispatch.'
            };
        case 'shipped':
            return {
                label: 'Shipped',
                badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
                dotColor: 'bg-purple-500',
                description: 'Package handed over to courier service with tracking.'
            };
        case 'completed':
            return {
                label: 'Completed',
                badgeBg: 'bg-green-50 text-green-700 border-green-200',
                dotColor: 'bg-green-500',
                description: 'Successfully delivered to customer.'
            };
        case 'rejected':
            return {
                label: 'Rejected',
                badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
                dotColor: 'bg-rose-500',
                description: 'Order cancelled / declined by store admin.'
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                badgeBg: 'bg-gray-100 text-gray-700 border-gray-300',
                dotColor: 'bg-gray-400',
                description: 'Order cancelled by customer or payment failed.'
            };
        default:
            return {
                label: status || 'Pending',
                badgeBg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                dotColor: 'bg-zinc-400',
                description: 'Status updated.'
            };
    }
}

/**
 * Safely formats any timestamp, Firestore Timestamp object, string, or number into a readable date string.
 * Prevents "RangeError: Invalid time value" which causes React unmounting / white-screen crashes.
 */
export function formatSafeDate(val: any, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
    if (!val) return 'Recently';
    try {
        let date: Date;
        if (typeof val?.toDate === 'function') {
            date = val.toDate();
        } else if (typeof val?.seconds === 'number') {
            date = new Date(val.seconds * 1000);
        } else if (typeof val === 'number') {
            date = new Date(val);
        } else if (typeof val === 'string') {
            date = new Date(val);
        } else {
            return 'Recently';
        }

        if (isNaN(date.getTime())) {
            return 'Recently';
        }
        return date.toLocaleString(undefined, options);
    } catch {
        return 'Recently';
    }
}

/**
 * Safely slices order ID without throwing "Cannot read properties of undefined (reading 'slice')".
 */
export function formatSafeOrderId(id: any, len = 8): string {
    if (!id) return 'AURA';
    const s = String(id);
    return s.length > len ? s.slice(-len) : s;
}

/**
 * Safely formats currency without crashing on null/undefined.
 */
export function formatSafeCurrency(amount: any): string {
    const num = Number(amount);
    if (isNaN(num)) return '₹0';
    return `₹${num.toLocaleString('en-IN')}`;
}

