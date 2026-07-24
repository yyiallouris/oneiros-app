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
- [ ] Voice: recording file finalization failure asks to re-record; warning appears at 4:30 and recording auto-stops at 5:00.
- [ ] Voice: timeout, network loss, 429, and 5xx preserve the clip and offer retry/discard; successful transcription deletes the local clip and appends text once.
- [ ] Voice: queued → transcribing → retrying/needs-attention status remains visible after navigation/relaunch; reconnect and Retry now resume processing.
- [ ] Voice: crash mid-upload reclaims stuck `transcribing` only after the full client budget (~7+ minutes); healthy long uploads are never dropped mid-flight.
- [ ] Voice: Write pending notes remain visible with the stable `active` target after midnight; completed transcripts append exactly once.
- [ ] Voice: duplicate clip requests return the durable cached transcript, concurrent requests do not call Whisper twice, and stale processing locks recover.
- [ ] Voice: verify iOS silent-mode recording and Android file finalization/copy on physical devices.

## Sync & offline

- [ ] Offline save → online: appears after reconnect.
- [ ] `DevOfflineToggle`: forced offline blocks online-only features.
- [ ] Logout with pending unsynced: final sync success vs failure (expect local clear regardless).

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

## Legal / release

- [ ] Privacy screen opens hosted Privacy Policy and Terms URLs when configured.
- [ ] App Store Connect privacy labels match account data, dream/user content, voice audio, support messages, and AI subprocessors.
- [ ] iPad screenshots prepared if `ios.supportsTablet` stays true.

## Automated tests today

- `e2e/login.e2e.ts` — Detox: auth screen visible, Sign in, and social provider buttons by accessibility label / testID. Apple sign-in still needs physical iPhone/TestFlight validation.
- `__tests__/` — unit tests for AI client and Supabase helper; expand e2e as product stabilizes.

## Deep links (manual)

- [ ] `oneiros-dream-journal://` confirm signup.
- [ ] Recovery link sets pending reset → SetPassword.
- [ ] Malformed URL → no crash; handled false.
