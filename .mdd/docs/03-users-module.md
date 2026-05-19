---
id: 03-users-module
title: Users Module
edition: Backend
depends_on: [01-project-scaffolding, 02-auth-module]
source_files:
  - apps/backend/src/modules/users/dto/create-user.dto.ts
  - apps/backend/src/modules/users/dto/update-user.dto.ts
  - apps/backend/src/modules/users/users.service.ts
  - apps/backend/src/modules/users/users.controller.ts
  - apps/backend/src/modules/users/users.module.ts
routes:
  - GET /api/v1/users
  - GET /api/v1/users/:id
  - POST /api/v1/users
  - PATCH /api/v1/users/:id
  - DELETE /api/v1/users/:id
models:
  - User
test_files:
  - apps/backend/src/modules/users/users.service.spec.ts
data_flow: greenfield
last_synced: 2026-05-19
status: complete
phase: all
mdd_version: 11
tags: [users, crud, nestjs, prisma, roles, admin]
path: Core/Users
integration_contracts: []
satisfies_contracts: []
known_issues: []
---

# 03 — Users Module

## Purpose

Provides CRUD management for user accounts (ADMIN / COMMERCIAL / TECHNICIEN). All write operations and list access are restricted to ADMIN role. Read of a single user is available to any authenticated user (needed by mobile profile screens). Passwords are never returned in any response.

## Architecture

Standard NestJS CRUD module. `PrismaModule` is global — injected directly. Guards imported from `AuthModule`.

## API Endpoints

- `GET /api/v1/users` — ADMIN only — returns `[{ id, email, role, createdAt }]`
- `GET /api/v1/users/:id` — authenticated — returns `{ id, email, role, createdAt }`
- `POST /api/v1/users` — ADMIN only — creates user, hashes password
- `PATCH /api/v1/users/:id` — ADMIN only — updates provided fields, re-hashes password if changed
- `DELETE /api/v1/users/:id` — ADMIN only — hard delete

## Business Rules

- `password` and `refreshToken` are NEVER included in any response (enforced via Prisma `select`)
- Password hashed with bcrypt rounds=12 on create and update
- `NotFoundException` on unknown id for read, update, and delete

## Security

All write routes and list route require `ADMIN` role. Password fields are stripped at the DB query level, not filtered in JS — Prisma `select` is the enforcement point.

## Known Issues

(none)

## Bugs

(none yet)
