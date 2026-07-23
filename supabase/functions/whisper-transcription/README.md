# `whisper-transcription`

Authenticated proxy for OpenAI audio transcription. The mobile app records optional dream voice notes locally and sends a bounded multipart request; audio is not stored by this function.

## Auth and request contract

The function uses `verify_jwt = false` so it can answer CORS preflight and return normalized errors, but it manually verifies the `Authorization: Bearer <Supabase access token>` user before reading audio. The client also sends the Supabase `apikey`.

`POST` requires:

- `file`: one audio file, non-empty, maximum 20 MiB
- allowed MIME type: AAC, M4A/MP4, MP3/MPEG, WAV, or WebM
- `model`: `whisper-1` (other values are ignored)
- optional same-language prompt
- `X-Idempotency-Key`: stable client clip ID. A service-role-only Supabase ledger reserves `(user_id, clip_id)` atomically, returns the completed transcript for duplicate requests, and recovers processing locks older than two minutes.

The upstream request has a 90-second timeout. Raw upstream error bodies, audio URIs, and transcript content are never logged.

## Responses

Successful responses are `{ "text": "…" }`. Failure responses contain only a safe code:

- `UNAUTHENTICATED`
- `INVALID_AUDIO`
- `AUDIO_TOO_LARGE`
- `RATE_LIMITED`
- `TRANSCRIPTION_IN_PROGRESS`
- `UPSTREAM_TIMEOUT`
- `SERVICE_UNAVAILABLE`

The mobile app records up to five minutes, queues clips locally first, and treats offline, timeout, 429, and service failures as recoverable. Pending clips automatically retry on reconnect, foreground, or next launch and are retained for seven days or until delivery/discard.

## Configuration and deploy

Required secret:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (provided by the Supabase function runtime)

## Privacy and retention

- Pending audio stays in app-private device storage and is retained for at most seven days.
- The server ledger stores the completed transcript for at most 24 hours solely to make cross-instance retries idempotent.
- RLS is enabled and no client role has table access; only the function’s service-role client can reserve/read completion records.
- Logout discards pending local audio and queue metadata.

Deploy after changing this function:

```bash
supabase functions deploy whisper-transcription
```

Apply the idempotency migrations first:

```bash
supabase db push
```
