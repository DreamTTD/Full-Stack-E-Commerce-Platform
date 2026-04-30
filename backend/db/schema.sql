create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10, 2) not null,
  rating numeric(2, 1) not null default 4.5,
  stock integer not null default 0,
  image text,
  description text
);

create table if not exists orders (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  customer_address text not null,
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null,
  total numeric(10, 2) not null,
  status text not null,
  payment_status text not null,
  payment_intent_id text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id bigserial primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  quantity integer not null,
  price numeric(10, 2) not null
);
