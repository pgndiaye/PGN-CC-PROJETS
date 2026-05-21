---
id: 10-stock-module
wave: ezviz-senegal-wave-3
title: "Stock Module"
status: in_progress
depends_on: [08-orders-module]
source_files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/modules/stock/stock.module.ts
  - apps/backend/src/modules/stock/stock.service.ts
  - apps/backend/src/modules/stock/stock.controller.ts
  - apps/backend/src/modules/stock/stock.service.spec.ts
  - apps/backend/src/modules/stock/dto/create-stock-item.dto.ts
  - apps/backend/src/modules/stock/dto/update-stock-item.dto.ts
  - apps/backend/src/modules/stock/dto/adjust-stock.dto.ts
  - apps/mobile/src/hooks/useStock.ts
  - apps/mobile/src/screens/StockScreen.tsx
created: 2026-05-20
last_synced: 2026-05-21
tags: [stock, inventory, nestjs, prisma, react-native, decrement, orders, mobile]
path: Commerce/Stock
known_issues: []
---

## Purpose

Track EZVIZ product inventory. Stock is decremented automatically when an order is created. Admins can adjust stock levels and view history. Commercials see current stock to know what's available to sell.

## Domain Model

```prisma
model StockItem {
  id          String   @id @default(cuid())
  productName String
  productType String?
  sku         String?  @unique
  qty         Int      @default(0)
  minQty      Int      @default(0)   // low-stock threshold
  unitPrice   Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("stock_items")
}
```

No foreign key to Order — decrement is done as a best-effort side effect during order creation (product matched by productName). Stock can go negative (backorder allowed).

## API Routes (all under /api/v1/stock)

| Method | Path        | Auth       | Description                     |
|--------|-------------|------------|---------------------------------|
| GET    | /           | JWT (any)  | List all stock items (ordered by productName ASC) |
| GET    | /:id        | JWT (any)  | Get single item                 |
| POST   | /           | JWT ADMIN  | Create a stock item             |
| PATCH  | /:id        | JWT ADMIN  | Update qty / price / name       |
| DELETE | /:id        | JWT ADMIN  | Delete a stock item             |
| POST   | /:id/adjust | JWT ADMIN  | Adjust qty by delta (+/-)       |

## DTOs

### CreateStockItemDto

| Field       | Type    | Required | Validation        |
|-------------|---------|----------|-------------------|
| productName | string  | yes      | —                 |
| productType | string  | no       | —                 |
| sku         | string  | no       | —                 |
| qty         | integer | no       | @Min(0)           |
| minQty      | integer | no       | @Min(0)           |
| unitPrice   | number  | no       | @Min(0)           |

`UpdateStockItemDto` makes all fields optional with the same validations.

### AdjustStockDto

| Field  | Type    | Required | Notes                          |
|--------|---------|----------|--------------------------------|
| delta  | integer | yes      | Can be negative (decrement)    |
| reason | string  | no       | Freeform audit note            |

## Business Rules

- `qty` must be >= 0 at creation (`@Min(0)` validation on DTO)
- `adjust` endpoint uses Prisma `increment` — negative delta decrements; no floor enforced, so stock can go negative (backorder)
- `findOne` throws `NotFoundException` if item does not exist; used as pre-check before update, remove, and adjust
- **Low-stock flag is computed client-side** (not returned by the backend): the mobile hook (`useStock.ts`) appends `lowStock: item.qty <= item.minQty` to each item after fetching. The API itself returns raw `qty` and `minQty`.

## Integration with Orders

`OrdersService.create` calls `StockService.decrementByOrderLines(lines)` after the order transaction succeeds.

- `decrementByOrderLines` iterates each `{ productName, qty }` line sequentially (not in a single transaction)
- Lookup is case-insensitive on `productName` — uses `{ mode: 'insensitive' }` in Prisma
- Fire-and-forget: no throw on missing match — stock decrement failure does not block order creation
- **StockModule exports StockService** — required for `OrdersModule` to inject it via `imports: [StockModule]`

## Mobile Screens

- **StockScreen** — FlatList of stock items with:
  - Live search by `productName`, `productType`, or `sku` (case-insensitive)
  - Low-stock highlight: card border `#f59e0b`, qty text amber, "⚠ Bas" badge
  - No create/delete/adjust from mobile (admin-only operations via API only)

## Backend Files

```
apps/backend/src/modules/stock/
  dto/
    create-stock-item.dto.ts
    update-stock-item.dto.ts
    adjust-stock.dto.ts
  stock.service.ts          (CRUD + decrementByOrderLines)
  stock.service.spec.ts     (unit tests)
  stock.controller.ts
  stock.module.ts           (exports StockService)
```

## Mobile Files

```
apps/mobile/src/
  hooks/useStock.ts         (fetches /stock, computes lowStock client-side)
  screens/StockScreen.tsx
```

## Out of Scope

- Stock history log / audit trail
- Supplier / purchase orders
- Multi-warehouse locations
