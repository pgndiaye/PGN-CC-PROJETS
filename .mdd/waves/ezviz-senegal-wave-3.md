---
id: ezviz-senegal-wave-3
title: "Wave 3: Orders, Payments & Stock"
initiative: ezviz-senegal
initiative_version: 6
status: integration-pending
depends_on: ezviz-senegal-wave-2
demo_state: "Commercial can create orders paid via Mobile Money; stock decrements automatically; web dashboard shows live orders"
created: 2026-05-20
hash: 30f929e8d1359f1a53c2d85e4359982e
---

# Wave 3: Orders, Payments & Stock

## Demo-State
Commercial can create orders paid via Mobile Money; stock decrements automatically; web dashboard shows live orders.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | orders-module | docs/08-orders-module.md | integration-pending | — |
| 2 | mobile-money-payment | docs/09-mobile-money-payment.md | integration-pending | orders-module |
| 3 | stock-module | docs/10-stock-module.md | integration-pending | orders-module |
| 4 | web-dashboard | docs/11-web-dashboard.md | complete | orders-module, stock-module |

## Open Research
(none)
