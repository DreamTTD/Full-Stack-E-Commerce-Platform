import { useEffect, useState } from 'react';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [msg, setMsg] = useState('');

  async function load() {
    const [p, c] = await Promise.all([api('/api/products'), api('/api/cart')]);
    setProducts(p.products);
    setCart(c.items || {});
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function add(id) {
    await api('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId: id }) });
    await load();
  }

  async function checkout() {
    setMsg('');
    const r = await api('/api/checkout', { method: 'POST', body: '{}' });
    setMsg(r.message);
    await load();
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <img src="/assets/images/project-3.jpg" alt="" style={heroImg} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <img key={n} src={`/assets/images/logo-${n}-color.png`} alt="" style={{ height: 28, opacity: 0.9 }} />
        ))}
      </div>
      <h1 style={{ fontSize: 22 }}>Store (demo)</h1>
      <p style={{ color: '#9ca3af' }}>Session cart + mock Stripe checkout — no real charges.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginTop: 24 }}>
        <div>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                marginBottom: 12,
                background: '#161b26',
                borderRadius: 12,
                border: '1px solid #252a3a',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: '#9ca3af', fontSize: 14 }}>{p.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>${p.price.toFixed(2)}</div>
                <button
                  type="button"
                  onClick={() => add(p.id)}
                  style={{
                    marginTop: 8,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#fbbf24',
                    color: '#111',
                    fontWeight: 600,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
        <aside style={{ background: '#161b26', borderRadius: 12, padding: 16, border: '1px solid #252a3a', height: 'fit-content' }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Cart</h2>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>Items: {cartCount}</p>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Total: ${total.toFixed(2)}</p>
          <button
            type="button"
            disabled={cartCount === 0}
            onClick={checkout}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              border: 'none',
              background: cartCount ? '#22c55e' : '#374151',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Mock checkout
          </button>
          {msg && <p style={{ color: '#86efac', marginTop: 12, fontSize: 14 }}>{msg}</p>}
        </aside>
      </div>
    </div>
  );
}

const heroImg = {
  width: '100%',
  maxHeight: 200,
  objectFit: 'cover',
  borderRadius: 12,
  marginBottom: 12,
  border: '1px solid #374151',
};
