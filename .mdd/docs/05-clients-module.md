---
id: 05-clients-module
title: Clients Module
edition: Both
depends_on: [02-auth-module]
source_files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/modules/clients/clients.module.ts
  - apps/backend/src/modules/clients/clients.service.ts
  - apps/backend/src/modules/clients/clients.controller.ts
  - apps/backend/src/modules/clients/dto/create-client.dto.ts
  - apps/backend/src/modules/clients/dto/update-client.dto.ts
  - apps/backend/src/modules/clients/clients.service.spec.ts
  - apps/backend/src/app.module.ts
  - apps/mobile/src/screens/ClientsScreen.tsx
  - apps/mobile/src/screens/ClientDetailScreen.tsx
  - apps/mobile/src/screens/CreateClientScreen.tsx
  - apps/mobile/src/hooks/useClients.ts
  - apps/mobile/src/navigation/AppNavigator.tsx
routes:
  - POST /api/v1/clients
  - GET /api/v1/clients
  - GET /api/v1/clients/:id
  - PATCH /api/v1/clients/:id
  - DELETE /api/v1/clients/:id
  - GET /api/v1/clients/:id/qr
models:
  - Client
  - ClientType
test_files:
  - apps/backend/src/modules/clients/clients.service.spec.ts
data_flow: greenfield
last_synced: 2026-05-20
status: complete
phase: all
mdd_version: 11
tags: [clients, crud, nestjs, prisma, qrcode, react-native, expo, mobile]
path: Clients
integration_contracts: []
satisfies_contracts:
  - from: 02-auth-module
    function: JwtAuthGuard
    when: before any protected route handler
    status: done
    verified_at: "apps/backend/src/modules/clients/clients.controller.ts:21"
  - from: 02-auth-module
    function: RolesGuard + @Roles()
    when: on routes requiring specific role (POST, PATCH, DELETE)
    status: done
    verified_at: "apps/backend/src/modules/clients/clients.controller.ts:41"
known_issues: []
---

# 05 — Clients Module

## Purpose

Manages the EZVIZ Sénégal client registry. Provides full CRUD for client records (businesses and individuals), plus on-demand QR code generation for each client using the decided format (`https://app.ezvizsenegal.sn/clients/<id>`). The mobile Clients tab replaces its placeholder with a real list, detail view, creation form, and QR scanner.

## Architecture

```
Backend
  ClientsController  (/api/v1/clients)
    POST   /          → ClientsService.create()
    GET    /          → ClientsService.findAll()
    GET    /:id       → ClientsService.findOne()
    PATCH  /:id       → ClientsService.update()
    DELETE /:id       → ClientsService.remove()
    GET    /:id/qr    → ClientsService.generateQrDataUrl()  → qrcode lib

Mobile (Clients tab)
  ClientsScreen       → list + search + FAB (create) + scanner icon
    → ClientDetailScreen  (tap row)
    → CreateClientScreen  (FAB)
    → QR scanner inline (expo-barcode-scanner)
```

## Data Model

```prisma
model Client {
  id        String     @id @default(cuid())
  name      String
  phone     String
  address   String?
  city      String
  type      ClientType @default(PARTICULIER)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@map("clients")
}

enum ClientType {
  ENTREPRISE
  PARTICULIER
}
```

## API Endpoints

### POST /api/v1/clients
- Auth: JwtAuthGuard + RolesGuard → ADMIN, COMMERCIAL
- Body: `{ name: string, phone: string, address?: string, city: string, type?: ClientType }`
- Response 201: `Client`
- Error 400: validation failure

### GET /api/v1/clients
- Auth: JwtAuthGuard (all roles)
- Query: `?search=<string>` (optional, filters by name or phone)
- Response 200: `Client[]`

### GET /api/v1/clients/:id
- Auth: JwtAuthGuard (all roles)
- Response 200: `Client`
- Error 404: client not found

### PATCH /api/v1/clients/:id
- Auth: JwtAuthGuard + RolesGuard → ADMIN, COMMERCIAL
- Body: partial `CreateClientDto`
- Response 200: `Client`
- Error 404: client not found

### DELETE /api/v1/clients/:id
- Auth: JwtAuthGuard + RolesGuard → ADMIN only
- Response 200: `Client`
- Error 404: client not found

### GET /api/v1/clients/:id/qr
- Auth: JwtAuthGuard (all roles)
- Response 200: `{ qrDataUrl: string }` — PNG encoded as data:image/png;base64,... data URL
- Error 404: client not found

## Business Rules

- All routes require JWT authentication (`JwtAuthGuard`)
- Create and update: ADMIN or COMMERCIAL only
- Delete: ADMIN only
- All roles (including TECHNICIEN) can read clients and generate QR
- QR URL format: `https://app.ezvizsenegal.sn/clients/<id>` — deterministic, never stored in DB
- QR generated on-demand via `qrcode` npm package → returned as base64 data URL

## Data Flow

Greenfield — new domain. QR URL computed from client.id in `ClientsService.generateQrDataUrl()`. Transported as `{ qrDataUrl }` JSON. Consumed by mobile `<Image source={{ uri: qrDataUrl }}>` in ClientDetailScreen.

## Dependencies

- 02-auth-module — JwtAuthGuard, RolesGuard, @Roles() decorator

## Security

Routes accept client data from authenticated users only. `name`, `phone`, `address`, `city` are user-supplied strings — validated by class-validator with `@IsString()` / `@IsOptional()` / `@IsEnum()`. The QR endpoint generates a deterministic URL from a CUID primary key; no user input enters the URL.

## Known Issues

## Bugs

(none yet — populated by /mdd bug when issues are reported)
