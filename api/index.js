import express from 'express';
import cors from 'cors';
import handler from './create-order.js';
import ogHandler from './og.js';
import imgHandler from './img.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-order', (req, res) => {
  handler(req, res);
});

app.get('/api/og', (req, res) => {
  ogHandler(req, res);
});

app.get('/api/img', (req, res) => {
  imgHandler(req, res);
});

// Crawler detection for /product/:id in Express environment
const BOT_UA_REGEX = /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|slackbot|discordbot|applebot|linkedinbot|pinterest|bot|crawler|spider/i;

app.get('/product/:id', (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  if (BOT_UA_REGEX.test(userAgent)) {
    return ogHandler(req, res);
  }
  next();
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Local dev server running on port ${PORT}`);
  });
}

export default app;
