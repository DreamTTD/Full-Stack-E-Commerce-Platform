# E-Commerce Mobile Platform

This project for a mobile-first commerce platform built with Flutter and Node.js.

## What It Includes

- Flutter shopping app with product search, cart totals, checkout, and order confirmation.
- Node.js API for products, checkout quotes, payment intent simulation, orders, and admin data.
- Static admin dashboard for product inventory, revenue, and order monitoring.
- PostgreSQL and Stripe-ready configuration points for a production implementation.

## Tech Stack

Flutter, Dart, Node.js, Express, PostgreSQL, Stripe-ready checkout flow.

## Run The Backend

```bash
cd backend
npm run dev
```

API: `http://localhost:3000`

Admin dashboard: `http://localhost:3000/admin`

## Run The Mobile App

```bash
cd mobile
flutter pub get
flutter run
```

For Android emulator networking, the app defaults to `http://10.0.2.2:3000`. For web or desktop, update `apiBaseUrl` in `mobile/lib/services/api_service.dart` to `http://localhost:3000`.

## API Highlights

- `GET /products?search=phone`
- `POST /checkout/quote`
- `POST /payments/intent`
- `POST /orders`
- `GET /orders`
- `GET /admin/summary`

## Scope

Payments are simulated with Stripe-style payment intent data unless `STRIPE_SECRET_KEY` is provided. Product and order data are stored in memory for quick portfolio demos; `docker-compose.yml` provides a PostgreSQL service for extending the project into persistent storage.
