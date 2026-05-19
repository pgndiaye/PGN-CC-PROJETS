---
id: 04-mobile-auth
title: Mobile Auth — Login Screen + Navigation Shell
edition: Mobile
depends_on: [02-auth-module]
source_files:
  - apps/mobile/src/lib/api.ts
  - apps/mobile/src/lib/queryClient.ts
  - apps/mobile/src/hooks/useAuth.ts
  - apps/mobile/src/screens/LoginScreen.tsx
  - apps/mobile/src/navigation/AppNavigator.tsx
  - apps/mobile/App.tsx
routes: []
models: []
test_files: []
data_flow: greenfield
last_synced: 2026-05-19
status: complete
phase: all
mdd_version: 11
tags: [mobile, react-native, expo, auth, navigation, axios, react-query]
path: Mobile/Auth
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "@react-navigation v6 packages show deprecation warnings — upgrade to v7 when Expo 53 stabilises"
  - "Mobile typecheck not wired into root pnpm typecheck (Expo tsconfig requires Expo SDK setup to resolve)"
---

# 04 — Mobile Auth — Login Screen + Navigation Shell

## Purpose

Bootstraps the React Native mobile app with authentication flow and 5-tab navigation shell. Provides the login screen (email/password → JWT tokens stored in SecureStore), automatic token refresh on 401, and placeholder screens for all 5 main tabs (Accueil, Clients, Cloud, Commandes, SAV).

## Architecture

```
App.tsx
  SafeAreaProvider
  QueryClientProvider (queryClient)
  NavigationContainer
    AppNavigator (NativeStack)
      LoginScreen  — unauthenticated entry
      MainTabs (BottomTabs)
        Accueil · Clients · Cloud · Commandes · SAV
```

Token lifecycle:
- Login → save accessToken + refreshToken to SecureStore
- Axios request interceptor → attach Bearer header
- Axios 401 response interceptor → refresh once → retry → clear + redirect to Login

## Business Rules

- Tokens persisted in SecureStore (encrypted on device)
- Single in-flight refresh guard prevents refresh storms on concurrent 401s
- Logout clears tokens regardless of server response (try/finally)
- `useMe` has `retry: false` — fails fast when unauthenticated so the app can show Login

## Security

- Tokens stored in `expo-secure-store` (encrypted on-device, not AsyncStorage)
- Raw tokens never logged
- Refresh token cleared from device on logout and on failed refresh

## Known Issues

- `@react-navigation` v6 deprecation warnings — will resolve when upgrading to v7 post-Expo 53
- Mobile TypeScript not yet included in root `pnpm typecheck` (Expo SDK peer dep resolution requires `expo install`)

## Bugs

(none yet)
