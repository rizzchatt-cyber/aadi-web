import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'aditya-abe51';
const BASE_URL = 'https://aadityasaura.com';
const SITEMAP_PATH = path.join(__dirname, 'public', 'sitemap.xml');
const GOOGLE_MERCHANT_PATH = path.join(__dirname, 'public', 'google-merchant-feed.xml');
const GOOGLE_SHOPPING_PATH = path.join(__dirname, 'public', 'google-shopping-feed.xml');

const staticRoutes = [
    { url: '', priority: '1.0', changefreq: 'daily', name: 'Home' },
    { url: '/collections', priority: '0.9', changefreq: 'daily', name: 'Collections' },
    { url: '/about', priority: '0.7', changefreq: 'monthly', name: 'About Us' },
    { url: '/gallery', priority: '0.8', changefreq: 'weekly', name: 'Gallery' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly', name: 'Contact Us' },
    { url: '/login', priority: '0.4', changefreq: 'monthly', name: 'Customer Login' }
];

function xmlEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function cleanImageUrl(url) {
    if (!url) return '';
    try {
        let clean = url;
        if (clean.includes('wsrv.nl')) {
            const uObj = new URL(clean);
            const nested = uObj.searchParams.get('url');
            if (nested) clean = nested;
        }

        const uObj = new URL(clean);
        let fileId = null;

        if (uObj.hostname === 'lh3.googleusercontent.com' && uObj.pathname.startsWith('/d/')) {
            const raw = uObj.pathname.replace('/d/', '');
            fileId = raw.split('=')[0];
        } else if (uObj.hostname === 'drive.google.com' && uObj.pathname.includes('/thumbnail')) {
            fileId = uObj.searchParams.get('id');
        } else if (uObj.searchParams.has('id')) {
            fileId = uObj.searchParams.get('id');
        } else if (uObj.pathname.includes('/file/d/')) {
            const parts = uObj.pathname.split('/');
            const dIdx = parts.indexOf('d');
            if (dIdx !== -1 && parts.length > dIdx + 1) {
                fileId = parts[dIdx + 1];
            }
        }

        if (fileId) {
            return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
        }
        return clean;
    } catch (e) {
        return url;
    }
}

function parseFirestoreValue(val) {
    if (!val) return null;
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
    if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.arrayValue) {
        return (val.arrayValue.values || []).map(parseFirestoreValue).filter(Boolean);
    }
    if (val.mapValue) {
        const obj = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
            obj[k] = parseFirestoreValue(v);
        }
        return obj;
    }
    return null;
}

async function fetchAllProducts() {
    const products = [];
    let pageToken = '';
    try {
        do {
            let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products?pageSize=300`;
            if (pageToken) {
                url += `&pageToken=${pageToken}`;
            }
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Firestore fetch error: ${res.status} ${res.statusText}`);
                break;
            }
            const data = await res.json();
            if (data.documents) {
                for (const doc of data.documents) {
                    const parts = doc.name.split('/');
                    const id = parts[parts.length - 1];
                    const fields = doc.fields || {};

                    const parsedDoc = {};
                    for (const [key, val] of Object.entries(fields)) {
                        parsedDoc[key] = parseFirestoreValue(val);
                    }

                    let rawImages = parsedDoc.images || [];
                    if (!Array.isArray(rawImages)) {
                        rawImages = typeof rawImages === 'string' ? [rawImages] : [];
                    }
                    if (parsedDoc.image && !rawImages.includes(parsedDoc.image)) {
                        rawImages.unshift(parsedDoc.image);
                    }

                    const cleanedImages = rawImages.map(cleanImageUrl).filter(Boolean);

                    products.push({
                        id,
                        title: parsedDoc.title || 'Exquisite Masterpiece',
                        description: parsedDoc.description || 'Handcrafted luxury jewelry and fragrance from Aaditya Aura.',
                        price: typeof parsedDoc.price === 'number' ? parsedDoc.price : 0,
                        priceOnRequest: Boolean(parsedDoc.priceOnRequest),
                        discount: typeof parsedDoc.discount === 'number' ? parsedDoc.discount : 0,
                        material: parsedDoc.material || 'Gold & Silver',
                        gender: parsedDoc.gender || 'unisex',
                        weight: parsedDoc.weight || '',
                        hallmarkInfo: parsedDoc.hallmarkInfo || '',
                        images: cleanedImages,
                        updatedAt: parsedDoc.updatedAt || doc.updateTime || new Date().toISOString(),
                        createdAt: parsedDoc.createdAt || doc.createTime || new Date().toISOString()
                    });
                }
            }
            pageToken = data.nextPageToken || '';
        } while (pageToken);

        return products;
    } catch (err) {
        console.error("Error fetching products for sitemap:", err);
        return products;
    }
}

function getGoogleProductCategory(product) {
    const title = (product.title || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    const mat = (product.material || '').toLowerCase();

    if (title.includes('perfume') || title.includes('attar') || title.includes('fragrance') || desc.includes('attar') || desc.includes('perfume')) {
        return 'Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Perfumes &amp; Colognes';
    }
    if (title.includes('ring')) return 'Apparel &amp; Accessories &gt; Jewelry &gt; Rings';
    if (title.includes('chain') || title.includes('necklace') || title.includes('har')) return 'Apparel &amp; Accessories &gt; Jewelry &gt; Necklaces';
    if (title.includes('bracelet') || title.includes('bangle') || title.includes('kada')) return 'Apparel &amp; Accessories &gt; Jewelry &gt; Bracelets';
    if (title.includes('earring') || title.includes('jhumka')) return 'Apparel &amp; Accessories &gt; Jewelry &gt; Earrings';
    return 'Apparel &amp; Accessories &gt; Jewelry';
}

async function generateSitemapAndFeed() {
    console.log("Fetching product details from Firestore...");
    const products = await fetchAllProducts();
    console.log(`Loaded ${products.length} products with full metadata & images.`);

    const todayStr = new Date().toISOString().split('T')[0];

    // ==========================================
    // 1. GENERATE GOOGLE IMAGE SITEMAP (sitemap.xml)
    // ==========================================
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Static Main Routes -->
`;

    for (const route of staticRoutes) {
        sitemapXml += `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>\n`;
    }

    sitemapXml += `\n  <!-- Product Pages with Product Images -->\n`;

    for (const p of products) {
        const prodUrl = `${BASE_URL}/product/${p.id}`;
        const modDate = p.updatedAt ? p.updatedAt.split('T')[0] : todayStr;
        const escTitle = xmlEscape(p.title);
        const escDesc = xmlEscape(p.description.substring(0, 160));

        sitemapXml += `  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${modDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>\n`;

        if (p.images && p.images.length > 0) {
            for (let idx = 0; idx < p.images.length; idx++) {
                const img = cleanImageUrl(p.images[idx]);
                const imgTitle = p.images.length > 1 ? `${escTitle} - Image ${idx + 1}` : escTitle;
                sitemapXml += `    <image:image>
      <image:loc>${xmlEscape(img)}</image:loc>
      <image:title>${imgTitle}</image:title>
      <image:caption>${escDesc}</image:caption>
    </image:image>\n`;
            }
        }

        sitemapXml += `  </url>\n`;
    }

    sitemapXml += `</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, sitemapXml);
    console.log(`✅ XML Sitemap generated successfully at ${SITEMAP_PATH} with ${staticRoutes.length + products.length} pages.`);

    // ==========================================
    // 2. GENERATE GOOGLE MERCHANT / STORE FEED (google-merchant-feed.xml)
    // ==========================================
    let merchantXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Aaditya's Aura - Pure Luxury Jewelry &amp; Perfumes</title>
    <link>${BASE_URL}</link>
    <description>Official Google Merchant Center Product Feed for Aaditya's Aura luxury handcrafted jewelry, 1g gold bangles, silver chains, and authentic perfumes.</description>
`;

    for (const p of products) {
        const prodUrl = `${BASE_URL}/product/${p.id}`;
        const escTitle = xmlEscape(p.title);
        const escDesc = xmlEscape(p.description);
        const category = getGoogleProductCategory(p);
        const primaryImage = p.images[0] ? cleanImageUrl(p.images[0]) : '';
        const priceStr = p.priceOnRequest || p.price <= 0 ? '0.00 INR' : `${p.price.toFixed(2)} INR`;

        merchantXml += `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${escTitle}</g:title>
      <g:description>${escDesc}</g:description>
      <g:link>${prodUrl}</g:link>\n`;

        if (primaryImage) {
            merchantXml += `      <g:image_link>${xmlEscape(primaryImage)}</g:image_link>\n`;
        }

        if (p.images.length > 1) {
            for (let i = 1; i < Math.min(p.images.length, 10); i++) {
                merchantXml += `      <g:additional_image_link>${xmlEscape(cleanImageUrl(p.images[i]))}</g:additional_image_link>\n`;
            }
        }

        merchantXml += `      <g:price>${priceStr}</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Aaditya's Aura</g:brand>
      <g:google_product_category>${category}</g:google_product_category>
      <g:gender>${xmlEscape(p.gender)}</g:gender>
      <g:material>${xmlEscape(p.material)}</g:material>
      <g:identifier_exists>no</g:identifier_exists>
    </item>\n`;
    }

    merchantXml += `  </channel>
</rss>`;

    fs.writeFileSync(GOOGLE_MERCHANT_PATH, merchantXml);
    fs.writeFileSync(GOOGLE_SHOPPING_PATH, merchantXml);
    console.log(`✅ Google Store / Merchant Center feed generated successfully at ${GOOGLE_MERCHANT_PATH}`);
}

generateSitemapAndFeed();
