---
generated: 2026-05-21
doc_count: 11
connection_count: 16
overlap_count: 6
---

## Path Tree

```
Clients
└── Clients                05-clients-module        complete
Cloud
└── Cloud                  06-cloud-module          complete
Commerce
├── Orders                 08-orders-module         in_progress
├── Payments               09-mobile-money-payment  in_progress
└── Stock                  10-stock-module          in_progress
Core
├── Auth                   02-auth-module           complete
└── Users                  03-users-module          complete
Dashboard
└── Web                    11-web-dashboard         in_progress
Foundation
└── Scaffolding            01-project-scaffolding   complete
Mobile
├── Auth                   04-mobile-auth           complete
└── OfflineSync            07-offline-sync          complete
```

## Dependency Graph

```mermaid
graph TD
  d01[01-project-scaffolding]:::complete
  d02[02-auth-module]:::complete
  d03[03-users-module]:::complete
  d04[04-mobile-auth]:::complete
  d05[05-clients-module]:::complete
  d06[06-cloud-module]:::complete
  d07[07-offline-sync]:::complete
  d08[08-orders-module]:::in_progress
  d09[09-mobile-money-payment]:::in_progress
  d10[10-stock-module]:::in_progress
  d11[web-dashboard]:::in_progress

  d02 --> d01
  d03 --> d01
  d03 --> d02
  d04 --> d02
  d05 --> d02
  d06 --> d02
  d06 --> d05
  d07 --> d05
  d07 --> d06
  d08 --> d02
  d08 --> d05
  d09 --> d02
  d09 --> d08
  d10 --> d08
  d11 --> d08
  d11 --> d10

  classDef complete fill:#00e5cc,color:#000
  classDef in_progress fill:#ffaa00,color:#000
  classDef draft fill:#888,color:#fff
  classDef deprecated fill:#555,color:#aaa
```

## Source File Overlap

Files referenced by 2+ docs:

| File | Referenced by |
|------|--------------|
| `apps/backend/prisma/schema.prisma` | 01-project-scaffolding, 05-clients-module, 06-cloud-module, 08-orders-module, 10-stock-module (5 docs) |
| `apps/backend/src/app.module.ts` | 01-project-scaffolding, 05-clients-module, 06-cloud-module (3 docs) |
| `apps/mobile/App.tsx` | 01-project-scaffolding, 04-mobile-auth, 07-offline-sync (3 docs) |
| `apps/mobile/src/navigation/AppNavigator.tsx` | 04-mobile-auth, 05-clients-module, 06-cloud-module (3 docs) |
| `apps/mobile/src/hooks/useClients.ts` | 05-clients-module, 07-offline-sync (2 docs) |
| `apps/mobile/src/hooks/useCloud.ts` | 06-cloud-module, 07-offline-sync (2 docs) |

## Warnings

(none)
