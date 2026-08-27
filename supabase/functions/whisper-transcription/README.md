# `whisper-transcription`

Authenticated, idempotent proxy for OpenAI file transcription. The legacy function name is retained so released clients keep the same endpoint; production transcription uses `gpt-transcribe`, not `whisper-1`.

The mobile app records optional dream voice notes locally and sends a bounded multipart request. Capture awaits stale cleanup, applies a 50 MiB iOS/Android free-space floor, creates and verifies its backup-excluded pending directory before `record()`, generation-fences async native start against unmount, listens for native recorder errors, and uses move-first partial-clip salvage before the durable inbox/queue. A dual-manifest failure still returns the live clip for UI enqueue regardless of error classification. Audio is not stored by this function. See [`../../../docs/TRANSCRIPTION_RELIABILITY.md`](../../../docs/TRANSCRIPTION_RELIABILITY.md) for the complete capture, low-storage, queue, hallucination, recovery, and operations contract.

## Auth and request contract

The function uses `verify_jwt = false` so it can answer CORS preflight and normalize errors, but manually verifies the `Authorization: Bearer <Supabase access token>` user before parsing multipart audio. The client also sends the Supabase `apikey`.

`POST` requires:

- `file`: one non-empty AAC, M4A/MP4, MP3/MPEG, WAV, or WebM file; maximum 20 MiB
- `duration_ms`: optional for legacy queued clips; new clients send 500–315,000 ms
- `X-Idempotency-Key`: required stable client clip id (8–100 safe characters); missing/invalid values return `400 INVALID_IDEMPOTENCY_KEY`

The model and transcription strategy are server-owned. Client-supplied `model` or `prompt` fields are ignored. Strategy `voice-transcription-v3.0.0-language-neutral` deliberately sends no prose prompt on the primary request because the spoken language is unknown. The single recovery request may reuse model-detected `languages[]` and a temperature `0` hint, which reduces variance but does not guarantee deterministic output.

## Processing contract

1. Reject unauthenticated and oversized requests before multipart parsing where `Content-Length` is available.
2. Validate file and duration before acquiring a database reservation.
3. Reserve `(user_id, clip_id)` through the service-role-only `reserve_voice_transcription` RPC. The RPC serializes reservations per user and enforces at most two active jobs, 20 acquired jobs/hour, and 100/day.
4. Call `gpt-transcribe` without an English prompt; this avoids steering Greek/code-switched audio with mismatched language context.
5. Run the shared transcript quality commit gate. Known caption boilerplate (including `Υπότιτλοι AUTHORWAVE`), implausibly short long-recording output, empty output, and repetition loops trigger one recovery pass.
6. If recovery is still suspicious, return `LOW_CONFIDENCE_TRANSCRIPT` and do not cache it.
7. Commit only with the current `lease_id` fencing token. If completion loses the fence, read the actual row: return an already-cached completion, or return `409` with `retry_after_ms` and `Retry-After` calculated from the remaining four-minute lease. The client schedules that delay in its durable queue instead of consuming short immediate retries.

The primary upstream timeout is 90 seconds; the exceptional recovery pass is bounded to 60 seconds. Raw upstream bodies, audio URIs/bytes, prompts, and transcript content are never logged.

## Responses

Successful responses contain:

```json
{
  "text": "…",
  "languages": [{ "code": "el" }],
  "quality_recovery_used": false
}
```

Cached success adds `"cached": true`. Failures expose only safe codes:

- `UNAUTHENTICATED`
- `INVALID_IDEMPOTENCY_KEY`
- `INVALID_AUDIO`
- `AUDIO_TOO_LARGE`
- `LOW_CONFIDENCE_TRANSCRIPT`
- `RATE_LIMITED`
- `TRANSCRIPTION_IN_PROGRESS`
- `UPSTREAM_TIMEOUT`
- `SERVICE_UNAVAILABLE`

## Privacy and retention

- Pending audio remains in app-private `voice_pending/`, becomes deletion-eligible at seven days, and is explicitly excluded from iOS backups plus Android cloud/device transfer. Android uses exclusion-only rules so unrelated app data keeps default backup semantics; legacy root clips move into the excluded directory with queue-URI crash repair and size/available-MD5 collision validation. iOS also marks legacy root-level voice clips as excluded until cleanup/delivery. Delivery, discard, and expiry first persist a non-uploadable `deletion_pending` tombstone and remove it only after audio plus both manifest stores are confirmed absent; a filesystem failure may therefore retain the protected tombstone past seven days until verified cleanup succeeds.
- The server ledger stores an accepted transcript for at most 24 hours solely for idempotent retries.
- RLS is enabled; only the service-role client can reserve/read completion rows.
- `voice_transcription_attempts` contains only user/clip/lease ids and timestamps, expires operationally after seven days, and is used for rolling cost controls.
- Logout/account switch discards only the previous owner's pending audio and queue metadata. Strict reads use the newest intact revision as canonical active state and older copies only as deletion evidence; corrupt/partial snapshots, malformed/dropped entries, immutable attribution conflicts, sidecar scan/parse failures, and unverifiable deletion fail closed. Queue/inbox metadata and the previous-owner fence remain for retry. Composer commands bind owner and visible base revision when created; auth cleanup invalidates queued old-owner commands, drains in-storage writes, and barriers new commands. Completed mobile delivery durably commits the revisioned composer plus protected clip-ID delivery, immediately applies it to the visible input, explicitly acknowledges integration by clip ID/revision, and performs queue/audio cleanup independently. Cleanup failure keeps `deletion_pending` without hiding committed text; repeated identical transcripts are never collapsed by substring matching.

## Configuration and deploy

Required server secrets:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (provided by the Supabase runtime)

Apply the fenced-lease migration, then deploy:

```bash
supabase db push
supabase functions deploy whisper-transcription
```

Migration: `supabase/migrations/20260826120000_fence_voice_transcription_leases.sql`.
