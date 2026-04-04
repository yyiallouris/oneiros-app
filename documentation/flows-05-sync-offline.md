# Sync, offline-first storage, and logout

## Principles (`StorageService`, `SyncService`, `LocalStorage`)

- **Dreams and interpretations:** saved **locally first**; then queued as **unsynced** when applicable.
- **Reads:** return **local data immediately**; optional background `fetchAndMerge*` when online + authenticated.
- **Network gate:** `isOnline()` from `utils/network`; dev builds can **force offline** via `DevOfflineToggle` → `setForceOfflineMode`.

## Happy path — logged in, online

- After save: background `syncUnsyncedDreams` / `syncUnsyncedInterpretations`.
- `getDreams` / `getInterpretations` trigger background merge from remote.

## Happy path — offline create/edit dream

1. User saves dream while offline → local persist + unsynced queue.
2. When network returns (`onNetworkStateChange` in `RootNavigator`):
   - Sync unsynced dreams **first**.
   - Then `fetchAndMergeDreams` and `fetchAndMergeInterpretations`.

## Login

- New session (no previous session): `StorageService.initialize()` then background `fetchAndMergeDreams`, `fetchAndMergeInterpretations`, `syncAll`.

## Logout

- From Write menu: `supabase.auth.signOut()`.
- On session loss, `RootNavigator`:
  - Attempts **final sync** of unsynced dreams if any (best effort).
  - Clears local storage via `StorageService.clearAll()` and removes pending password reset flag.
  - Biometric **preference** intentionally not wiped in a way that loses per-user remote state (re-sync on next login).

## Regression — sync / offline

- Save dream offline → go online → dream appears in remote (or remains in queue if sync fails — logs `dream_sync_failed`).
- Delete dream: local immediate; `remoteDeleteDream` best-effort in background.
- Force offline (dev): AI and pattern generation should fail gracefully; saves still local.
- Logout with unsynced dreams: final sync attempted; if it fails, data may be lost locally on clear — document as known risk for QA.

## Symbol grouping cache

- `invalidateSymbolGroupingCache` on dream save so Insights re-aggregates.
