import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'aditya-abe51';
const BASE_URL = 'https://aadityasaura.com';
const SITEMAP_PATH = path.join(__dirname, 'public', 'sitemap.xml');

const staticRoutes = [
    '',
    '/collections',
    '/about',
    '/gallery',
    '/contact',
    '/login'
];

async function fetchProducts() {
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products?pageSize=1000`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.documents) return [];

        return data.documents.map(doc => {
            const parts = doc.name.split('/');
            return parts[parts.length - 1];
        });
    } catch (err) {
        console.error("Error fetching products:", err);
        return [];
    }
}

async function generateSitemap() {
    console.log("Generating sitemap...");

    let urls = [...staticRoutes];

    const productIds = await fetchProducts();
    productIds.forEach(id => {
        urls.push(`/product/${id}`);
    });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${url === '' ? '1.0' : url.startsWith('/product/') ? '0.8' : '0.9'}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`Sitemap successfully generated at ${SITEMAP_PATH} with ${urls.length} URLs.`);
}

generateSitemap();
