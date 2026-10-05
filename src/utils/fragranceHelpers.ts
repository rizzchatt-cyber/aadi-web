export interface FragranceVariantInfo {
    enabled: boolean;
    price: number;
    mrp: number;
    discount: number;
    sizeName: string;
    ml: string;
    label: string;
}

export interface FragrancePricingResult {
    attar: {
        minPrice: number;
        minMrp: number;
        maxDiscount: number;
        options: Record<string, FragranceVariantInfo>;
        enabled: boolean;
    };
    perfume: {
        minPrice: number;
        minMrp: number;
        maxDiscount: number;
        options: Record<string, FragranceVariantInfo>;
        enabled: boolean;
    };
    overallMinPrice: number;
    overallMinMrp: number;
    overallMaxDiscount: number;
}

export function isJewelleryProduct(prod: any): boolean {
    if (!prod) return false;
    const title = (prod.title || '').toLowerCase();
    const matName = (prod.material || '').toLowerCase();
    const catName = (prod.categoryName || prod.category_id || '').toLowerCase();
    const catIds = Array.isArray(prod.category_ids) ? prod.category_ids.join(' ').toLowerCase() : '';

    const jewelKeywords = [
        'jewel', 'jewellery', 'jewelry', 'bangle', 'locket', 'chain', 'ring', 
        'bracelet', 'mangtika', 'kada', 'earring', 'payal', 'rani har', 'har', 
        'bichiya', 'utensil', '22k', '18k', '925 silver', 'gold set'
    ];

    const isJewelMatch = jewelKeywords.some(kw => 
        title.includes(kw) || matName.includes(kw) || catName.includes(kw) || catIds.includes(kw)
    );

    const hasGoldSilver = (matName.includes('gold') || matName.includes('silver') || title.includes('gold') || title.includes('silver')) && 
                          !matName.includes('attar') && !matName.includes('perfume') && !title.includes('attar') && !title.includes('perfume');

    if (isJewelMatch || hasGoldSilver) {
        if (prod.fragranceOptions?.enabled === true) return false;
        return true;
    }

    return false;
}

export function isFragranceProduct(prod: any): boolean {
    if (!prod) return false;

    // If fragranceOptions is explicitly disabled on the product
    if (prod.fragranceOptions?.enabled === false) {
        return false;
    }

    // If explicitly jewellery, then not fragrance
    if (isJewelleryProduct(prod)) return false;

    // All non-jewellery items (Flora, Royal Saffron, Mitti Attar, etc.) are fragrance products unless disabled
    return true;
}

export function calculateMrpAndDiscount(price: number, customMrp?: number): { mrp: number; discount: number } {
    const defaultMrpAdd = price <= 200 ? 200 : price <= 400 ? 250 : price <= 600 ? 300 : price <= 900 ? 400 : 700;
    const mrp = customMrp && customMrp > price ? customMrp : price + defaultMrpAdd;
    const discount = Math.round(((mrp - price) / mrp) * 100);
    return { mrp, discount };
}

export function getFragrancePricing(prod: any): FragrancePricingResult {
    const opts = prod?.fragranceOptions || {};

    // Attar Options (3ml: 199, 6ml: 349, 12ml/9ml: 549)
    const attarEnabled = opts.attar?.enabled !== false;
    
    // 3ml Attar (Small)
    const attar3mlPrice = (opts.attar?.['3ml']?.price && opts.attar['3ml'].price > 0) ? opts.attar['3ml'].price : 199;
    const attar3mlMrpInfo = calculateMrpAndDiscount(attar3mlPrice, opts.attar?.['3ml']?.mrp);

    // 6ml Attar (Medium)
    const attar6mlPrice = (opts.attar?.['6ml']?.price && opts.attar['6ml'].price > 0) ? opts.attar['6ml'].price : 349;
    const attar6mlMrpInfo = calculateMrpAndDiscount(attar6mlPrice, opts.attar?.['6ml']?.mrp);

    // 12ml / 9ml Attar (Large)
    const raw12ml = opts.attar?.['12ml']?.price || opts.attar?.['9ml']?.price;
    const attar12mlPrice = (raw12ml && raw12ml > 0) ? raw12ml : 549;
    const attar12mlMrpInfo = calculateMrpAndDiscount(attar12mlPrice, opts.attar?.['12ml']?.mrp || opts.attar?.['9ml']?.mrp);

    const attarOptions: Record<string, FragranceVariantInfo> = {
        '3ml': {
            enabled: opts.attar?.['3ml']?.enabled !== false,
            price: attar3mlPrice,
            mrp: attar3mlMrpInfo.mrp,
            discount: attar3mlMrpInfo.discount,
            sizeName: 'Small',
            ml: '3ml',
            label: 'Small (3ml)'
        },
        '6ml': {
            enabled: opts.attar?.['6ml']?.enabled !== false,
            price: attar6mlPrice,
            mrp: attar6mlMrpInfo.mrp,
            discount: attar6mlMrpInfo.discount,
            sizeName: 'Medium',
            ml: '6ml',
            label: 'Medium (6ml)'
        },
        '12ml': {
            enabled: opts.attar?.['12ml']?.enabled !== false && opts.attar?.['9ml']?.enabled !== false,
            price: attar12mlPrice,
            mrp: attar12mlMrpInfo.mrp,
            discount: attar12mlMrpInfo.discount,
            sizeName: 'Large',
            ml: '12ml',
            label: 'Large (12ml)'
        }
    };

    // Perfume Options - 5 Sizes: 10-15ml (299), 20-25ml (399), 30ml (549), 50-60ml (799), 100ml (1499)
    const perfumeEnabled = opts.perfume?.enabled !== false;

    // 10-15ml Perfume (Pocket)
    const raw10_15ml = opts.perfume?.['10-15ml']?.price;
    const perfume10_15mlPrice = (raw10_15ml && raw10_15ml > 0) ? raw10_15ml : 299;
    const perfume10_15mlMrpInfo = calculateMrpAndDiscount(perfume10_15mlPrice, opts.perfume?.['10-15ml']?.mrp);

    // 20-25ml Perfume (Travel)
    const raw20_25ml = opts.perfume?.['20-25ml']?.price;
    const perfume20_25mlPrice = (raw20_25ml && raw20_25ml > 0) ? raw20_25ml : 399;
    const perfume20_25mlMrpInfo = calculateMrpAndDiscount(perfume20_25mlPrice, opts.perfume?.['20-25ml']?.mrp);

    // 30ml Perfume (Small)
    const raw30ml = opts.perfume?.['30ml']?.price;
    const perfume30mlPrice = (raw30ml && raw30ml > 0) ? raw30ml : 549;
    const perfume30mlMrpInfo = calculateMrpAndDiscount(perfume30mlPrice, opts.perfume?.['30ml']?.mrp);

    // 50-60ml Perfume (Medium - formerly 60ml / 50ml)
    const raw50_60ml = opts.perfume?.['50-60ml']?.price || opts.perfume?.['60ml']?.price || opts.perfume?.['50ml']?.price;
    const perfume50_60mlPrice = (raw50_60ml && raw50_60ml > 0) ? raw50_60ml : 799;
    const perfume50_60mlMrpInfo = calculateMrpAndDiscount(perfume50_60mlPrice, opts.perfume?.['50-60ml']?.mrp || opts.perfume?.['60ml']?.mrp || opts.perfume?.['50ml']?.mrp);

    // 100ml Perfume (Large)
    const raw100ml = opts.perfume?.['100ml']?.price;
    const perfume100mlPrice = (raw100ml && raw100ml > 0) ? raw100ml : 1499;
    const perfume100mlMrpInfo = calculateMrpAndDiscount(perfume100mlPrice, opts.perfume?.['100ml']?.mrp);

    const perfumeOptions: Record<string, FragranceVariantInfo> = {
        '10-15ml': {
            enabled: opts.perfume?.['10-15ml']?.enabled !== false,
            price: perfume10_15mlPrice,
            mrp: perfume10_15mlMrpInfo.mrp,
            discount: perfume10_15mlMrpInfo.discount,
            sizeName: 'Pocket',
            ml: '10-15ml',
            label: 'Pocket (10-15ml)'
        },
        '20-25ml': {
            enabled: opts.perfume?.['20-25ml']?.enabled !== false,
            price: perfume20_25mlPrice,
            mrp: perfume20_25mlMrpInfo.mrp,
            discount: perfume20_25mlMrpInfo.discount,
            sizeName: 'Travel',
            ml: '20-25ml',
            label: 'Travel (20-25ml)'
        },
        '30ml': {
            enabled: opts.perfume?.['30ml']?.enabled !== false,
            price: perfume30mlPrice,
            mrp: perfume30mlMrpInfo.mrp,
            discount: perfume30mlMrpInfo.discount,
            sizeName: 'Small',
            ml: '30ml',
            label: 'Small (30ml)'
        },
        '50-60ml': {
            enabled: (opts.perfume?.['50-60ml']?.enabled ?? opts.perfume?.['60ml']?.enabled ?? opts.perfume?.['50ml']?.enabled) !== false,
            price: perfume50_60mlPrice,
            mrp: perfume50_60mlMrpInfo.mrp,
            discount: perfume50_60mlMrpInfo.discount,
            sizeName: 'Medium',
            ml: '50-60ml',
            label: 'Medium (50-60ml)'
        },
        '100ml': {
            enabled: opts.perfume?.['100ml']?.enabled !== false,
            price: perfume100mlPrice,
            mrp: perfume100mlMrpInfo.mrp,
            discount: perfume100mlMrpInfo.discount,
            sizeName: 'Large',
            ml: '100ml',
            label: 'Large (100ml)'
        }
    };

    const activeAttarVariants = Object.values(attarOptions).filter(o => o.enabled);
    const activePerfumeVariants = Object.values(perfumeOptions).filter(o => o.enabled);

    const attarMinPrice = activeAttarVariants.length > 0 ? Math.min(...activeAttarVariants.map(v => v.price)) : 199;
    const attarMinVariant = activeAttarVariants.find(v => v.price === attarMinPrice) || attarOptions['3ml'];
    const attarMinMrp = attarMinVariant.mrp;
    const attarMaxDiscount = attarMinVariant.discount;

    const perfumeMinPrice = activePerfumeVariants.length > 0 ? Math.min(...activePerfumeVariants.map(v => v.price)) : 299;
    const perfumeMinVariant = activePerfumeVariants.find(v => v.price === perfumeMinPrice) || perfumeOptions['10-15ml'];
    const perfumeMinMrp = perfumeMinVariant.mrp;
    const perfumeMaxDiscount = perfumeMinVariant.discount;

    const overallMinPrice = Math.min(attarMinPrice, perfumeMinPrice);
    const overallMinVariant = attarMinPrice <= perfumeMinPrice ? attarMinVariant : perfumeMinVariant;
    const overallMinMrp = overallMinVariant.mrp;
    const overallMaxDiscount = overallMinVariant.discount;

    return {
        attar: {
            minPrice: attarMinPrice,
            minMrp: attarMinMrp,
            maxDiscount: attarMaxDiscount,
            options: attarOptions,
            enabled: attarEnabled
        },
        perfume: {
            minPrice: perfumeMinPrice,
            minMrp: perfumeMinMrp,
            maxDiscount: perfumeMaxDiscount,
            options: perfumeOptions,
            enabled: perfumeEnabled
        },
        overallMinPrice,
        overallMinMrp,
        overallMaxDiscount
    };
}
