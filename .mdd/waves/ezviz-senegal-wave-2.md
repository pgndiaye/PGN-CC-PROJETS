---
id: ezviz-senegal-wave-2
title: "Wave 2: Clients + Cloud Subscriptions"
initiative: ezviz-senegal
initiative_version: 3
status: complete
depends_on: ezviz-senegal-wave-1
demo_state: "Commercial can create clients, scan QR codes, and activate EZVIZ cloud subscriptions with offline sync"
created: 2026-05-19
hash: 13429432856abc54fb622333a66117e4
---

# Wave 2: Clients + Cloud Subscriptions

## Demo-State

Commercial can create clients, scan QR codes, and activate EZVIZ cloud subscriptions with offline sync.
*(This wave is not complete until this can be manually demonstrated.)*

## Features

| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | clients-module | docs/05-clients-module.md | complete | auth-module |
| 2 | cloud-module | docs/06-cloud-module.md | complete | clients-module |
| 3 | offline-sync | docs/07-offline-sync.md | complete | clients-module, cloud-module |

## Open Research

- [x] **QR code format** — **Decision: Full URL** → `https://app.ezvizsenegal.sn/clients/<cuid>`
  - Scannable by any QR reader; doubles as a deep link into the mobile app
  - Trade-off accepted: slightly longer QR, domain must remain stable
  - `qrcode` npm package generates the URL; mobile intercepts via deep-link or manual scan + API fetch
