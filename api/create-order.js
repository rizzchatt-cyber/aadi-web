import RazorpayConstructor from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const Razorpay = RazorpayConstructor.default || RazorpayConstructor;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[Payment Service] Received request to create order.');

  // Validate request body
  const { amount, description } = req.body;
  if (amount === undefined || amount === null) {
    console.error('[Payment Service] Missing amount in request body.');
    return res.status(400).json({ error: 'Amount is required' });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount < 1) {
    console.error(`[Payment Service] Invalid amount value: ${amount}`);
    return res.status(400).json({ error: 'Valid amount (minimum 1 INR) is required' });
  }

  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_THg1fulHeUhhxD';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mgXfP1UWOSkiKJMy9RUUe39p';

  // Safe server-side configuration logging
  console.log(`[Payment Service] Key ID configured: ${key_id ? 'Yes (' + key_id.substring(0, 8) + '...)' : 'No'}`);
  console.log(`[Payment Service] Key Secret configured: ${key_secret ? 'Yes (length: ' + key_secret.length + ')' : 'No'}`);

  if (!key_secret) {
    console.error('[Payment Service] RAZORPAY_KEY_SECRET is missing from environment variables.');
    return res.status(500).json({ 
      error: 'Razorpay Secret Key (RAZORPAY_KEY_SECRET) is missing in server environment variables. Please configure it in your Vercel settings.' 
    });
  }

  if (key_secret === key_id || key_secret.startsWith('rzp_')) {
    console.error('[Payment Service] RAZORPAY_KEY_SECRET is invalid (matches Key ID or starts with rzp_).');
    return res.status(500).json({
      error: 'Razorpay Secret Key (RAZORPAY_KEY_SECRET) is misconfigured: it matches the Key ID or starts with the "rzp_" prefix. Please set the correct Secret Key from your Razorpay Dashboard.'
    });
  }

  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: Math.round(parsedAmount * 100), // convert to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        description: description || 'Aaditya Aura Purchase'
      }
    });

    console.log(`[Payment Service] Order created successfully: ${order.id}`);
    return res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.error('[Payment Service] Razorpay orders.create failed:', error);
    const errorMessage = error.error?.description || error.description || error.message || 'Unknown error';
    return res.status(500).json({ 
      error: `Razorpay Order Creation Failed: ${errorMessage}` 
    });
  }
}

