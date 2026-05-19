---
id: 01-user-authentication
title: User Authentication with JWT Tokens
edition: Both
depends_on: []
source_files:
  - src/types/auth.ts
  - src/models/user.ts
  - src/services/auth.service.ts
  - src/middleware/authenticate.ts
  - src/handlers/auth.handler.ts
  - src/routes/auth.routes.ts
  - prisma/schema.prisma
routes:
  - POST /api/v1/auth/register
  - POST /api/v1/auth/login
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/logout
models:
  - User
  - RefreshToken
test_files:
  - tests/unit/auth.service.test.ts
  - tests/unit/auth.handler.test.ts
  - tests/unit/authenticate.middleware.test.ts
data_flow: greenfield
last_synced: 2026-05-19
status: complete
phase: all
mdd_version: 1.0
tags: [authentication, jwt, authorization, express, prisma, postgresql, tokens, security]
path: Auth/Login
integration_contracts:
  - function: authenticate(req, res, next)
    when: before any handler that requires an authenticated user
    description: Express middleware that validates the Bearer token and attaches req.user
satisfies_contracts: []
known_issues: []
---

# 01 — User Authentication with JWT Tokens

## Purpose

Provides secure user registration and login for the application. Issues short-lived JWT access tokens (15 min) and long-lived refresh tokens (7 days), allowing clients to re-authenticate without re-entering credentials. All protected routes use the `authenticate` middleware to verify identity.

## Architecture

```
Client
  │
  ├─ POST /api/v1/auth/register  →  AuthHandler → AuthService → Prisma (User)
  ├─ POST /api/v1/auth/login     →  AuthHandler → AuthService → Prisma (User + RefreshToken)
  ├─ POST /api/v1/auth/refresh   →  AuthHandler → AuthService → Prisma (RefreshToken)
  └─ POST /api/v1/auth/logout    →  AuthHandler → AuthService → Prisma (delete RefreshToken)

Protected routes:
  GET /api/v1/...  →  authenticate middleware  →  handler (req.user is set)
```

- `AuthService` owns all business logic (hashing, token signing/verification, DB queries)
- `AuthHandler` owns HTTP concerns (request parsing, response shaping, status codes)
- `authenticate` middleware is a pure side-effect: validates Bearer token, attaches `req.user`, calls `next()`
- Prisma is the only database access layer (StrictDB rule — no raw SQL or pg driver)

## Data Model

### User (Prisma model)
```prisma
model User {
  id           String         @id @default(uuid())
  email        String         @unique
  passwordHash String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  refreshTokens RefreshToken[]
}
```

### RefreshToken (Prisma model)
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

## API Endpoints

### POST /api/v1/auth/register
- **Auth required:** No
- **Request body:** `{ email: string, password: string }`
- **Validation:** email must be valid format; password min 8 chars
- **Response 201:** `{ user: { id, email, createdAt } }`
- **Errors:**
  - `400` — missing/invalid fields
  - `409` — email already registered

### POST /api/v1/auth/login
- **Auth required:** No
- **Request body:** `{ email: string, password: string }`
- **Response 200:** `{ accessToken: string, refreshToken: string, user: { id, email } }`
- **Errors:**
  - `400` — missing fields
  - `401` — invalid credentials (do NOT distinguish "wrong email" vs "wrong password" — always generic)

### POST /api/v1/auth/refresh
- **Auth required:** No (uses refresh token in body)
- **Request body:** `{ refreshToken: string }`
- **Response 200:** `{ accessToken: string, refreshToken: string }`
- **Behavior:** rotates the refresh token — old one is deleted, new one issued
- **Errors:**
  - `400` — missing token
  - `401` — token not found, expired, or invalid

### POST /api/v1/auth/logout
- **Auth required:** Yes (Bearer access token)
- **Request body:** `{ refreshToken: string }`
- **Response 204:** empty body
- **Behavior:** deletes the refresh token from DB; client must discard both tokens
- **Errors:**
  - `401` — invalid or missing access token

## Business Rules

1. Passwords are hashed with bcrypt (cost factor 12) — never stored in plaintext
2. Access tokens expire in 15 minutes (`JWT_ACCESS_EXPIRES_IN=15m`)
3. Refresh tokens expire in 7 days (`JWT_REFRESH_EXPIRES_IN=7d`)
4. Refresh token rotation: every `/refresh` call invalidates the old token and issues a new one
5. On logout, the refresh token is deleted from DB — access token expiry is relied on (no server-side access token blocklist)
6. Login failure message is always generic: `"Invalid credentials"` — never reveal which field failed
7. Email comparison is case-insensitive (store lowercase, compare lowercase)
8. A user may have multiple active refresh tokens (multiple devices) — logout only removes the one provided

## Data Flow

Greenfield — no existing code analyzed.

## Dependencies

None — this is the foundational authentication feature.

## Security

**Untrusted inputs:** all fields in request bodies (`email`, `password`, `refreshToken`) come from unauthenticated callers and must be validated before use.

**What a malicious caller could attempt:**
- Send oversized payloads → mitigate with `express.json({ limit: '10kb' })`
- Brute-force login → acceptable for now (rate limiting is a future feature)
- Send a forged JWT → `jsonwebtoken.verify()` with the server secret rejects these
- Reuse a stolen refresh token after logout → DB check prevents this (token is deleted on logout/rotation)
- Enumerate registered emails via timing differences → generic error messages + bcrypt constant-time comparison

**Secrets required (never committed):**
- `JWT_ACCESS_SECRET` — signs access tokens
- `JWT_REFRESH_SECRET` — signs refresh tokens (separate secret to allow independent rotation)
- `DATABASE_URL` — Prisma connection string

**`authenticate` middleware integration contract:** every Express handler that requires an authenticated user MUST be preceded by the `authenticate` middleware. This is documented in `integration_contracts` — future features that add protected routes must add it to their `satisfies_contracts`.

## Known Issues

(none — new feature)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
