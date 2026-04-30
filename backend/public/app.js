const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function renderProducts(products) {
  const grid = document.querySelector('#productsGrid');
  grid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-meta">
              <span>${money.format(product.price)}</span>
              <span class="${product.stock < 20 ? 'low' : ''}">${product.stock} in stock</span>
            </div>
          </div>
        </article>
      `,
    )
    .join('');
}

function renderOrders(orders) {
  const table = document.querySelector('#ordersTable');
  table.innerHTML = orders
    .map(
      (order) => `
        <tr>
          <td>${order.id}</td>
          <td>${order.customer.name}</td>
          <td>${money.format(order.total)}</td>
          <td>${order.status}</td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
      `,
    )
    .join('');
}

async function loadDashboard() {
  const [summary, products, orders] = await Promise.all([
    getJson('/admin/summary'),
    getJson('/products'),
    getJson('/orders'),
  ]);

  document.querySelector('#revenue').textContent = money.format(summary.data.revenue);
  document.querySelector('#ordersCount').textContent = summary.data.orders;
  document.querySelector('#productsCount').textContent = summary.data.products;
  document.querySelector('#lowStock').textContent = summary.data.lowStock;

  renderProducts(products.data);
  renderOrders(orders.data);
}

document.querySelector('#refresh').addEventListener('click', loadDashboard);
loadDashboard().catch((error) => {
  document.body.insertAdjacentHTML('beforeend', `<p class="error">${error.message}</p>`);
});
