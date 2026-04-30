const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const products = [
  {
    id: 'phone-pro',
    name: 'Nova X Pro',
    category: 'Phones',
    price: 799,
    rating: 4.8,
    stock: 22,
    image:
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
    description: 'Flagship mobile phone with OLED display, fast charging, and a 50MP camera.',
  },
  {
    id: 'buds-air',
    name: 'Pulse Air Buds',
    category: 'Audio',
    price: 129,
    rating: 4.6,
    stock: 48,
    image:
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80',
    description: 'Noise reducing wireless earbuds with 30 hour battery life.',
  },
  {
    id: 'watch-fit',
    name: 'Stride Watch',
    category: 'Wearables',
    price: 219,
    rating: 4.7,
    stock: 31,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    description: 'Fitness watch with health tracking, GPS, and water resistance.',
  },
  {
    id: 'tablet-lite',
    name: 'Canvas Tab Lite',
    category: 'Tablets',
    price: 349,
    rating: 4.5,
    stock: 17,
    image:
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    description: 'Lightweight tablet for shopping, streaming, sketching, and work.',
  },
];

const orders = [
  {
    id: 'ORD-1001',
    customer: {
      name: 'Avery Stone',
      email: 'avery@example.com',
      address: '18 Market Street, Cape Town',
    },
    items: [{ productId: 'phone-pro', quantity: 1 }],
    subtotal: 799,
    deliveryFee: 0,
    total: 799,
    status: 'paid',
    paymentStatus: 'succeeded',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

function money(value) {
  return Number(value.toFixed(2));
}

function getOrderTotals(items) {
  const detailedItems = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product) {
      const error = new Error(`Product ${item.productId} was not found.`);
      error.status = 404;
      throw error;
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (quantity > product.stock) {
      const error = new Error(`${product.name} only has ${product.stock} items in stock.`);
      error.status = 409;
      throw error;
    }

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      lineTotal: money(product.price * quantity),
    };
  });

  const subtotal = money(detailedItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 12;
  const total = money(subtotal + deliveryFee);

  return { items: detailedItems, subtotal, deliveryFee, total };
}

function createPaymentIntent(total) {
  return {
    id: `pi_demo_${crypto.randomUUID()}`,
    amount: Math.round(total * 100),
    currency: 'usd',
    status: 'requires_confirmation',
    clientSecret: `pi_demo_secret_${crypto.randomBytes(16).toString('hex')}`,
    provider: process.env.STRIPE_SECRET_KEY ? 'stripe-ready' : 'demo-simulator',
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
  };
  const extension = path.extname(filePath);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: 'File not found.' });
      return;
    }

    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(content);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        error.status = 400;
        error.message = 'Request body must be valid JSON.';
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function getProducts(searchParams) {
  const search = String(searchParams.get('search') || '').toLowerCase();
  const category = String(searchParams.get('category') || '').toLowerCase();

  const filtered = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);
    const matchesCategory = !category || product.category.toLowerCase() === category;

    return matchesSearch && matchesCategory;
  });

  return { data: filtered, count: filtered.length };
}

async function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'commerce-api', timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/products') {
    sendJson(res, 200, getProducts(url.searchParams));
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/products/')) {
    const id = decodeURIComponent(url.pathname.replace('/products/', ''));
    const product = products.find((candidate) => candidate.id === id);

    if (!product) {
      sendJson(res, 404, { error: 'Product not found.' });
      return;
    }

    sendJson(res, 200, { data: product });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/checkout/quote') {
    const body = await readBody(req);
    sendJson(res, 200, { data: getOrderTotals(body.items || []) });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/payments/intent') {
    const body = await readBody(req);
    const totals = getOrderTotals(body.items || []);

    sendJson(res, 201, { data: { paymentIntent: createPaymentIntent(totals.total), totals } });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/orders') {
    const body = await readBody(req);
    const { customer = {}, items = [], paymentIntentId } = body;
    const totals = getOrderTotals(items);

    if (!customer.name || !customer.email || !customer.address) {
      sendJson(res, 400, { error: 'Customer name, email, and address are required.' });
      return;
    }

    totals.items.forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      product.stock -= item.quantity;
    });

    const order = {
      id: `ORD-${1000 + orders.length + 1}`,
      customer,
      items: totals.items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      status: 'paid',
      paymentStatus: 'succeeded',
      paymentIntentId: paymentIntentId || createPaymentIntent(totals.total).id,
      createdAt: new Date().toISOString(),
    };

    orders.unshift(order);
    sendJson(res, 201, { data: order });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/orders') {
    sendJson(res, 200, { data: orders, count: orders.length });
    return;
  }

  if (req.method === 'PATCH' && url.pathname.startsWith('/orders/') && url.pathname.endsWith('/status')) {
    const orderId = decodeURIComponent(url.pathname.split('/')[2]);
    const order = orders.find((candidate) => candidate.id === orderId);

    if (!order) {
      sendJson(res, 404, { error: 'Order not found.' });
      return;
    }

    const body = await readBody(req);
    order.status = body.status || order.status;
    sendJson(res, 200, { data: order });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/admin/summary') {
    sendJson(res, 200, {
      data: {
        products: products.length,
        orders: orders.length,
        revenue: money(orders.reduce((sum, order) => sum + order.total, 0)),
        lowStock: products.filter((product) => product.stock < 20).length,
        conversionLift: '18%',
      },
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/admin/products') {
    const body = await readBody(req);
    const product = {
      id: body.id || crypto.randomUUID(),
      name: body.name,
      category: body.category || 'General',
      price: Number(body.price || 0),
      rating: Number(body.rating || 4.5),
      stock: Number(body.stock || 0),
      image: body.image || '',
      description: body.description || '',
    };

    products.push(product);
    sendJson(res, 201, { data: product });
    return;
  }

  sendJson(res, 404, { error: 'Route not found.' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'GET' && (url.pathname === '/admin' || url.pathname === '/admin/')) {
      sendFile(res, path.join(publicDir, 'admin.html'));
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/admin/')) {
      const relativePath = url.pathname.replace('/admin/', '');
      const filePath = path.normalize(path.join(publicDir, relativePath));

      if (!filePath.startsWith(publicDir)) {
        sendJson(res, 403, { error: 'Forbidden.' });
        return;
      }

      sendFile(res, filePath);
      return;
    }

    await handleApi(req, res, url);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || 'Unexpected server error.' });
  }
});

server.listen(port, () => {
  console.log(`Commerce API running on http://localhost:${port}`);
  console.log(`Admin dashboard running on http://localhost:${port}/admin`);
});
