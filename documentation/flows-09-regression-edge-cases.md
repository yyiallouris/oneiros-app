# Regression catalog: edge cases and negative paths

Use this as a **checklist** alongside per-area docs. Not every branch is listed; prioritize flows tied to data loss, auth, and money/time (AI calls).

## Auth & session

- [ ] Login wrong password → clear message; no session.
- [ ] Login unverified email → verification UI, not generic error.
- [ ] Sign up weak password / mismatch → validation.
- [ ] OTP invalid / expired → error; resend rate limit.
- [ ] Forgot password → resend cooldown; invalid email submission.
- [ ] Recovery link used twice / stale → verify error path.
- [ ] Google OAuth dismiss with no session → “cancelled” path.
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
- [ ] Voice: permission denied; transcription timeout; very long recording cap (~3 min).

## Sync & offline

- [ ] Offline save → online: appears after reconnect.
- [ ] `DevOfflineToggle`: forced offline blocks online-only features.
- [ ] Logout with pending unsynced: final sync success vs failure (expect local clear regardless).

## AI reflection

- [ ] Offline: cannot start reflection; offline banner behavior.
- [ ] Online: API error restores chat input where implemented.
- [ ] Max assistant responses reached → no further sends.
- [ ] Regenerate interpretation after editing dream text.

## Insights & reports

- [ ] Period “All time” with zero dreams.
- [ ] Pattern report: offline; language switch; month with no interpretations (empty entries).
- [ ] Collective section: placeholder empty state until backend exists.
- [ ] Journey swipe through all four sections with same period label in header/caption.

## Automated tests today

- `e2e/login.e2e.ts` — Detox: auth screen visible, Sign in / Continue with Google labels.
- `__tests__/` — unit tests for AI client and Supabase helper; expand e2e as product stabilizes.

## Deep links (manual)

- [ ] `oneiros-dream-journal://` confirm signup.
- [ ] Recovery link sets pending reset → SetPassword.
- [ ] Malformed URL → no crash; handled false.
