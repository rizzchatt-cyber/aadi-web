import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    return res.redirect(302, '/logo.png');
  }

  try {
    // Fetch sized thumbnail from Google user content CDN (s250 = ~150KB, optimal for WhatsApp < 300KB)
    const targetUrl = `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=s250`;
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`Google CDN returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Cache on Edge for 7 days
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error(`[Image Proxy] Error serving image for ${id}:`, err);
    return res.redirect(302, '/logo.png');
  }
}
