---
generated: 2026-05-20
doc_count: 7
connection_count: 8
overlap_count: 3
---

# MDD Connections Map

## Path Tree

```
Both/
  ├── Scaffolding       01-project-scaffolding  complete
  └── Clients           05-clients-module       complete
Cloud/
  └── Subscriptions     06-cloud-module         complete
Core/
  ├── Auth              02-auth-module          complete
  └── Users             03-users-module         complete
Mobile/
  ├── Auth              04-mobile-auth          complete
  └── OfflineSync       07-offline-sync         complete
```

## Dependency Graph

```mermaid
graph TD
  s["01-project-scaffolding"]:::complete
  auth["02-auth-module"]:::complete
  users["03-users-module"]:::complete
  mauth["04-mobile-auth"]:::complete
  clients["05-clients-module"]:::complete
  cloud["06-cloud-module"]:::complete
  offline["07-offline-sync"]:::complete

  s --> auth
  s --> users
  auth --> users
  auth --> mauth
  auth --> clients
  auth --> cloud
  clients --> cloud
  clients --> offline
  cloud --> offline

  classDef complete fill:#00e5cc,color:#000
  classDef in_progress fill:#ffaa00,color:#000
  classDef draft fill:#888,color:#fff
  classDef deprecated fill:#555,color:#aaa
```

## Source File Overlap

Files referenced by 2+ feature docs:

| File | Referenced by |
|------|---------------|
| `apps/backend/src/app.module.ts` | 01-project-scaffolding, 05-clients-module, 06-cloud-module |
| `apps/backend/prisma/schema.prisma` | 01-project-scaffolding, 05-clients-module, 06-cloud-module |
| `apps/mobile/src/navigation/AppNavigator.tsx` | 04-mobile-auth, 05-clients-module, 06-cloud-module |

## Warnings

(none — all depends_on references resolve, no circular dependencies, all docs have path field)
