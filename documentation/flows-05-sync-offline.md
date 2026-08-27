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

## Voice transcription offline capture

- Voice recording is never blocked by connectivity. Before native capture, Oneiros completes stale cleanup, applies the 50 MiB safety floor, and creates plus verifies the pending directory. On stop, it moves the compressed clip into backup-excluded `Documents/voice_pending/` without normal-path duplication, then saves an AsyncStorage inbox snapshot and independent file sidecar before UI ownership. Recovery reads those sources independently and promotes the clip into checksummed/revisioned primary + backup queue snapshots before attempting network work.
- If the disk fills after capture starts, native stop/error events, move/copy, sidecar, and AsyncStorage failures are rechecked and classified as `insufficient_storage`. A readable partial/source clip is retained; either persisted inbox copy is sufficient. When both metadata writes fail—even for a generic bridge error—the live clip is still returned for UI enqueue and a process-lifetime emergency inbox retains owner/target while the app process survives.
- Offline clips automatically retry on reconnect, app foreground, and next launch. A completed transcript remains queued until its original Write/chat surface commits a per-user durable composer snapshot with clip-ID dedupe. That committed text is applied to the visible input immediately and acknowledged explicitly by clip ID plus composer revision; queue/audio cleanup then runs independently. A cleanup failure keeps `deletion_pending` but never withholds the text. Composer commands capture owner and visible base revision at creation, enter a target coordinator synchronously, and rebase stale saves without substring inference, so two identical transcripts remain two insertions. Delayed hydration is rejected after any user edit. A restart before commit keeps the queue row; a restart after commit restores the composer and dedupes replay.
- Pending raw audio stays only on the device, is deleted after delivery/discard, and expires after seven days. Every destructive path first persists a non-uploadable `deletion_pending` tombstone and removes it only after audio, file sidecars, and AsyncStorage inbox copies are confirmed absent. OS termination or filesystem failure delays cleanup until the next foreground/drain without losing attribution.
- Queue mutations are serialized; an unexpected per-item exception immediately becomes `retrying`. Automatic retry is bounded to three queue cycles with two HTTP attempts each, backed by a per-user systemic circuit breaker. A completion fence conflict returns the remaining database-lease duration in both `retry_after_ms` and `Retry-After`; the client schedules it directly in the durable queue instead of burning short HTTP retries. Stuck `transcribing` rows reclaim only after the full client budget plus safety buffer (~9+ minutes) and never while this process still owns the upload. Account switch/logout uses `discardAllForUser(previousUserId)` and owner-scoped aborts. Strict cleanup rejects corrupt/partial snapshots, dropped malformed entries, unreadable/invalid sidecars, immutable attribution conflicts, or unverifiable deletion. The newest intact revision alone defines active rows; older intact copies are deletion evidence only and cannot resurrect acknowledged work. Metadata plus the prior-owner fence remain until all owned files are confirmed absent. Each upload revalidates the captured owner before fetch/refresh so sessions cannot cross.
- Storage initialization and every queue read migrate legacy Android root audio into backup-excluded `voice_pending/`. Move happens before the URI snapshot; if persistence fails after the move, the next read recognizes the deterministic destination and repairs the stale URI. A pre-existing destination is accepted only when its size and available MD5 agree with the source; otherwise a temporary no-backup repair copy is verified before and after promotion, and the authoritative source is retained until both checks pass.
- Logout/account switch also fences the composer layer: commands are bound to the owner observed when created, old-owner queued commands are invalidated, writes already inside local storage are drained before deletion, and commands created during cleanup wait behind its barrier. User A text therefore cannot execute as user B or reappear after cleanup.

## Login

- New session (no previous session): `StorageService.initialize()` then background `fetchAndMergeDreams`, `fetchAndMergeInterpretations`, `syncAll`.

## Logout

- From Write menu: `supabase.auth.signOut()`.
- On session loss, `RootNavigator`:
  - Attempts **final sync** of unsynced dreams if any (best effort).
  - Serializes cleanup against later auth events and discards only the logged-out owner's voice queue/audio.
  - Clears local storage via `StorageService.clearAll()` and removes pending password reset flag.
  - Biometric **preference** intentionally not wiped in a way that loses per-user remote state (re-sync on next login).

## Regression — sync / offline

- Save dream offline → go online → dream appears in remote (or remains in queue if sync fails — logs `dream_sync_failed`).
- Delete dream: local immediate; `remoteDeleteDream` best-effort in background.
- Force offline (dev): AI and pattern generation should fail gracefully; saves still local.
- Logout with unsynced dreams: final sync attempted; if it fails, data may be lost locally on clear — document as known risk for QA.

## Symbol grouping cache

- `invalidateSymbolGroupingCache` on dream save so Insights re-aggregates.
