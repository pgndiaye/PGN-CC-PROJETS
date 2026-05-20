---
id: 07-offline-sync
title: Offline Sync
edition: Mobile
depends_on: [05-clients-module, 06-cloud-module]
source_files:
  - apps/mobile/src/lib/offlineCache.ts
  - apps/mobile/src/hooks/useNetworkStatus.ts
  - apps/mobile/src/components/OfflineBanner.tsx
  - apps/mobile/App.tsx
  - apps/mobile/src/hooks/useClients.ts
  - apps/mobile/src/hooks/useCloud.ts
routes: []
models: []
test_files: []
data_flow: greenfield
last_synced: 2026-05-20
status: complete
phase: all
mdd_version: 11
tags: [offline, sqlite, netinfo, react-native, cache, sync, expo]
path: Mobile/OfflineSync
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Mutation queue (queuing writes when offline) is deferred to Wave 3 — Wave 2 blocks writes when offline with clear feedback"
  - "Cache invalidation on server-side changes is not handled (no WebSocket in Wave 2)"
---

# 07 — Offline Sync

## Purpose

Enables the mobile app to function in low-connectivity environments common in Senegalese field operations. Reads from a local SQLite cache when offline so Commercials can browse client and subscription data without network. Writes are blocked offline with a clear UI message. React Query's online manager is wired to NetInfo so queries auto-refresh the moment connectivity is restored.

## Architecture

```
App.tsx
  → initDb()                      ← initialise SQLite tables on boot
  → onlineManager.setEventListener(NetInfo) ← wire RQ to network events

useClients / useCloud hooks
  → queryFn: try API fetch → save to SQLite cache
             catch network error → return SQLite cache (stale data)
  → mutations: check isOnline → if offline, throw OfflineError (no API call)

useNetworkStatus.ts
  → NetInfo.addEventListener → { isOnline }

OfflineBanner.tsx
  → shown when !isOnline
  → displays "Hors connexion — données locales" notice

offlineCache.ts
  → expo-sqlite (sync API)
  → tables: clients (id, data, synced_at), cloud_subscriptions (id, data, synced_at)
  → ops: saveClients(), getCachedClients(), saveSubscriptions(), getCachedSubscriptions()
```

## Business Rules

- Reads: always show data (from API or SQLite cache, transparent to user)
- Writes: blocked when offline — mutation throws `OfflineError`, UI shows toast
- Cache is overwritten on every successful fetch (no merge/conflict logic)
- Cache persists across app restarts via SQLite (not memory-only)
- React Query's `onlineManager` handles automatic refetch on reconnect — no custom polling

## Data Flow

Greenfield — no pre-existing code analyzed. All data flows from API → SQLite cache → UI.

## Dependencies

- 05-clients-module — Client type + useClients hook (extended)
- 06-cloud-module — CloudSubscription type + useCloud hook (extended)

## Security

SQLite file stored in app's private sandbox (not accessible to other apps). No tokens or credentials cached — only client and subscription data.

## Known Issues

- Mutation queue (write-when-offline + replay-on-reconnect) deferred to Wave 3
- Cache invalidation on server changes: not handled (no push/WebSocket in Wave 2)

## Bugs

(none yet)
