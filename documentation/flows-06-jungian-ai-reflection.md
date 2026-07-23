# Jungian AI: reflection, chat, and interpretation storage

Primary UX is **`DreamDetailScreen`** (embedded reflection + chat). The stack also registers **`InterpretationChat`** with the same conceptual flow, but **no in-app `navigation.navigate('InterpretationChat')` call** was found in the repo — treat it as a **maintained alternate route** (e.g. future linking or tests).

## Settings that affect AI output

- **Interpretation depth** and **Mythic Resonance** from `userSettingsService` (Account screen).
- Constants in `constants/interpretation.ts` (e.g. `MAX_AI_RESPONSES`).
- Dream reflection, regenerate, and follow-up chat now run through `ai-entitlements-gateway`.

## Happy path — first reflection

1. User opens dream with no interpretation (or stale handling per screen logic).
2. User triggers **generate** / initial reflection (online required — see below).
3. Client sends `dream_reflection_generate` with a client idempotency key.
4. `ai-entitlements-gateway` reserves quota, calls `openai-proxy`, persists the canonical interpretation, and commits or releases quota.
5. Client reloads the canonical interpretation from remote storage and mirrors it locally.

## Backend quota model (live screen path)

- `ai-entitlements-gateway` supports:
  - `dream_reflection_generate`
  - `dream_reflection_regenerate`
  - `dream_followup_reply`
- Interpretation rows can now store:
  - `reflection_origin`
  - `chat_replies_used`
  - `chat_replies_limit`
  - origin quota / entitlement references
- Free-origin reflections stay eligible for their own 5 follow-up replies.
- Paid-origin reflections become read-only when paid entitlement lapses.

Advanced mode reads as continuous movement through the dream-field, not a forced descent. It targets denser 550–800 word depth and keeps somatic questions tied to the remembered dream-body rather than exercises.

## DreamDetail presentation

After reflection exists, DreamDetail presents the dream as a quiet reflection space:

- **Dream essence:** a short display distillation title and line when available.
- **Key anchors:** up to five visible anchors, sourced from `display_distillation.visible_anchors` first and metadata fallback second.
- **Inner movement:** one compact tension or movement line.
- **Symbolic reflection:** preview of the assistant reflection.
- **Continue exploring:** opens the inline chat.
- **Explore symbolic layers:** collapsed secondary metadata for affects, settings, thresholds, relationship field, motifs, tensions, archetypal echoes, and mythic parallels.

Dream-level `dream.symbols` / `dream.archetypes` are not shown as primary chips on DreamDetail.

## Follow-up chat (same screen)

- Inline chat after initial assistant message.
- Follow-ups send `dream_followup_reply` through the entitlement gateway.
- Limit comes from `chat_replies_used` and `chat_replies_limit`, with a 5-reply fallback.
- Paid-origin reflections become read-only after lapse and route to renewal / premium upsell messaging.

## Offline behavior

- Before **initial** generation or **update** reflection: `isOnline()` check; if offline → **OfflineMessage** (timed).
- **Send chat message** while offline: same offline message pattern; no request sent.

## Regenerate / update interpretation

- User can request an updated reflection after editing the dream.
- Regenerate maps to `dream_reflection_regenerate`.
- Regenerate is treated as a premium action, so free users and lapsed paid users are routed to the premium upsell / renewal state.

## Delete interpretation

- Possible from detail flow (e.g. reset / delete path) via `deleteInterpretation` — local + remote best-effort.

## `InterpretationChatScreen`

- Parallel implementation: dream load, interpretation load, gateway-based generate/chat, offline checks, voice button, and premium lapse read-only handling.
- Voice transcription follows the shared offline-first contract: capture works without connectivity, the local queue exposes its saved/transcribing/retrying state, and the confirmed transcript appends exactly once to the original chat input. The mic remains disabled while the chat is loading or read-only.
- For regression: if product wires navigation here later, mirror tests from DreamDetail.

## Regression ideas

- Reflection with each depth level + mythic on/off (advanced only).
- Gateway reflection success: committed response reloads the canonical remote interpretation and mirrors it locally.
- Metadata prefetch: unchanged dream content reuses cached extraction, changed content re-extracts, and in-flight prefetches are deduped.
- Hit follow-up limit → send disabled / messaging.
- Paid-origin reflection after lapse → read-only messaging + premium upsell.
- Network drop mid-request → error alert, input restored where implemented.
- Interpretation sync: create on device A, login device B → merge `display_distillation`, `symbol_stances`, and long-term metadata without dropping local-only optional fields.
