---
id: web-dashboard
wave: ezviz-senegal-wave-3
title: "Web Dashboard"
status: in_progress
depends_on: [08-orders-module, 10-stock-module]
source_files:
  - apps/web/src/App.tsx
  - apps/web/src/api.ts
  - apps/web/src/main.tsx
  - apps/web/src/pages/OrdersPage.tsx
  - apps/web/src/pages/StockPage.tsx
  - apps/web/src/components/StatusBadge.tsx
  - apps/web/package.json
  - apps/web/vite.config.ts
created: 2026-05-20
last_synced: 2026-05-21
tags: [dashboard, vite, react, orders, stock, tanstack-query, web, typescript]
path: Dashboard/Web
known_issues: []
---

## Purpose

A minimal web interface for EZVIZ Sénégal managers to monitor orders and stock in real time without needing the mobile app. Runs as a separate Vite + React app in the monorepo.

## Scope

Two pages only:

1. **Orders page** — full table of all orders (no pagination — all orders loaded at once), filterable by status. Shows reference (last 8 chars of ID), client name, total in CFA francs, payment method, status badge, date. Status filter buttons: Toutes / En attente / Payées / Annulées.
2. **Stock page** — table of stock items with low-stock highlighting. Shows product name, type, SKU, qty, unit price, stock state (⚠ Stock bas / ✓ OK). Low-stock threshold: `qty <= minQty`.

No authentication for Wave 3 (reads are from the same JWT API — the web app will store a pre-issued admin token in `.env.local`). Auth will be added in a later wave.

> **Pagination not yet implemented.** The doc originally said "paginated table" — the current implementation loads all records. Pagination is deferred to a later iteration.

## Tech Stack

- **Vite + React 18 + TypeScript**
- **TanStack Query v5** for data fetching (`staleTime: 10s`, `retry: 1`)
- **Axios** for HTTP (same pattern as mobile)
- Inline CSS-in-JS via `style` props (no extra CSS framework — keep it minimal)
- Dark theme: background `#16213e`, accent `#00e5cc`, all UI strings in French

## File Structure

```
apps/web/
  index.html
  vite.config.ts          (Vite config, dev server port 5173)
  tsconfig.json
  package.json            (@ezviz/web, v0.1.0)
  src/
    main.tsx              (QueryClient setup: staleTime 10s, retry 1)
    App.tsx               (tab shell: Commandes / Stock)
    api.ts                (axios instance, reads VITE_API_URL + VITE_API_TOKEN)
    pages/
      OrdersPage.tsx
      StockPage.tsx
    components/
      StatusBadge.tsx
```

## Data Models

### Order

```ts
interface Order {
  id: string;
  total: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod?: 'WAVE' | 'ORANGE_MONEY' | 'CASH';
  createdAt: string;           // ISO date string
  client?: { name: string; phone?: string };
}
```

### StockItem

```ts
interface StockItem {
  id: string;
  productName: string;
  productType?: string;
  sku?: string;
  qty: number;
  minQty: number;              // low-stock threshold
  unitPrice: number;
}
```

### StatusBadge mapping

| status     | label       | color   |
|------------|-------------|---------|
| PENDING    | En attente  | #f59e0b |
| PAID       | Payée       | #10b981 |
| CANCELLED  | Annulée     | #ef4444 |

## API Endpoints Used

- `GET /api/v1/orders?status=<PENDING|PAID|CANCELLED>` — list orders (status param optional)
- `GET /api/v1/stock` — list all stock items

### Environment variables

| Variable        | Default                         | Purpose                       |
|-----------------|---------------------------------|-------------------------------|
| VITE_API_URL    | `http://localhost:3000/api/v1`  | Backend base URL              |
| VITE_API_TOKEN  | `''` (empty)                    | Bearer token (pre-issued JWT) |

Token is only added to `Authorization` header if `VITE_API_TOKEN` is non-empty.

## Behaviour Details

- **Orders refetch interval:** 15 seconds
- **Stock refetch interval:** 30 seconds
- **Low-stock highlight:** row background `#f59e0b08`, qty text `#f59e0b` when `qty <= minQty`
- **Payment method labels:** WAVE → "🌊 Wave", ORANGE_MONEY → "🟠 Orange Money", CASH → "💵 Espèces"
- **Order reference display:** last 8 chars of `id`, uppercased, prefixed with `#`
- **Total formatting:** `toLocaleString('fr-FR')` + " F" (CFA francs)

## Demo State

"Manager opens web browser → sees live orders with status badges → filters by 'Payées' → switches to Stock tab → sees low-stock items highlighted in orange"

## Out of Scope

- Login / auth UI
- Order creation or editing from web
- Real-time WebSocket updates (uses polling via React Query `refetchInterval`)
- Charts / analytics
- Pagination (deferred to later wave)
