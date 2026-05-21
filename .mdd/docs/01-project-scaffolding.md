---
id: 01-project-scaffolding
title: Project Scaffolding — EZVIZ Sénégal Management System
edition: Both
depends_on: []
source_files:
  - apps/backend/src/main.ts
  - apps/backend/src/app.module.ts
  - apps/backend/prisma/schema.prisma
  - apps/mobile/App.tsx
  - apps/mobile/app.json
  - apps/web/vite.config.ts
  - packages/types/src/index.ts
  - docker-compose.yml
  - package.json
routes: []
models:
  - User
  - Client
  - CloudSubscription
  - Order
  - OrderLine
  - StockItem
test_files:
  - apps/backend/test/app.e2e-spec.ts
data_flow: greenfield
last_synced: 2026-05-21
status: complete
phase: all
mdd_version: 1.6.13
tags: [nestjs, react-native, prisma, postgresql, expo, scaffolding, monorepo, typescript]
path: Foundation/Scaffolding
integration_contracts: []
satisfies_contracts: []
known_issues: []
---

# 01 — Project Scaffolding — EZVIZ Sénégal Management System

## Purpose

Bootstrap the full monorepo for the EZVIZ Sénégal field operations platform — a professional management system for a CCTV security camera business in Senegal. It covers client management, cloud subscriptions, sales orders (with Mobile Money payments), stock tracking, and after-sales service (SAV). This scaffolding establishes the shared infrastructure — NestJS 10 backend, React Native + Expo mobile app, Vite/React web dashboard, Prisma schema, and shared TypeScript types — that every subsequent feature module depends on.

## Architecture

Monorepo structure (pnpm workspaces):

```
ezviz-senegal/
├── apps/
│   ├── backend/              NestJS 10 API server
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   └── modules/      (auth, users, clients, cloud, orders, payments, stock)
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── mobile/               React Native + Expo app
│   │   ├── App.tsx
│   │   ├── app.json
│   │   └── src/
│   │       ├── screens/      (Home, Clients, Cloud, Orders, Stock, SAV…)
│   │       ├── navigation/
│   │       └── hooks/
│   └── web/                  Vite + React web dashboard (wave-3)
│       ├── vite.config.ts
│       └── src/
├── packages/
│   └── types/                Shared TypeScript types, enums, DTOs
│       └── src/index.ts
├── docker-compose.yml        PostgreSQL + Redis (local dev)
└── package.json              pnpm workspace root
```

Backend modules (one NestJS module per sprint):

| Module   | Responsibility                                            | Wave  | Status      |
|----------|-----------------------------------------------------------|-------|-------------|
| auth     | JWT + refresh tokens + role guards                        | 1     | complete    |
| users    | User CRUD (admin only)                                    | 1     | complete    |
| clients  | Client CRUD + QR code generation                          | 2     | complete    |
| cloud    | EZVIZ cloud subscriptions + expiration                    | 2     | complete    |
| orders   | Sales orders + order lines + total computed server-side   | 3     | complete    |
| payments | SENE-PAY integration (Wave + Orange Money) + webhook      | 3     | complete    |
| stock    | Inventory CRUD + auto-decrement on order creation         | 3     | complete    |
| sav      | After-sales tickets + photo upload + technician assign    | 4     | planned     |

Mobile app — bottom tabs: **Accueil · Clients · Cloud · Commandes · Stock** (SAV planned for wave-4)

User roles: `ADMIN` · `COMMERCIAL` · `TECHNICIEN`

## Data Model

Prisma schema — current state (waves 1–3). Extended incrementally; future models documented in their respective feature docs.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  role         Role     @default(COMMERCIAL)
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  orders       Order[]

  @@map("users")
}

enum Role {
  ADMIN
  COMMERCIAL
  TECHNICIEN
}

model Client {
  id            String              @id @default(cuid())
  name          String
  phone         String
  address       String?
  city          String
  type          ClientType          @default(PARTICULIER)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  subscriptions CloudSubscription[]
  orders        Order[]

  @@map("clients")
}

enum ClientType {
  ENTREPRISE
  PARTICULIER
}

model CloudSubscription {
  id           String   @id @default(cuid())
  clientId     String
  serialNumber String
  planMonths   Int
  activatedAt  DateTime @default(now())
  expiresAt    DateTime
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@map("cloud_subscriptions")
}

enum OrderStatus { PENDING  PAID  CANCELLED }
enum PaymentMethod { CASH  ORANGE_MONEY  WAVE }

model Order {
  id            String         @id @default(cuid())
  clientId      String
  createdById   String
  total         Float
  status        OrderStatus    @default(PENDING)
  paymentMethod PaymentMethod?
  paymentRef    String?
  notes         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  client    Client      @relation(fields: [clientId], references: [id])
  createdBy User        @relation(fields: [createdById], references: [id])
  lines     OrderLine[]

  @@map("orders")
}

model OrderLine {
  id          String   @id @default(cuid())
  orderId     String
  productName String
  productType String?
  qty         Int      @default(1)
  unitPrice   Float
  subtotal    Float
  createdAt   DateTime @default(now())
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_lines")
}

model StockItem {
  id          String   @id @default(cuid())
  productName String
  productType String?
  sku         String?  @unique
  qty         Int      @default(0)
  minQty      Int      @default(0)
  unitPrice   Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("stock_items")
}
```

## API Endpoints

None at scaffolding phase — all routes defined per feature module. All API routes use the `/api/v1/` prefix, set via `API_PREFIX` env var (defaults to `api/v1`) in `main.ts`.

## main.ts Behaviour

- `rawBody: true` on `NestFactory.create` — required for HMAC webhook signature verification (payments module)
- `ValidationPipe` global with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- CORS enabled — `origin` from `CORS_ORIGIN` env var (defaults to `*`)
- `PORT` env var (default `3000`)

## Docker Compose (Local Dev)

| Service  | Container   | Host port | Internal port |
|----------|-------------|-----------|---------------|
| postgres | `ezviz_db`  | 5433      | 5432          |
| redis    | `ezviz_redis` | 6379    | 6379          |

Volumes: `postgres_data`, `redis_data`.

## Mobile App Wiring (App.tsx)

- `onlineManager` wired to `NetInfo` — TanStack Query auto-refetches on reconnect
- `initDb()` called on module load — initialises SQLite offline cache tables

## Business Rules

- All API routes require JWT authentication, except `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh`
- Role-based access enforced at NestJS guard level (not just mobile UI):
  - `ADMIN` — full access to all modules
  - `COMMERCIAL` — clients, cloud, orders, payments (initiate), stock (read)
  - `TECHNICIEN` — SAV tickets + client read-only
- Mobile app is **offline-first**: SQLite (via expo-sqlite) + TanStack Query cache; NetInfo-triggered refetch on reconnect
- All monetary values stored and computed in **XOF (CFA francs)** — no currency conversion
- `ValidationPipe` globally applied — all incoming DTOs validated via class-validator

## Data Flow

Greenfield — no existing code analyzed.

## Dependencies

None — this is the root foundation all other feature docs depend on.

## Security

This feature establishes the security baseline for the entire system:

**Untrusted inputs:** HTTP request bodies, QR code scan data, Mobile Money webhook payloads, file uploads (SAV photos).

**Auth security:**
- JWT access tokens expire in 15 minutes
- Refresh tokens (7 days) stored hashed in DB and rotated on use
- Failed login attempts rate-limited: max 100 per 60s per IP (via `@nestjs/throttler`)
- Passwords hashed with bcrypt (rounds: 12)

**Request validation:**
- All incoming DTOs validated via `class-validator` + `class-transformer`
- `ValidationPipe` set globally with `whitelist: true, forbidNonWhitelisted: true`

**Webhook security:**
- `rawBody: true` in `NestFactory.create` — preserves raw request body for HMAC verification in the payments webhook handler

**What this module must NOT expose:**
- Raw `process.env` values to API responses
- Unhashed refresh tokens
- Internal stack traces in production error responses

## Known Issues

(none)
