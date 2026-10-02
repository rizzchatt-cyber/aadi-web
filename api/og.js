const PROJECT_ID = 'aditya-abe51';
const DEFAULT_ORIGIN = 'https://aadityasaura.com';
const DEFAULT_LOGO = 'https://aadityasaura.com/logo.png';

function extractFileId(url) {
  if (!url) return null;
  try {
    let clean = url;
    if (clean.includes('wsrv.nl')) {
      const uObj = new URL(clean);
      const nested = uObj.searchParams.get('url');
      if (nested) clean = nested;
    }

    const uObj = new URL(clean);
    if (uObj.hostname === 'lh3.googleusercontent.com' && uObj.pathname.startsWith('/d/')) {
      const raw = uObj.pathname.replace('/d/', '');
      return raw.split('=')[0];
    } else if (uObj.hostname === 'drive.google.com' && uObj.pathname.includes('/thumbnail')) {
      return uObj.searchParams.get('id');
    } else if (uObj.searchParams.has('id')) {
      return uObj.searchParams.get('id');
    } else if (uObj.pathname.includes('/file/d/')) {
      const parts = uObj.pathname.split('/');
      const dIdx = parts.indexOf('d');
      if (dIdx !== -1 && parts.length > dIdx + 1) {
        return parts[dIdx + 1];
      }
    }
  } catch (e) {}
  return null;
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const id = req.query?.id || req.query?.productId || req.params?.id || '';

  // Host and origin determination
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host || 'aadityasaura.com';
  const protocol = req.headers?.['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

  if (!id) {
    const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aaditya’s Aura | Pure Luxury Jewellery, Attar &amp; Perfume</title>
  <meta name="description" content="Aaditya’s Aura - Pure Luxury Jewellery, Attar, and Perfume. Crafting pieces that transcend time.">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Aaditya's Aura">
  <meta property="og:title" content="Aaditya’s Aura | Pure Luxury Jewellery, Attar &amp; Perfume">
  <meta property="og:description" content="Pure Luxury Jewellery, Attar, and Perfume. Crafting pieces that transcend time.">
  <meta property="og:image" content="${DEFAULT_LOGO}">
  <meta property="og:image:secure_url" content="${DEFAULT_LOGO}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="300">
  <meta property="og:image:height" content="300">
  <meta property="og:url" content="${origin}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${DEFAULT_LOGO}">
  <meta http-equiv="refresh" content="0;url=/">
  <script>window.location.replace("/");</script>
</head>
<body>
  <h1>Aaditya’s Aura</h1>
  <p>Pure Luxury Jewellery, Attar &amp; Perfume</p>
  <a href="/">Enter Store</a>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(defaultHtml);
  }

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products/${encodeURIComponent(id)}`;
    let response = await fetch(firestoreUrl);
    let docData = null;

    if (response.ok) {
      docData = await response.json();
    } else {
      // Case-insensitive fallback for IDs
      const listRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products?pageSize=300`);
      if (listRes.ok) {
        const listJson = await listRes.json();
        const found = (listJson.documents || []).find((d) => {
          const dId = d.name.split('/').pop();
          return dId.toLowerCase() === id.toLowerCase();
        });
        if (found) {
          docData = found;
        }
      }
    }

    if (!docData) {
      throw new Error(`Product not found (${id})`);
    }

    const fields = docData.fields || {};
    const product = {};
    for (const [k, v] of Object.entries(fields)) {
      product[k] = parseFirestoreValue(v);
    }

    // Extract images list
    let rawImages = product.images || [];
    if (!Array.isArray(rawImages)) {
      rawImages = typeof rawImages === 'string' ? [rawImages] : [];
    }
    if (product.image && !rawImages.includes(product.image)) {
      rawImages.unshift(product.image);
    }

    const primaryImageRaw = rawImages[0] || '';
    const fileId = extractFileId(primaryImageRaw);

    // Primary image for WhatsApp: MUST be strictly under 300KB!
    // We provide our same-origin edge endpoint and direct Google thumbnail with extension
    let primaryImageUrl = DEFAULT_LOGO;
    let directCdnImageUrl = DEFAULT_LOGO;

    if (fileId) {
      primaryImageUrl = `${origin}/api/img?id=${fileId}&ext=.png`;
      directCdnImageUrl = `https://lh3.googleusercontent.com/d/${fileId}=s250?.png`;
    } else if (primaryImageRaw && primaryImageRaw.startsWith('http')) {
      primaryImageUrl = primaryImageRaw;
      directCdnImageUrl = primaryImageRaw;
    }

    // Pricing
    let priceText = '';
    if (product.priceOnRequest) {
      priceText = 'Price on Request';
    } else if (product.price) {
      priceText = `₹${Number(product.price).toLocaleString('en-IN')}`;
    }

    // Meta title & description
    const rawTitle = product.title || "Aaditya's Aura Masterpiece";
    const pageTitle = `${rawTitle} | Aaditya's Aura`;

    let pageDescription = product.description
      ? String(product.description).replace(/\s+/g, ' ').trim().slice(0, 180)
      : '';
    if (priceText) {
      pageDescription = pageDescription
        ? `${priceText} • ${pageDescription}`
        : `${priceText} - Handcrafted luxury jewellery, pure attar & exquisite perfumes by Aaditya's Aura.`;
    } else if (!pageDescription) {
      pageDescription = "Exquisite luxury jewellery, pure attar & perfumes by Aaditya's Aura. Handcrafted with unparalleled trust and timeless purity.";
    }

    const productUrl = `${origin}/product/${encodeURIComponent(id)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDescription)}">

  <!-- Open Graph / WhatsApp / Facebook / Instagram / iMessage -->
  <meta property="og:site_name" content="Aaditya's Aura">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDescription)}">
  <meta property="og:url" content="${escapeHtml(productUrl)}">
  
  <!-- Primary Image (< 300KB for WhatsApp link preview thumbnail) -->
  <meta property="og:image" content="${escapeHtml(primaryImageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(primaryImageUrl)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="300">
  <meta property="og:image:height" content="300">
  <meta property="og:image:alt" content="${escapeHtml(rawTitle)}">

  <!-- Fallback Direct CDN Image (< 300KB) -->
  <meta property="og:image" content="${escapeHtml(directCdnImageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(directCdnImageUrl)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="300">
  <meta property="og:image:height" content="300">

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@aadityasaura">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
  <meta name="twitter:image" content="${escapeHtml(primaryImageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(rawTitle)}">

  <!-- Standard Link / Image references -->
  <link rel="image_src" href="${escapeHtml(primaryImageUrl)}">
  <link rel="canonical" href="${escapeHtml(productUrl)}">

  <!-- Instant Client Redirect for Real Browsers -->
  <meta http-equiv="refresh" content="0;url=/product/${encodeURIComponent(id)}">
  <script>
    if (window.location.pathname.startsWith('/api/')) {
      window.location.replace("/product/${encodeURIComponent(id)}");
    }
  </script>

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0d0d0d;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      max-width: 440px;
      background: #171717;
      border: 1px solid rgba(191,149,63,0.3);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    img {
      width: 100%;
      height: 320px;
      object-fit: contain;
      border-radius: 14px;
      background: #000;
      margin-bottom: 16px;
    }
    h1 { font-size: 1.25rem; margin: 0 0 8px 0; color: #fff; }
    p { font-size: 0.9rem; color: #b0b0b0; margin: 0 0 16px 0; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728, #FBF5B7);
      color: #000;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${escapeHtml(primaryImageUrl)}" alt="${escapeHtml(rawTitle)}">
    <h1>${escapeHtml(rawTitle)}</h1>
    <p>${escapeHtml(pageDescription)}</p>
    <a href="/product/${encodeURIComponent(id)}" class="btn">View on Aaditya's Aura</a>
  </div>
</body>
</html>`;

    // Cache on Edge / CDN for 1 hour, stale-while-revalidate for 1 day
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (err) {
    console.error(`[OG Generator] Error fetching product ${id}:`, err);
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aaditya’s Aura | Pure Luxury</title>
  <meta property="og:title" content="Aaditya’s Aura | Pure Luxury">
  <meta property="og:description" content="Discover pure luxury jewellery, attar &amp; perfume at Aaditya’s Aura.">
  <meta property="og:image" content="${DEFAULT_LOGO}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:url" content="${origin}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${DEFAULT_LOGO}">
  <meta http-equiv="refresh" content="0;url=/product/${encodeURIComponent(id)}">
  <script>window.location.replace("/product/${encodeURIComponent(id)}");</script>
</head>
<body>
  <h1>Aaditya’s Aura</h1>
  <a href="/product/${encodeURIComponent(id)}">View Product</a>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(fallbackHtml);
  }
}
