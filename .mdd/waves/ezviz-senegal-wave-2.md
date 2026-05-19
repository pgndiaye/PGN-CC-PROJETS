---
id: ezviz-senegal-wave-2
title: "Wave 2: Clients + Cloud Subscriptions"
initiative: ezviz-senegal
initiative_version: 3
status: planned
depends_on: ezviz-senegal-wave-1
demo_state: "Commercial can create clients, scan QR codes, and activate EZVIZ cloud subscriptions with offline sync"
created: 2026-05-19
hash: ebbf085915007261ca4da9e03a0aaf91
---

# Wave 2: Clients + Cloud Subscriptions

## Demo-State

Commercial can create clients, scan QR codes, and activate EZVIZ cloud subscriptions with offline sync.
*(This wave is not complete until this can be manually demonstrated.)*

## Features

| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | clients-module | — | planned | auth-module |
| 2 | cloud-module | — | planned | clients-module |
| 3 | offline-sync | — | planned | clients-module, cloud-module |

## Open Research

- [x] **QR code format** — **Decision: Full URL** → `https://app.ezvizsenegal.sn/clients/<cuid>`
  - Scannable by any QR reader; doubles as a deep link into the mobile app
  - Trade-off accepted: slightly longer QR, domain must remain stable
  - `qrcode` npm package generates the URL; mobile intercepts via deep-link or manual scan + API fetch
