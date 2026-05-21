---
id: 08-orders-module
title: Orders Module
edition: Both
depends_on: [02-auth-module, 05-clients-module]
source_files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/modules/orders/orders.module.ts
  - apps/backend/src/modules/orders/orders.service.ts
  - apps/backend/src/modules/orders/orders.controller.ts
  - apps/backend/src/modules/orders/dto/create-order.dto.ts
  - apps/backend/src/modules/orders/dto/update-order.dto.ts
  - apps/mobile/src/screens/OrdersScreen.tsx
  - apps/mobile/src/screens/OrderDetailScreen.tsx
  - apps/mobile/src/screens/CreateOrderScreen.tsx
  - apps/mobile/src/hooks/useOrders.ts
routes:
  - POST /api/v1/orders
  - GET /api/v1/orders
  - GET /api/v1/orders/:id
  - PATCH /api/v1/orders/:id
  - DELETE /api/v1/orders/:id
models:
  - Order
  - OrderLine
  - OrderStatus (enum)
  - PaymentMethod (enum)
test_files:
  - apps/backend/src/modules/orders/orders.service.spec.ts
data_flow: greenfield
last_synced: 2026-05-21
status: in_progress
phase: integration-pending
mdd_version: 1.6.13
tags: [orders, crud, nestjs, prisma, mobile, react-native, commerce, payments]
path: Commerce/Orders
initiative: ezviz-senegal
wave: ezviz-senegal-wave-3
wave_status: in_progress
integration_contracts: []
satisfies_contracts: []
known_issues: []
---

# 08 — Orders Module

## Purpose

Manages sales orders for the EZVIZ Sénégal business. A commercial agent creates an order for a client, adds order lines (products/services with quantity and unit price), and records the payment method (cash, Orange Money, or Wave). The order total is computed server-side from its lines. Stock is decremented automatically after order creation (fire-and-forget integration with 10-stock-module). Mobile Money payment confirmation is handled by 09-mobile-money-payment.

## Architecture

NestJS CRUD module following the same pattern as `clients-module` and `cloud-module`. The backend exposes REST endpoints under `/api/v1/orders`. The mobile app provides a list screen, a detail screen, and a create-order form. No real-time updates — the mobile app refetches on focus via TanStack Query.

```
POST /api/v1/orders        → create order + lines (transaction) + fire-and-forget stock decrement
GET  /api/v1/orders        → list (filter by clientId, status; ordered by createdAt DESC)
GET  /api/v1/orders/:id    → single order with lines + client
PATCH /api/v1/orders/:id   → update status / paymentMethod / paymentRef / notes (not lines)
DELETE /api/v1/orders/:id  → soft cancel (status: CANCELLED)
```

All endpoints require JWT. POST/PATCH require role `ADMIN` or `COMMERCIAL`. DELETE requires `ADMIN`.

**Module wiring:** `OrdersModule` imports `StockModule` (to inject `StockService`) and exports `OrdersService`.

## Data Model

### Prisma additions to `schema.prisma`

```prisma
enum OrderStatus {
  PENDING
  PAID
  CANCELLED
}

enum PaymentMethod {
  CASH
  ORANGE_MONEY
  WAVE
}

model Order {
  id            String        @id @default(cuid())
  client        Client        @relation(fields: [clientId], references: [id])
  clientId      String
  lines         OrderLine[]
  total         Float         // computed: sum of lines[].subtotal
  status        OrderStatus   @default(PENDING)
  paymentMethod PaymentMethod?
  paymentRef    String?       // Mobile Money transaction reference
  notes         String?
  createdBy     User          @relation(fields: [createdById], references: [id])
  createdById   String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model OrderLine {
  id          String   @id @default(cuid())
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId     String
  productName String
  productType String?
  qty         Int      @default(1)
  unitPrice   Float
  subtotal    Float    // qty * unitPrice, computed server-side
  createdAt   DateTime @default(now())
}
```

Also add to `Client` model: `orders Order[]`
Also add to `User` model: `orders Order[]`

## DTOs

### CreateOrderDto / CreateOrderLineDto

| Field | Type | Required | Validation |
|---|---|---|---|
| clientId | string | yes | @IsNotEmpty |
| lines | CreateOrderLineDto[] | yes | @IsArray, @ValidateNested |
| notes | string | no | — |

| Line field | Type | Required | Validation |
|---|---|---|---|
| productName | string | yes | @IsNotEmpty |
| productType | string | no | — |
| qty | number | yes | @Min(1) |
| unitPrice | number | yes | @IsPositive |

### UpdateOrderDto

All fields optional: `status` (@IsEnum OrderStatus), `paymentMethod` (@IsEnum PaymentMethod), `paymentRef` (string), `notes` (string).

## API Endpoints

### POST /api/v1/orders
- **Auth:** JWT; roles ADMIN, COMMERCIAL
- **Body:** `{ clientId, lines: [{ productName, productType?, qty, unitPrice }], notes? }`
- **Response 201:** full order with lines
- **Errors:** 400 if lines empty; 404 if clientId not found
- **Side effect:** `StockService.decrementByOrderLines(lines)` called fire-and-forget after transaction

### GET /api/v1/orders
- **Auth:** JWT (all roles)
- **Query:** `?clientId=`, `?status=PENDING|PAID|CANCELLED` (combinable)
- **Response 200:** array of orders ordered by `createdAt DESC` (without lines)

### GET /api/v1/orders/:id
- **Auth:** JWT (all roles)
- **Response 200:** full order including `lines[]` and `client` object
- **Error:** 404 if not found

### PATCH /api/v1/orders/:id
- **Auth:** JWT; roles ADMIN, COMMERCIAL
- **Body:** `{ status?, paymentMethod?, paymentRef?, notes? }`
- **Note:** lines are NOT updatable after creation
- **Response 200:** updated order with lines

### DELETE /api/v1/orders/:id
- **Auth:** JWT; roles ADMIN only
- **Behaviour:** sets `status: CANCELLED` (soft delete — record preserved)
- **Response 200:** cancelled order with lines

## Business Rules

1. **Lines required:** An order must have at least one line — reject with 400 if `lines` is empty.
2. **Total computed server-side:** `total = sum(line.qty * line.unitPrice)` — client-provided total is ignored.
3. **Subtotal computed server-side:** `subtotal = qty * unitPrice` per line.
4. **Lines immutable after creation:** PATCH cannot modify order lines — to change lines, cancel and re-create.
5. **Soft delete only:** DELETE sets `status: CANCELLED`, never removes the record.
6. **createdById set server-side:** extracted from JWT token, never from request body.
7. **Status transitions (UX):** cancel and pay actions only shown for PENDING orders in the mobile detail screen.
8. **clientId must exist:** validated before order creation (404 if not found).
9. **Stock decrement is fire-and-forget:** failure does not roll back the order — wrapped in `.catch(() => {})`.

## Mobile Screens

### OrdersScreen
- FlatList of orders with status filter chips (Toutes / En attente / Payées / Annulées)
- Each row shows: reference (last 6 chars of id), total in F CFA, date, status badge
- FAB (+) navigates to `CreateOrder` screen
- Tapping a row navigates to `OrderDetail`

### OrderDetailScreen
- Displays: reference, status badge, total, client name/phone, payment method, notes, line items
- **Cancel button** (PENDING only): calls PATCH `{ status: 'CANCELLED' }` with confirmation Alert
- **"Encaisser en Mobile Money" button** (PENDING only): navigates to `PaymentInit` screen with `{ orderId, total }` — integration entry point for 09-mobile-money-payment

### CreateOrderScreen
- clientId pre-filled from `route.params.clientId` when navigating from a client detail
- Dynamic line list: add / remove lines, real-time subtotal preview per line
- Client-side total estimate shown before submission (`computeTotal()`)
- Client-side validation: filters empty/invalid lines before calling API; shows Alert on missing client or no valid lines
- On success: navigates to `OrderDetail` via `navigation.replace`

## Hooks (`useOrders.ts`)

| Hook | Purpose |
|---|---|
| `useOrders(filters?)` | List orders, optional `{ clientId, status }` filters |
| `useOrder(id)` | Single order with lines (enabled only when id is truthy) |
| `useCreateOrder()` | Mutation — POST /orders; invalidates `['orders']` on success |
| `useUpdateOrder(id)` | Mutation — PATCH /orders/:id; invalidates `['orders']` on success |

## Dependencies

- **02-auth-module:** JWT guard on all routes; `createdById` extracted from `req.user.id`.
- **05-clients-module:** `clientId` validated against `Client` table via PrismaService.
- **10-stock-module:** `StockService.decrementByOrderLines()` called after order creation; `OrdersModule` imports `StockModule` to enable this injection.
- **09-mobile-money-payment:** `OrderDetailScreen` navigates to `PaymentInit` for PENDING orders.

## Security

All endpoints require a valid JWT. Write operations restricted to ADMIN/COMMERCIAL (ADMIN only for DELETE) via `@Roles()` + `RolesGuard`. `createdById` always set from JWT — never from request body.
