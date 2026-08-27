# Voice transcription reliability

This is the operational source of truth for Oneiros voice capture and transcription. Voice is treated as data-loss-sensitive input: uncertain model output must never be committed as if it were the user's words, and recoverable failures must retain the local clip.

## Production path

1. Before requesting microphone access, the app awaits stale-orphan cleanup, checks internal free space, then creates and verifies that `Documents/voice_pending/` is readable. Cleanup first validates queue/inbox attribution and deletes only old audio with no queue, inbox, or sidecar reference; unreadable/conflicting evidence fails closed. Native capture cannot start until the recovery destination exists; capture is blocked below a conservative 50 MiB floor with `insufficient_storage`, while typing remains available.
2. `expo-audio` records mono 16 kHz / 64 kbps AAC (WebM on web), with a native five-minute stop bound and an explicit `recordingStatusUpdate` error listener.
3. `stopRecording` finalizes and moves/renames the file into app-private `Documents/voice_pending/` before network work. Android exclusion-only rules omit that directory from cloud backup and device transfer without changing the platform's default backup scope for unrelated app data. During storage initialization, a root-directory sweep moves every recognized legacy Android clip (including orphan clips when AsyncStorage is unreadable); queue reads then commit or repair their URIs. A deterministic destination repairs a crash between move and snapshot write. When both legacy source and destination exist, source deletion requires equal byte counts and equal MD5 when both hashes are available. A partial, size-mismatched, or hash-mismatched destination is replaced through a temporary no-backup repair copy that is verified before promotion and verified again afterward; the source remains authoritative until both checks pass. iOS creates and excludes the directory at launch and individually excludes legacy root-level voice clips created by older builds. Normal finalization uses verified copy-then-source-delete only when a non-storage move failure requires fallback, avoiding a second full-sized file. A successful move is tracked separately from metadata verification, so a transient destination `getInfo` failure can never trigger a copy from the now-missing source.
4. Before `stopRecording` returns, the finalized clip enters a durable inbox through two independent manifests: a checksummed/revisioned AsyncStorage snapshot and a file sidecar beside the audio. Launch/foreground recovery idempotently promotes either copy into the queue.
5. `voiceTranscriptionQueueService.enqueue` writes checksummed, monotonically revisioned primary/backup queue snapshots. It removes inbox manifests only after the queue snapshot succeeds.
6. The authenticated `whisper-transcription` Edge Function requires a valid stable idempotency key, then validates auth, multipart size, MIME, audio size, and optional duration.
7. `reserve_voice_transcription` atomically reserves `(user_id, clip_id)` and returns a fencing `lease_id`. A per-user advisory lock also enforces two concurrent jobs, 20 acquired jobs/hour, and 100/day before provider work.
8. The language-neutral server strategy (`voice-transcription-v3.0.0-language-neutral`) calls OpenAI `gpt-transcribe` without an English prose prompt. A recovery pass may send model-detected `languages[]` and a low-temperature hint; this reduces sampling variance but does not promise deterministic output. The client cannot select the model or inject context.
9. `assessTranscriptQuality` gates the result before persistence. A suspicious first pass gets one bounded recovery pass.
10. Only an accepted result is cached. The mobile client runs the same gate again and non-destructively peeks the completed row. An owner-bound target command commits the full composer plus clip-ID dedupe ledger to dual snapshots, applies the committed text to the visible input immediately, and explicitly acknowledges that delivery by clip ID and committed composer revision. Queue/audio/sidecar acknowledgement then runs independently; failure leaves a non-uploadable `deletion_pending` tombstone without hiding the text. Commands capture both owner and visible base revision when created, so a delayed command cannot rebind across accounts and stale saves rebase identity-protected deliveries without `text.includes(transcript)`. Repeated identical transcripts therefore remain distinct insertions. Composer mutation fails closed if either snapshot is corrupt, divergent durable/visible typing is preserved, and hydration applies only while its captured edit revision remains current. A kill before commit leaves the queue row; a kill after commit restores or replays idempotently from the composer ledger.

The recording captures its owner before native preparation. Queue selection passes that expected owner and selected access token into upload; every fetch revalidates the active owner, while refresh accepts only a session for the same user. Logout/account switch aborts and deletes only the previous owner's work through `discardAllForUser(previousUserId)`. The same storage boundary invalidates queued old-owner composer commands, drains any command already writing inside local storage, and holds new commands behind a cleanup barrier; cleanup cannot complete while an old write can still recreate data. Cleanup uses integrity-aware reads: the highest intact revision alone is canonical active state, while older intact rows are deletion-attribution evidence only and can never resurrect acknowledged work. Immutable owner/audio conflicts fail closed. Cleanup succeeds only when every present snapshot is valid and complete, both manifest directories and all recognized sidecars parse successfully, every owned audio file is confirmed absent, and sidecar deletion is also absence-verified. Corruption, a dropped malformed entry, scan/parse failure, conflict, or any delete/verification failure raises `VOICE_OWNER_CLEANUP_INCOMPLETE`; queue/inbox metadata and the previous-owner fence remain intact for an idempotent retry. Auth transitions are serialized, allowing that cleanup to retry before user B initializes. Queue notifications, restore, delivery, composer ledgers, and circuit state are per-user, so user A's audio or failures can never cross into user B's session, UI, or retry budget.

Raw audio, transcript text, prompts, and local paths are never logged.

## The `Υπότιτλοι AUTHORWAVE` failure

`Υπότιτλοι AUTHORWAVE` is a known Greek Whisper hallucination signature, not text spoken by the user. Whisper-family encoder/decoder models can produce plausible caption credits, channel phrases, repeated text, or other training-data boilerplate during silence, long non-vocal spans, noise, clipping, or uncertain decoding. Similar reported signatures include `Subtitles by Amara.org` and repeated “thank you”/channel-credit text.

The previous implementation used `whisper-1` and considered every non-empty `text` field successful. That made a fluent hallucination indistinguishable from a valid transcript. The current contract addresses the failure at three levels:

- use the current general-purpose `gpt-transcribe` recommendation instead of legacy `whisper-1`;
- reject known caption boilerplate, severe duration/output mismatch, and repetition loops before caching;
- repeat the gate on-device so a previously cached or stale server response still cannot reach dream text.

The gate is deliberately conservative. It does not rewrite, summarize, or “clean up” a person's words. If both upstream passes remain suspicious, the server returns `LOW_CONFIDENCE_TRANSCRIPT`; the clip remains on-device for an explicit retry or re-record.

## Capture and interruption rules

- Recording can start offline.
- Recording cannot start on iOS/Android below the 50 MiB free-space safety floor or before the pending directory has been created and read back successfully. Failure to measure space is fail-open so an unavailable OS API does not disable healthy capture; directory preparation and every later write boundary still classify failures.
- A native `forDuration` bound and the UI timer both enforce five minutes.
- Pressing Stop immediately shows the compact busy indicator through file finalization and queue handoff; the idle microphone is never rendered between recording and transcription.
- Moving the app out of the foreground finalizes and queues the current clip instead of relying on background recording.
- If the OS/audio session reports that recording stopped or emits `recordingStatusUpdate.hasError`, the component finalizes exactly once and attempts to salvage the available file rather than silently dropping it.
- Navigating away while recording also finalizes and queues the clip.
- Clips under 500 ms are rejected as unusable.
- If a native encoder error resets duration to zero, a non-trivial partial file is conservatively salvageable (minimum 8 KiB at the configured bitrate) with unknown duration; a tiny/empty fragment is still rejected.
- Native stop, move/copy, manifest, and queue-write failures classify `ENOSPC`, `SQLITE_FULL`, Cocoa out-of-space, quota/disk-full messages, and a post-failure free-space reading as `insufficient_storage`.
- When move cannot complete because storage filled mid-recording, the readable source is retained and manifested in place. A source is deleted only after verified fallback copy and manifest persistence.
- If the pending directory becomes unreadable after capture has already started, Stop still inspects the known recorder URIs, retains the readable cache source, and attempts the independent AsyncStorage manifest instead of returning before salvage.
- If both tiny inbox manifests fail for any reason—including disk exhaustion, filesystem bridge failure, or AsyncStorage failure—the audio remains on-device, a process-lifetime emergency inbox keeps its owner/target, and `stopRecording` still returns the live clip for an immediate UI queue attempt. Error classification changes the message, never the salvage policy. No in-memory fallback can survive OS process termination when no durable metadata write is possible, so the UI never claims guaranteed recovery or advises immediate re-recording.
- AsyncStorage inbox and file-sidecar reads settle independently. A rejected AsyncStorage read cannot suppress a healthy file sidecar; if queue persistence is unavailable, the sidecar stays intact and is surfaced for a later promotion attempt. Snapshot healing writes are best-effort and never replace an already recovered read with an exception.
- Tolerant runtime reads may salvage a complete copy or valid subset, but they never overwrite a corrupt/partial snapshot with that subset. The damaged evidence remains visible to strict logout cleanup, which must retain the owner fence rather than mistake recovery for complete attribution.
- Strict reads never union mutable active rows. The newest intact revision is canonical; stale copies contribute only immutable owner/audio deletion evidence, and conflicts stop cleanup.
- A filesystem or queue exception becomes a visible/retryable state; it must not leave a row stuck in `transcribing`. Initial target restore also contains rejections so the UI never emits an unhandled Promise rejection.
- The recording module and UI both hold synchronous start mutexes, so rapid taps cannot prepare two native recorders.
- Async native start is fenced by a module generation token. Unmount/cleanup invalidates the generation even before the recorder is published globally; every awaited preparation boundary and both sides of `record()` check it, release the candidate, and reset audio mode rather than leaving an orphan recorder.

Physical-device checks remain mandatory for iOS interruptions/silent mode and Android finalization because Jest cannot reproduce native audio-session behavior.

## Failure handling matrix

| Failure | Server/client result | Clip policy |
|---|---|---|
| below 50 MiB before capture | `insufficient_storage`; explain that typing is available | no recording starts |
| pending directory cannot be created/verified | storage-classified or retryable capture failure | native recorder never starts |
| disk fills during native stop | classify storage failure; salvage readable partial clip once | retain and queue/manifest when possible |
| move/copy reports out-of-space | keep readable source; do not delete it | retain in source and manifest in place |
| AsyncStorage rejected/unavailable | independently read and surface file sidecar; do not clear it until queue persistence succeeds | retain for later promotion |
| both AsyncStorage + sidecar writes fail | return live clip for UI enqueue regardless of error classification; retain volatile owner/target | retain; never silently continue to another candidate |
| logout/account switch queue read fails | `VOICE_OWNER_CLEANUP_INCOMPLETE`; retry on the serialized auth/storage boundary | retain previous-owner fence; do not report cleanup success |
| queue/inbox snapshot corrupt or partial; sidecar scan/parse fails | `VOICE_OWNER_CLEANUP_INCOMPLETE`; strict cleanup does not use a healed subset | retain all metadata and previous-owner fence |
| logout/account switch audio delete or absence verification fails | `VOICE_OWNER_CLEANUP_INCOMPLETE` with `audio_delete_failed` | retain queue/inbox rows and previous-owner fence; retry idempotently |
| logout/account switch sidecar delete cannot be confirmed | `VOICE_OWNER_CLEANUP_INCOMPLETE` with `manifest_delete_failed` | retain queue/inbox rows and previous-owner fence |
| delivery/discard/expiry delete or sidecar cleanup fails | show the durably committed transcript first; persist `deletion_pending` before destructive work; hide tombstone from upload/delivery and retry cleanup idempotently | retain tombstone until audio, file sidecars, and inbox copies are confirmed absent |
| delayed typed save or composer hydration finishes late | bind owner/base revision at command creation; rebase protected delivery by clip ID/revision; reject stale hydration revision | preserve newly typed text, repeated identical speech, and committed transcript |
| logout/account switch races a queued composer command | invalidate old-owner queued commands, drain in-storage writes, and barrier new commands until cleanup completes | no cross-account text and no write after cleanup |
| legacy Android root clip | move to deterministic `voice_pending/` destination, then commit repaired queue URI; next read repairs an interrupted commit | retain source unless destination size and available MD5 match; verify repair copy before and after promotion when replacing partial/corrupt destination |
| unmount during async recorder start | invalidate start generation, release after the pending native step settles | no recorder is published or left running |
| Offline | queued; drain resumes on reconnect/foreground/launch | retain |
| 401/expired session | refresh only for the clip's expected owner; account mismatch cancels | retain until logout policy/discard |
| 409 active duplicate/completion fence loss | derive retry from current lease expiry, return body + `Retry-After`, and schedule one durable queue retry rather than short HTTP retries | retain |
| 429 | respect bounded `Retry-After` | retain |
| timeout/network/5xx | at most two HTTP attempts per queue cycle; bounded queue retry with jitter | retain |
| bad/too-large audio | needs attention | retain until user discards/re-records |
| suspicious transcript after recovery | `LOW_CONFIDENCE_TRANSCRIPT` | retain; never append |
| unexpected queue item exception | immediate `retrying`, not a stale processing row | retain |
| success | fenced 24-hour idempotency cache; durable composer commit with clip-id dedupe, then queue/audio acknowledge | delete only after commit |

## Idempotency, leases, and retention

- Client clip ids are stable across retries and scoped to the authenticated user.
- Missing or malformed `X-Idempotency-Key` is rejected with `400`; the server never invents a dedupe key.
- The database lease is a fencing token. A stale worker cannot delete or commit over a reclaimed request.
- Per-user reservation is serialized with an advisory transaction lock. At most two provider jobs may be active, with rolling ceilings of 20 acquired jobs/hour and 100/day. Recovery remains limited to one extra provider pass inside an acquired job.
- Processing locks become reclaimable after four minutes, longer than the bounded server attempt path.
- If fenced completion loses its lease, the function reads the actual row state: an already-completed row returns its cached transcript; otherwise the remaining four-minute lease duration is returned in `retry_after_ms` and `Retry-After`. The client schedules that delay in the durable queue without consuming immediate HTTP retries.
- Completed server cache rows expire after 24 hours.
- Device auto-retry stops after three queue cycles (each with at most two HTTP attempts) and changes to `needs_attention`; three consecutive systemic failures open a five-minute per-user process circuit breaker.
- Pending device clips expire after seven days and are removed on logout/account switch. Expiry first persists `deletion_pending`; filesystem or metadata failure retains that non-uploadable tombstone for the next foreground/drain instead of dropping attribution.
- The service-role-only rolling-attempt ledger retains seven days for enforcement/operations; its global retention predicate has a dedicated `created_at` index, and transcript text/audio are never stored in that ledger.

## Observability

Safe telemetry includes request/clip id, status, attempt number, byte size, duration, detected language codes, quality issue category, whether recovery ran, and whether a response was cached. Never add transcript text, audio bytes, prompts, or file URIs to logs.

Release monitoring should alert on elevated rates of:

- `transcript quality recovery started`;
- `LOW_CONFIDENCE_TRANSCRIPT` / `voice_transcription_client_quality_rejected`;
- upstream 429, timeout, 401/403, and 5xx;
- completion fencing failures;
- queue read/write or unmount-finalization errors.
- inbox recovery, snapshot checksum/revision recovery, circuit-open events, and owner-mismatch cancellations.
- low-storage preflight blocks, native recorder errors, partial salvage, move fallback, and deferred-manifest events.

## Research and vendor references

- [OpenAI file transcription guide](https://developers.openai.com/api/docs/guides/speech-to-text) — current model, context, language hints, formats, and size contract.
- [Whisper paper](https://arxiv.org/abs/2212.04356) — model/training architecture and multilingual evaluation.
- [Careless Whisper: Speech-to-Text Hallucination Harms](https://arxiv.org/abs/2402.08021) — measured full-phrase hallucinations and their association with longer non-vocal spans.
- [OpenAI Whisper hallucination/repetition discussion](https://github.com/openai/whisper/discussions/679) and [silence-threshold implementation](https://github.com/openai/whisper/pull/1838) — decoder loops, non-speech, VAD, and timestamp mitigation history in the open-source implementation.
- [`Υπότιτλοι AUTHORWAVE` issue report](https://github.com/Purfview/whisper-standalone-win/issues/321) — the exact Greek caption-credit signature.
- [Expo AV deprecation notice](https://docs.expo.dev/versions/v54.0.0/sdk/av/) — `expo-av` is unpatched in SDK 54 and removed in SDK 55; use `expo-audio`.
- [Expo Audio SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/audio/) — recorder state plus `recordingStatusUpdate` completion/error events.
- [Expo FileSystem legacy SDK 54](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem-legacy/) — internal free-space bytes and app-private move semantics on iOS/Android.
- [Android Auto Backup rules](https://developer.android.com/identity/data/autobackup) — `fullBackupContent` plus Android 12+ cloud/device-transfer exclusions.
- [Apple `isExcludedFromBackupKey`](https://developer.apple.com/documentation/foundation/urlresourcekey/isexcludedfrombackupkey) — excludes the pending-audio directory from app-data backups.

## Verification and deployment

Run:

```bash
npm run typecheck
npm run test:flows
npm test
deno check supabase/functions/whisper-transcription/index.ts
```

Native release QA must additionally inspect an iOS backup and Android `bmgr`/device-transfer behavior to confirm `voice_pending/` is absent. Jest verifies the native/config contracts but cannot execute OS backup transports.

Apply and deploy in this order:

```bash
supabase db push
supabase functions deploy whisper-transcription
```

The migration is `supabase/migrations/20260826120000_fence_voice_transcription_leases.sql`.
