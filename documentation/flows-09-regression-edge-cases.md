# Regression catalog: edge cases and negative paths

Use this as a **checklist** alongside per-area docs. Not every branch is listed; prioritize flows tied to data loss, auth, and money/time (AI calls).

## Auth & session

- [ ] Login wrong password → clear message; no session.
- [ ] Login unverified email → verification UI, not generic error.
- [ ] Sign up weak password / mismatch → validation.
- [ ] OTP invalid / expired → error; resend rate limit.
- [ ] Forgot password → resend cooldown; invalid email submission.
- [ ] Recovery link used twice / stale → verify error path.
- [ ] Apple sign-in on physical iPhone → success, cancel, and Supabase provider disabled/error states.
- [ ] Google / Discord OAuth dismiss with no session → provider-specific “cancelled” path.
- [ ] Offline at login → network error handling.

## Onboarding & lock

- [ ] Skip onboarding vs complete; re-login same user skips.
- [ ] Biometric fail / cancel on lock screen; retry.
- [ ] App background during permission dialog does not permanently break lock state (debounce behavior).

## Dreams

- [ ] Write: save large text; rapid save; draft race with midnight rollover.
- [ ] Editor: change date; new dream from calendar; delete confirm cancel.
- [ ] Journal: search no results; clear search; filter from insights then clear filter (`setParams`).
- [ ] Dream detail: missing id → “Dream not found”.
- [ ] Voice: offline capture saves locally; permission denied offers Settings; only one recording can be active.
- [ ] Voice: rapid double tap during auth/permission/native preparation creates exactly one recorder and shows a preparing state.
- [ ] Voice: deferred native preparation followed by component unmount invalidates the module generation; after preparation settles, the recorder is released and `record()` is never called.
- [ ] Voice: stale-orphan cleanup completes before the 50 MiB free-space preflight; it never deletes a queue/inbox/sidecar-attributed clip and fails closed on unreadable evidence. `voice_pending/` is created and verified before `record()`, and low storage blocks before microphone permission while offering typing.
- [ ] Voice: `ENOSPC`/Cocoa/`SQLITE_FULL` at prepare, native stop, move/copy, sidecar, and queue persistence maps to `insufficient_storage`; warning appears at 4:30 and recording auto-stops at 5:00.
- [ ] Voice: native recorder `hasError` finalizes once; a readable ≥500 ms partial clip survives, including the conservative ≥8 KiB path when native duration resets to zero.
- [ ] Voice: normal finalization uses move/rename without duplicate audio storage; non-storage move failure falls back to verified copy, while out-of-space move failure retains and manifests the source.
- [ ] Voice: if `voice_pending/` becomes unavailable after native capture starts, Stop still inspects and manifests/returns the readable cache source.
- [ ] Voice: pressing Stop transitions directly from the stop icon to progress; the idle microphone never flashes during native finalization or queue handoff.
- [ ] Voice: backgrounding, navigating away, native auto-stop, and audio-session interruption each finalize/queue the available clip exactly once.
- [ ] Voice: timeout, network loss, 429, and 5xx preserve the clip and offer retry/discard; successful delivery deletes the local clip only after a durable composer commit.
- [ ] Voice: queued → transcribing → retrying/needs-attention status remains visible after navigation/relaunch; reconnect and Retry now resume processing.
- [ ] Voice: crash mid-upload reclaims stuck `transcribing` only after the full client budget plus safety buffer (~9+ minutes); healthy long uploads are never dropped mid-flight.
- [ ] Voice: Write pending notes remain visible with the stable `active` target after midnight; kill before composer commit keeps the completed queue row, while kill after commit restores durable composer text and clip-ID dedupe prevents a second append.
- [ ] Voice: a queued save created for user A cannot persist into user B after account switch, and no delayed composer write can recreate A's data after logout cleanup; commands created during cleanup wait for its owner barrier.
- [ ] Voice: a post-commit stale whole-text save rebases protected speech by clip ID/revision rather than transcript substring; existing `"yes"` plus spoken `"yes"` survives as two insertions across app kill. Delayed Write/chat hydration cannot overwrite text typed after the read began.
- [ ] Voice: corrupt/partial composer snapshots fail transcript commit closed (queue/audio remain); divergent durable and currently visible typing are both preserved before speech is appended. Durable commit updates the visible input before queue/audio cleanup, and a sidecar cleanup failure leaves `deletion_pending` without suppressing that text.
- [ ] Voice: acknowledge, discard, and seven-day expiry persist `deletion_pending` before filesystem work; audio/sidecar/inbox deletion failure retains a hidden, non-uploadable tombstone that completes on a later foreground/drain without ghost recovery.
- [ ] Voice: duplicate clip requests return the durable cached transcript, concurrent requests do not start duplicate provider jobs, and stale processing locks recover.
- [ ] Voice: queue restore/delivery and composer ledgers are scoped to the active user so an account switch can never expose or append another user's pending transcript.
- [ ] Voice: account switch between queue selection and fetch cancels the attempt; delayed logout cleanup for user A is serialized and owner-scoped, so it never aborts/deletes user B's queue or audio.
- [ ] Voice: queue read rejection during logout/account switch raises cleanup-incomplete; no audio/metadata is guessed from an empty list, and A's owner fence cannot be cleared or replaced by B.
- [ ] Voice: corrupt/partial queue or inbox snapshots, dropped malformed entries, sidecar parse/directory scan failure, and unverifiable sidecar deletion all retain `VOICE_OWNER_CLEANUP_INCOMPLETE` plus A's owner fence.
- [ ] Voice: newest intact queue/inbox revision alone defines active rows; a stale backup can supply deletion evidence but cannot override mutable state or resurrect an acknowledged ID, and immutable owner/audio conflicts fail closed.
- [ ] Voice: `deleteAsync` rejection or post-delete existence during logout/account switch raises cleanup-incomplete; queue/inbox rows and A's owner fence remain unchanged until every owned clip is confirmed absent.
- [ ] Voice: completion fencing conflict returns the remaining lease delay in body and `Retry-After`; the client schedules it durably without exhausting short retries before stale-lease reclaim.
- [ ] Voice: AsyncStorage enqueue failure/unmount recovers from the durable inbox or file sidecar; a true AsyncStorage rejection still surfaces the healthy file sidecar, healing-write failure still returns recovered rows, and target restore never produces an unhandled rejection.
- [ ] Voice: generic non-ENOSPC failures of both sidecar and AsyncStorage manifest writes still return the live clip to UI enqueue and keep the volatile owner/target mapping.
- [ ] Voice: missing/invalid idempotency keys return `400`; two active jobs, 20 hourly acquisitions, and 100 daily acquisitions enforce `429` before provider work.
- [ ] Voice: automatic attempts stop after three queue cycles × two HTTP attempts; systemic failures open the five-minute per-user circuit breaker and user A's open circuit never delays user B.
- [ ] Voice: `Υπότιτλοι AUTHORWAVE`, Amara/subtitle credits, severe long-audio/short-text mismatch, and repetition loops trigger recovery and are never appended/cached if recovery remains suspicious.
- [ ] Voice: stale workers cannot complete or release a reclaimed request because completion/deletion is fenced by `lease_id`.
- [ ] Voice: pending files/sidecars live under `voice_pending/`; Android exclusion-only rules preserve default backup scope for unrelated data, while iOS excludes both the directory and legacy root clips. Inspect iOS backup and Android cloud + device-transfer output physically.
- [ ] Voice: legacy Android root clip migrates to `voice_pending/` and its queue URI updates; simulate a crash after move/before queue write and confirm the next read repairs the URI.
- [ ] Voice: if legacy source and destination coexist, delete the source only when byte counts and available MD5 hashes match; a zero-byte, partial, size-mismatched, or hash-mismatched destination uses a temporary no-backup repair copy verified before and after promotion, without deleting the source first.
- [ ] Voice: a successful move followed by transient destination metadata failure keeps/manifests the destination and never copies from the missing source.
- [ ] Voice: on physical iPhone and Android, verify low-space preflight, disk filling mid-recording, native error event, stop salvage, move/copy fallback, and queue recovery; also verify iOS silent-mode recording.

## Sync & offline

- [ ] Offline save → online: appears after reconnect.
- [ ] `DevOfflineToggle`: forced offline blocks online-only features.
- [ ] Logout with pending unsynced: final sync success vs failure (expect local clear regardless).
- [ ] Cold start with stored owner A and no session → sign in B: A cleanup completes before B route state/local data, then the stored owner becomes B.

## AI reflection

- [ ] Offline: cannot start reflection; offline banner behavior.
- [ ] Online: API error restores chat input where implemented.
- [ ] Proxy auth: missing/expired Supabase session cannot forward dream/chat payloads to `openai-proxy`.
- [ ] Gateway → proxy: `ai-entitlements-gateway` must forward the user JWT; a service-role bearer to `openai-proxy` returns `Unauthorized`.
- [ ] Malformed extraction JSON after a successful reflection must not fail the whole reflection (empty metadata fallback).
- [ ] Async reflection status: `dream_reflection_generate` returns a pending quota event quickly, `dream_reflection_status` polls until committed/released, and regenerate does not confuse an older interpretation for the new result.
- [ ] Async metadata: a committed reflection with `metadata_status: pending` renders reflection/chat immediately, starts `dream_metadata_extract`, restarts enrichment if a pending row is loaded later, refreshes metadata, and does not spend/release additional quota.
- [ ] Max assistant responses reached → no further sends.
- [ ] Regenerate interpretation after editing dream text.

## Insights & reports

- [ ] Period “All time” with zero dreams.
- [ ] Pattern report: offline; language switch; month with no interpretations (empty entries).
- [ ] Collective section: placeholder empty state until backend exists.
- [ ] Journey swipe through all four sections with same period label in header/caption.

## Subscriptions and storefront pricing

- [ ] iOS storefronts with EUR, USD, GBP, and a long-format currency render the exact StoreKit price without clipping.
- [ ] Annual cards keep the full billed total primary; monthly equivalent and savings use the paired products' numeric prices and currency.
- [ ] Missing one SKU disables only that plan; partial product responses never inject a EUR fallback.
- [ ] Currency mismatch or missing numeric price hides derived savings/equivalent without blocking a valid store product.
- [ ] Store fetch loading, offline failure, unsupported runtime, and foreground refresh never leave a stale purchasable price.
- [ ] Android free-trial offers show the recurring renewal price, not the zero-cost introductory phase.

## Legal / release

- [ ] Privacy screen opens hosted Privacy Policy and Terms URLs when configured.
- [ ] App Store Connect privacy labels match account data, dream/user content, voice audio, support messages, and AI subprocessors.
- [x] v1 is intentionally iPhone-only (`ios.supportsTablet: false`); iPad support and screenshots are deferred until dedicated tablet QA.

## Automated tests today

- `e2e/login.e2e.ts` — Detox: auth screen visible, Sign in, and social provider buttons by accessibility label / testID. Apple sign-in still needs physical iPhone/TestFlight validation.
- `__tests__/` — unit tests for AI client and Supabase helper; expand e2e as product stabilizes.

## Deep links (manual)

- [ ] `oneiros-dream-journal://` confirm signup.
- [ ] Recovery link sets pending reset → SetPassword.
- [ ] Malformed URL → no crash; handled false.
