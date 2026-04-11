import cors from 'cors';
import express from 'express';
import session from 'express-session';

const app = express();
const PORT = 3001;

const products = [
  { id: 'p1', name: 'Starter kit', description: 'API + dashboard template', price: 49 },
  { id: 'p2', name: 'Pro license', description: 'Full source + updates', price: 199 },
  { id: 'p3', name: 'Team pack', description: '5 seats', price: 499 },
];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    name: 'eco.sid',
    secret: 'demo-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 86400000 },
  })
);

function cart(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}

app.get('/api/products', (req, res) => {
  res.json({ products });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: cart(req) });
});

app.post('/api/cart/add', (req, res) => {
  const { productId } = req.body || {};
  const p = products.find((x) => x.id === productId);
  if (!p) return res.status(400).json({ error: 'Unknown product' });
  const c = cart(req);
  c[productId] = (c[productId] || 0) + 1;
  res.json({ items: c });
});

app.post('/api/checkout', (req, res) => {
  const c = cart(req);
  const n = Object.values(c).reduce((a, b) => a + b, 0);
  if (n === 0) return res.status(400).json({ error: 'Cart empty' });
  req.session.cart = {};
  res.json({
    ok: true,
    message: 'Mock Stripe checkout succeeded — order recorded for demo (no real charge).',
  });
});

app.listen(PORT, () => {
  console.log(`[03-ecommerce] API http://localhost:${PORT}`);
});
