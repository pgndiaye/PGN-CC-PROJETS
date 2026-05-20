---
id: web-dashboard
wave: ezviz-senegal-wave-3
title: "Web Dashboard"
status: in_progress
depends_on: [08-orders-module, 10-stock-module]
created: 2026-05-20
hash: placeholder
---

## Purpose

A minimal web interface for EZVIZ Sénégal managers to monitor orders and stock in real time without needing the mobile app. Runs as a separate Vite + React app in the monorepo.

## Scope

Two pages only:

1. **Orders page** — paginated table of all orders, filterable by status. Shows client name, total, date, status badge, payment method.
2. **Stock page** — table of stock items with low-stock highlighting. Shows product name, SKU, qty in stock, unit price.

No authentication for Wave 3 (reads are from the same JWT API — the web app will store a pre-issued admin token in `.env.local`). Auth will be added in a later wave.

## Tech Stack

- **Vite + React 18 + TypeScript**
- **TanStack Query v5** for data fetching
- **Axios** for HTTP (same pattern as mobile)
- Inline CSS-in-JS via `style` props (no extra CSS framework — keep it minimal)

## File Structure

```
apps/web/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  src/
    main.tsx
    App.tsx
    api.ts           (axios instance, reads VITE_API_URL + VITE_API_TOKEN)
    pages/
      OrdersPage.tsx
      StockPage.tsx
    components/
      StatusBadge.tsx
```

## API Endpoints Used

- `GET /api/v1/orders` — list orders (query: `status?`)
- `GET /api/v1/stock`  — list stock items

## Demo State

"Manager opens web browser → sees live orders with status badges → switches to Stock tab → sees low-stock items highlighted in orange"

## Out of Scope

- Login / auth UI
- Order creation or editing from web
- Real-time WebSocket updates (uses polling via React Query `refetchInterval`)
- Charts / analytics
