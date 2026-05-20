---
id: ezviz-senegal
title: EZVIZ Sénégal Management System
status: active
version: 6
hash: 2d1fdcfe78d600c0cb640dad19161e45
created: 2026-05-19
---

# EZVIZ Sénégal Management System

## Overview

Full-stack field operations platform for an EZVIZ security camera business in Senegal. Manages the complete commercial lifecycle: client onboarding (with QR code scanning), EZVIZ cloud subscriptions (activation + expiration tracking), sales orders with Mobile Money payments (Orange Money, Wave), stock management, and after-sales service (SAV) with technician assignment and photo upload. Built as a TypeScript monorepo — NestJS 10 + Prisma + PostgreSQL backend, React Native + Expo mobile app — deployed on Coolify with Grafana monitoring.

Target users: **ADMIN** (full access), **COMMERCIAL** (clients, cloud, orders, stock), **TECHNICIEN** (SAV + client read).

## Open Product Questions

- [x] Production hosting: PostgreSQL host spec, Coolify server configuration, domain and SSL setup — tracked as Wave 5 pre-condition (see waves/ezviz-senegal-wave-5.md)

## Waves

| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/ezviz-senegal-wave-1.md | Admin can log in with JWT auth; role-based access enforced; first Expo build runs on device | complete |
| Wave 2 | waves/ezviz-senegal-wave-2.md | Commercial can create clients, scan QR codes, and activate EZVIZ cloud subscriptions with offline sync | complete |
| Wave 3 | waves/ezviz-senegal-wave-3.md | Commercial can create orders paid via Mobile Money; stock decrements automatically; web dashboard shows live orders | planned |
| Wave 4 | waves/ezviz-senegal-wave-4.md | Technicien can open SAV tickets with photos, assign interventions, and receive push/SMS/WhatsApp notifications | planned |
| Wave 5 | waves/ezviz-senegal-wave-5.md | MVP deployed on Coolify with Grafana monitoring active; team trained; full technical documentation delivered | planned |
