---
id: 02-auth-module
title: Authentication Module
edition: Backend
depends_on: [01-project-scaffolding]
source_files:
  - apps/backend/src/modules/auth/auth.module.ts
  - apps/backend/src/modules/auth/auth.service.ts
  - apps/backend/src/modules/auth/auth.types.ts
  - apps/backend/src/modules/auth/auth.controller.ts
  - apps/backend/src/modules/auth/strategies/jwt.strategy.ts
  - apps/backend/src/modules/auth/strategies/local.strategy.ts
  - apps/backend/src/modules/auth/guards/jwt-auth.guard.ts
  - apps/backend/src/modules/auth/guards/roles.guard.ts
  - apps/backend/src/modules/auth/decorators/roles.decorator.ts
  - apps/backend/src/modules/auth/dto/login.dto.ts
  - apps/backend/src/modules/auth/dto/refresh-token.dto.ts
  - apps/backend/src/common/prisma/prisma.module.ts
  - apps/backend/src/common/prisma/prisma.service.ts
routes:
  - POST /api/v1/auth/login
  - POST /api/v1/auth/refresh
  - POST /api/v1/auth/logout
  - GET /api/v1/auth/me
models:
  - User
test_files:
  - apps/backend/src/modules/auth/auth.service.spec.ts
  - apps/backend/src/modules/auth/auth.controller.spec.ts
data_flow: greenfield
last_synced: 2026-05-21
status: complete
phase: all
mdd_version: 1.6.13
tags: [auth, jwt, nestjs, bcrypt, roles, guards, prisma]
path: Core/Auth
integration_contracts:
  - function: JwtAuthGuard
    when: before any protected route handler
    description: All routes except /auth/login and /auth/refresh must use @UseGuards(JwtAuthGuard)
  - function: RolesGuard + @Roles()
    when: on routes requiring specific role
    description: Role-restricted routes must combine @UseGuards(JwtAuthGuard, RolesGuard) with @Roles(Role.ADMIN)
satisfies_contracts: []
known_issues: []
---

# 02 — Authentication Module

## Purpose

Implements JWT-based authentication for the EZVIZ Sénégal platform. Provides login (email/password), access token (15 min) + refresh token (7 days, hashed in DB) lifecycle, and role-based access guards (ADMIN / COMMERCIAL / TECHNICIEN). All subsequent modules depend on this for route protection.

## Architecture

```
POST /auth/login
  → LocalStrategy (validates email + bcrypt password)
  → AuthService.login() → issues accessToken + refreshToken
  → refreshToken hashed with bcrypt and stored on User.refreshToken

POST /auth/refresh
  → Validates refreshToken from body against stored hash
  → Issues new accessToken (rotation)

GET /auth/me  [JwtAuthGuard]
  → JwtStrategy decodes accessToken → returns UserPayload

POST /auth/logout  [JwtAuthGuard]
  → Clears User.refreshToken in DB
```

Shared infrastructure:
- `PrismaModule` — global, provides `PrismaService` (singleton DB client)
- `JwtAuthGuard` — applied via `@UseGuards()` on all protected routes
- `RolesGuard` + `@Roles()` decorator — applied on top of JwtAuthGuard for role checks
- `auth.types.ts` — defines `UserPayload` (`sub`, `email`, `role`) and `AuthTokens` (`accessToken`, `refreshToken`) interfaces; self-contained within the auth module (not from the shared types package)

`JwtStrategy.validate()` performs a live DB lookup on every authenticated request (`prisma.user.findUnique`). This means deleted or disabled users are rejected immediately — the JWT alone is not sufficient.

## Data Model

Uses existing `User` model from `prisma/schema.prisma`:

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String   // bcrypt hash, rounds=12
  role         Role     @default(COMMERCIAL)
  refreshToken String?  // bcrypt hash of refresh token
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

## API Endpoints

### POST /api/v1/auth/login
- Auth required: No
- Rate limit: 5 requests / 15 min per IP
- Body: `{ email: string, password: string }`
- Response 200: `{ accessToken: string, refreshToken: string, user: { id, email, role } }`
- Error 401: `{ message: "Invalid credentials" }` (never discloses which field is wrong)

### POST /api/v1/auth/refresh
- Auth required: No
- Body: `{ refreshToken: string }`
- Response 200: `{ accessToken: string }`
- Error 401: `{ message: "Invalid or expired refresh token" }`

### GET /api/v1/auth/me
- Auth required: Yes (JwtAuthGuard)
- Response 200: `{ id: string, email: string, role: Role }`

### POST /api/v1/auth/logout
- Auth required: Yes (JwtAuthGuard)
- Response 200: `{ message: "Logged out" }`

## Business Rules

- Passwords hashed with bcrypt at cost factor 12
- Access tokens expire in 15 minutes (configurable via JWT_EXPIRES_IN env)
- Refresh tokens expire in 7 days (configurable via JWT_REFRESH_EXPIRES_IN env)
- Refresh token is hashed before storage — raw token never persisted
- Refresh token rotation: each use of /auth/refresh issues a new access token (refresh token itself is NOT rotated on each use to avoid mobile offline issues)
- Login endpoint always returns 401 on failure — never reveals which field is wrong
- Logout clears refreshToken field to null — invalidates all sessions for that user
- `getMe()` uses `findUniqueOrThrow` — returns 500 if user record is gone (should not happen in normal flow; JWT validation already guards this)

## Data Flow

Greenfield — no existing code analyzed.

## Dependencies

- 01-project-scaffolding — NestJS app, Prisma schema, ConfigModule

## Security

**Untrusted inputs:** email, password from login body; refreshToken from refresh body.

**Threat model:**
- Brute-force login → rate limiting at 5/15min per IP via ThrottlerGuard
- Token forgery → JWT signed with HS256 + `JWT_SECRET` / `JWT_REFRESH_SECRET` from env (`config.getOrThrow` — app refuses to start if either is unset)
- Stolen refresh token → bcrypt comparison required; raw token never stored
- Privilege escalation → role encoded in JWT payload, re-verified from DB on every request via `JwtStrategy.validate()`
- Deleted user retains access → mitigated: `JwtStrategy.validate()` hits DB on every request; deleted users receive 401 immediately

**What this module must NOT expose:**
- The bcrypt hash of any password in any response
- The stored hashed refreshToken in any response
- Which specific field (email vs password) caused a login failure
- The JWT secret via any response or log

## Known Issues

(none)

## Bugs

(none yet)
