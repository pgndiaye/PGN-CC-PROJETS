---
id: 06-cloud-module
title: Cloud Subscriptions Module
edition: Both
depends_on: [02-auth-module, 05-clients-module]
source_files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/modules/cloud/cloud.module.ts
  - apps/backend/src/modules/cloud/cloud.service.ts
  - apps/backend/src/modules/cloud/cloud.controller.ts
  - apps/backend/src/modules/cloud/dto/create-subscription.dto.ts
  - apps/backend/src/modules/cloud/dto/renew-subscription.dto.ts
  - apps/backend/src/modules/cloud/cloud.service.spec.ts
  - apps/backend/src/app.module.ts
  - apps/mobile/src/screens/CloudScreen.tsx
  - apps/mobile/src/screens/CloudDetailScreen.tsx
  - apps/mobile/src/screens/CreateSubscriptionScreen.tsx
  - apps/mobile/src/hooks/useCloud.ts
  - apps/mobile/src/navigation/AppNavigator.tsx
routes:
  - POST /api/v1/cloud
  - GET /api/v1/cloud
  - GET /api/v1/cloud/:id
  - PATCH /api/v1/cloud/:id/renew
  - DELETE /api/v1/cloud/:id
models:
  - CloudSubscription
test_files:
  - apps/backend/src/modules/cloud/cloud.service.spec.ts
data_flow: greenfield
last_synced: 2026-05-20
status: complete
phase: all
mdd_version: 11
tags: [cloud, subscriptions, nestjs, prisma, react-native, ezviz, expiration]
path: Cloud
integration_contracts: []
satisfies_contracts:
  - from: 02-auth-module
    function: JwtAuthGuard
    when: before any protected route handler
    status: done
    verified_at: "apps/backend/src/modules/cloud/cloud.controller.ts:21"
  - from: 02-auth-module
    function: RolesGuard + @Roles()
    when: on routes requiring specific role (POST, PATCH, DELETE)
    status: done
    verified_at: "apps/backend/src/modules/cloud/cloud.controller.ts:42"
  - from: 05-clients-module
    function: ClientsService.findOne()
    when: before creating a subscription — verify client exists
    status: done
    verified_at: "apps/backend/src/modules/cloud/cloud.service.ts:67"
known_issues: []
---

# 06 — Cloud Subscriptions Module

## Purpose

Manages EZVIZ cloud subscription plans for clients. A Commercial enters the camera serial number and selects a plan duration (in months) to activate a subscription. Expiration is tracked automatically — no cron job in Wave 2, status is derived from `expiresAt` at read time. Supports renewal (extends expiry from current expiry or today if already expired).

## Architecture

```
Backend
  CloudController  (/api/v1/cloud)
    POST   /           → CloudService.create()     — requires clientId, serialNumber, planMonths
    GET    /           → CloudService.findAll()    — ?clientId= ?expiring=<days>
    GET    /:id        → CloudService.findOne()
    PATCH  /:id/renew  → CloudService.renew()     — extends expiresAt
    DELETE /:id        → CloudService.remove()

  CloudService.create()
    → ClientsService.findOne(clientId)  ← ensures client exists
    → compute expiresAt = activatedAt + planMonths months
    → prisma.cloudSubscription.create()

Mobile (Cloud tab)
  CloudScreen           → list all subscriptions (with expiry badge)
    → CloudDetailScreen (tap row)
    → CreateSubscriptionScreen (FAB)
```

## Data Model

```prisma
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
```

`Client` model gets a `subscriptions CloudSubscription[]` relation added.

Status is computed at read time:
- **Active**: `expiresAt > now()`
- **Expired**: `expiresAt ≤ now()`

## API Endpoints

### POST /api/v1/cloud
- Auth: JwtAuthGuard + RolesGuard → ADMIN, COMMERCIAL
- Body: `{ clientId: string, serialNumber: string, planMonths: number (1–36), activatedAt?: ISO date, notes?: string }`
- Response 201: `CloudSubscription & { client: { id, name } }`
- Error 404: clientId not found

### GET /api/v1/cloud
- Auth: JwtAuthGuard (all roles)
- Query: `?clientId=<id>` (filter by client) | `?expiring=<days>` (expiring within N days)
- Response 200: `(CloudSubscription & { client: { id, name }, isActive: boolean })[]`

### GET /api/v1/cloud/:id
- Auth: JwtAuthGuard (all roles)
- Response 200: `CloudSubscription & { client: { id, name }, isActive: boolean }`
- Error 404: subscription not found

### PATCH /api/v1/cloud/:id/renew
- Auth: JwtAuthGuard + RolesGuard → ADMIN, COMMERCIAL
- Body: `{ additionalMonths: number (1–36) }`
- Renewal base: `max(expiresAt, now())` — avoids losing time on active plans
- Response 200: `CloudSubscription & { client: { id, name } }`
- Error 404: subscription not found

### DELETE /api/v1/cloud/:id
- Auth: JwtAuthGuard + RolesGuard → ADMIN only
- Response 200: `CloudSubscription`
- Error 404: subscription not found

## Business Rules

- `expiresAt` = `activatedAt + planMonths` calendar months (not days)
- Renewal base = `max(expiresAt, now())` — never loses remaining time
- `planMonths` must be between 1 and 36
- `serialNumber` is a free-text string (format validation deferred to Wave 3)
- Deleting a client cascades to delete their subscriptions

## Data Flow

Greenfield. `expiresAt` computed in service via `Date.setMonth()`. `isActive` field added to response objects before returning — not a DB column.

## Dependencies

- 02-auth-module — JwtAuthGuard, RolesGuard, @Roles()
- 05-clients-module — ClientsService (injected to validate clientId on create)

## Security

All routes require JWT auth. Client ID is validated against DB (404 on miss) — no orphan subscriptions possible. `serialNumber` and `notes` are user-supplied strings, validated by class-validator.

## Known Issues

## Bugs

(none yet)
