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
last_synced: 2026-05-20
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

Manages sales orders for the EZVIZ Sénégal business. A commercial agent creates an order for a client, adds order lines (products/services with quantity and unit price), and records the payment method (cash, Orange Money, or Wave). The order total is computed server-side from its lines. This module is the foundation for stock decrement (Wave 3) and Mobile Money payment confirmation (Wave 3).

## Architecture

NestJS CRUD module following the same pattern as `clients-module` and `cloud-module`. The backend exposes REST endpoints under `/api/v1/orders`. The mobile app provides a list screen and a create-order form. No real-time updates in this feature — the mobile app polls or refetches on focus.

```
POST /api/v1/orders        → create order + lines (transaction)
GET  /api/v1/orders        → list (filter by clientId, status)
GET  /api/v1/orders/:id    → single order with lines
PATCH /api/v1/orders/:id   → update status / notes (not lines)
DELETE /api/v1/orders/:id  → soft cancel (status: CANCELLED)
```

All endpoints require JWT. POST/PATCH/DELETE require role `ADMIN` or `COMMERCIAL`.

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

## API Endpoints

### POST /api/v1/orders
- **Auth:** JWT required; roles ADMIN, COMMERCIAL
- **Body:**
  ```json
  {
    "clientId": "cuid",
    "lines": [
      { "productName": "Camera X", "productType": "camera", "qty": 2, "unitPrice": 45000 }
    ],
    "notes": "optional"
  }
  ```
- **Response 201:**
  ```json
  {
    "id": "cuid",
    "clientId": "cuid",
    "total": 90000,
    "status": "PENDING",
    "lines": [...],
    "createdAt": "ISO"
  }
  ```
- **Errors:** 400 if lines empty; 404 if clientId not found

### GET /api/v1/orders
- **Auth:** JWT required (all roles)
- **Query:** `?clientId=`, `?status=PENDING|PAID|CANCELLED`
- **Response 200:** array of orders (without lines for list performance)

### GET /api/v1/orders/:id
- **Auth:** JWT required (all roles)
- **Response 200:** full order including lines
- **Error:** 404 if not found

### PATCH /api/v1/orders/:id
- **Auth:** JWT required; roles ADMIN, COMMERCIAL
- **Body:** `{ "status"?: OrderStatus, "paymentMethod"?: PaymentMethod, "paymentRef"?: string, "notes"?: string }`
- **Note:** lines are NOT updatable after creation
- **Response 200:** updated order

### DELETE /api/v1/orders/:id
- **Auth:** JWT required; roles ADMIN only
- **Behaviour:** sets status to CANCELLED (soft delete — record preserved)
- **Response 200:** cancelled order

## Business Rules

1. **Lines required:** An order must have at least one line — reject with 400 if `lines` is empty.
2. **Total computed server-side:** `total = sum(line.qty * line.unitPrice)` — client-provided total is ignored.
3. **Subtotal computed server-side:** `subtotal = qty * unitPrice` per line — client value ignored.
4. **Lines immutable after creation:** PATCH cannot modify order lines — to change lines, cancel and re-create.
5. **Soft delete only:** DELETE sets `status: CANCELLED`, never removes the record.
6. **createdById set server-side:** from the JWT token, not from the request body.
7. **Status transitions:** PENDING → PAID, PENDING → CANCELLED. PAID → CANCELLED only for ADMIN. No other transitions.
8. **clientId must exist:** validated before order creation (404 if not found).

## Data Flow

Greenfield — no existing order data to trace. The `clientId` comes from the request body, is validated against the `Client` table via PrismaService, then stored on the Order. The `createdById` is extracted from the JWT payload (same pattern as other modules). Order total and line subtotals are computed in the service before writing to the database.

## Dependencies

- **02-auth-module:** JWT guard and RolesGuard applied on all endpoints; `createdById` extracted from JWT payload.
- **05-clients-module:** `clientId` must reference a valid `Client` record; ClientsService may be injected to perform the validation or we rely on Prisma foreign-key constraint.

## Security

All endpoints require a valid JWT. Write operations (POST, PATCH, DELETE) are restricted to ADMIN or COMMERCIAL roles via `@Roles()` + `RolesGuard`. The `createdById` field is always set from the authenticated user's JWT — never from the request body. No user-supplied HTML or executable content is stored.

## Known Issues

(none — new feature)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
