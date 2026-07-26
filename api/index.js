import express from 'express';
import cors from 'cors';
import handler from './create-order.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-order', (req, res) => {
  handler(req, res);
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Local dev server running on port ${PORT}`);
  });
}

export default app;
