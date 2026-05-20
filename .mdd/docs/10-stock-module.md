---
id: stock-module
wave: ezviz-senegal-wave-3
title: "Stock Module"
status: in_progress
depends_on: [08-orders-module]
created: 2026-05-20
hash: placeholder
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

| Method | Path       | Auth             | Description                        |
|--------|------------|------------------|------------------------------------|
| GET    | /          | JWT (any)        | List all stock items               |
| GET    | /:id       | JWT (any)        | Get single item                    |
| POST   | /          | JWT ADMIN        | Create a stock item                |
| PATCH  | /:id       | JWT ADMIN        | Update qty / price / name          |
| DELETE | /:id       | JWT ADMIN        | Delete a stock item                |
| POST   | /:id/adjust| JWT ADMIN        | Adjust qty by delta (+/-)          |

## Business Rules

- qty must be >= 0 after creation (no direct negative creation)
- adjust endpoint accepts `{ delta: number; reason?: string }` — delta can be negative
- Order creation triggers `decrementByProductName(productName, qty)` on all matching stock items (case-insensitive). Non-fatal if no match found.
- Low-stock flag returned in GET when `qty <= minQty`

## Integration with Orders

`OrdersService.create` is updated to call `StockService.decrementByOrderLines(lines)` after the order transaction succeeds. Implemented as fire-and-forget (no throw on failure) to avoid blocking order creation if stock data is missing.

## Mobile Screens

- `StockScreen` — list with search + low-stock highlight
- No create/delete from mobile (admin-only via API or future web dashboard)

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
  stock.module.ts
```

## Mobile Files

```
apps/mobile/src/
  hooks/useStock.ts
  screens/StockScreen.tsx
```

## Out of Scope

- Stock history log / audit trail
- Supplier / purchase orders
- Multi-warehouse locations
