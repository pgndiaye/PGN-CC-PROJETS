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
  - packages/types/index.ts
  - docker-compose.yml
  - package.json
routes: []
models:
  - User
test_files:
  - apps/backend/test/app.e2e-spec.ts
data_flow: greenfield
last_synced: 2026-05-19
status: complete
phase: all
mdd_version: 11
tags: [nestjs, react-native, prisma, postgresql, expo, scaffolding, monorepo, typescript]
path: Foundation/Scaffolding
integration_contracts: []
satisfies_contracts: []
known_issues: []
---

# 01 — Project Scaffolding — EZVIZ Sénégal Management System

## Purpose

Bootstrap the full monorepo for the EZVIZ Sénégal field operations platform — a professional management system for a CCTV security camera business in Senegal. It covers client management, cloud subscriptions, sales orders (with Mobile Money payments), stock tracking, and after-sales service (SAV). This scaffolding establishes the shared infrastructure — NestJS 10 backend, React Native + Expo mobile app, Prisma schema, and shared TypeScript types — that every subsequent feature module depends on.

## Architecture

Monorepo structure (pnpm workspaces):

```
ezviz-senegal/
├── apps/
│   ├── backend/              NestJS 10 API server
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   └── modules/      (auth, clients, cloud, commandes, sav, notifications, stock)
│   │   └── prisma/
│   │       └── schema.prisma
│   └── mobile/               React Native + Expo app
│       ├── App.tsx
│       ├── app.json
│       └── src/
│           ├── screens/      (Home, Clients, Cloud, Commandes, SAV)
│           ├── navigation/
│           └── hooks/
├── packages/
│   └── types/                Shared TypeScript types, enums, DTOs
├── docker-compose.yml        PostgreSQL + Redis (local dev)
└── package.json              pnpm workspace root
```

Backend modules (one NestJS module per sprint):

| Module        | Responsibility                                          | Sprint |
|---------------|--------------------------------------------------------|--------|
| auth          | JWT + refresh tokens + role guards                      | 1      |
| clients       | Client CRUD + QR code scanning                         | 2      |
| cloud         | EZVIZ cloud subscriptions + expiration cron jobs       | 2      |
| commandes     | Sales orders + dynamic pricing                         | 3      |
| stock         | Inventory decrement + low-stock alerts                 | 3      |
| sav           | After-sales tickets + photo upload + technician assign | 4      |
| notifications | Push / SMS / WhatsApp via BullMQ + Redis               | 4      |

Mobile app — 5 bottom tabs: **Accueil · Clients · Cloud · Commandes · SAV**

User roles: `ADMIN` · `COMMERCIAL` · `TECHNICIEN`

## Data Model

Initial Prisma schema — foundation only, extended per sprint:

```prisma
// apps/backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  role         Role     @default(COMMERCIAL)
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum Role {
  ADMIN
  COMMERCIAL
  TECHNICIEN
}
```

Full schema (clients → cameras → subscriptions → orders → stock → SAV tickets) is defined incrementally in Sprint 1–4 feature docs.

## API Endpoints

None at scaffolding phase — all routes defined per feature module. All API routes use the `/api/v1/` prefix. Global prefix is set in `main.ts`.

## Business Rules

- All API routes require JWT authentication, except `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh`
- Role-based access enforced at NestJS guard level (not just mobile UI):
  - `ADMIN` — full access to all modules
  - `COMMERCIAL` — clients, cloud, commandes, stock (read)
  - `TECHNICIEN` — SAV tickets + client read-only
- Mobile app is **offline-first**: SQLite (via expo-sqlite) + React Query cache; deferred sync queue when offline
- All monetary values stored and computed in **XOF (CFA francs)** — no currency conversion
- Audit trail: every write operation is logged via NestJS middleware (user, action, timestamp)

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
- Failed login attempts rate-limited: max 5 per 15 minutes per IP (via `@nestjs/throttler`)
- Passwords hashed with bcrypt (rounds: 12)

**Request validation:**
- All incoming DTOs validated via `class-validator` + `class-transformer`
- `ValidationPipe` set globally with `whitelist: true, forbidNonWhitelisted: true`

**What this module must NOT expose:**
- Raw `process.env` values to API responses
- Unhashed refresh tokens
- Internal stack traces in production error responses

## Known Issues

(none — new project)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
