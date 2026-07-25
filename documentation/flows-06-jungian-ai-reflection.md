# Jungian AI: reflection, chat, and interpretation storage

Primary UX is **`DreamDetailScreen`** (embedded reflection + chat). The stack also registers **`InterpretationChat`** with the same conceptual flow, but **no in-app `navigation.navigate('InterpretationChat')` call** was found in the repo — treat it as a **maintained alternate route** (e.g. future linking or tests).

## Settings that affect AI output

- **Interpretation depth** and **Mythic Resonance** from `userSettingsService` (Account screen).
- Constants in `constants/interpretation.ts` (e.g. `MAX_AI_RESPONSES`).
- Dream reflection, regenerate, and follow-up chat now run through `ai-entitlements-gateway`.

## Happy path — first reflection

1. User opens dream with no interpretation (or stale handling per screen logic).
2. User triggers **generate** / initial reflection (online required — see below).
3. Client sends `dream_reflection_generate` with a client idempotency key and async start enabled.
4. `ai-entitlements-gateway` reserves quota and returns a pending `quota_event_id` quickly, then continues the full-depth reflection in a background Edge task.
5. DreamDetail keeps a calm loading state, explains longer Deeper Dive work after the wait becomes noticeable, and polls `dream_reflection_status` for the quota event.
6. If the reflection is still running after roughly 15 seconds and the gateway has streamed partial text into the quota event, DreamDetail opens the chat area with a temporary assistant message that grows through status polling using the same phased typing treatment as completed assistant reflections. The chat input remains disabled because the reflection is not persisted or quota-committed yet.
7. When the background task saves the canonical interpretation with `metadata_status: pending` and commits quota, the status poll returns the interpretation payload and the client replaces the temporary partial message with the persisted interpretation without a second immediate remote fetch.
8. Client starts a separate `dream_metadata_extract` gateway request after the reflection response, then the gateway takes a server-side lease for that interpretation before any metadata AI call. Only the lease holder updates the same interpretation with `display_distillation`, long-term metadata, and `metadata_status: ready` (or `failed` if the enrichment request fails, returns malformed JSON, or returns no usable metadata); concurrent callers receive a processing response and retry without duplicate OpenAI spend. DreamDetail refreshes from remote as soon as the deduped metadata extraction promise completes, tries an immediate refresh when the user closes chat, and keeps scheduled refreshes as fallback. While metadata is still pending, DreamDetail shows a small pending state instead of an empty metadata area. Pending rows restart enrichment on later DreamDetail / alternate chat loads without blocking the reflection UI.

## Backend quota model (live screen path)

- `ai-entitlements-gateway` supports:
  - `dream_reflection_generate`
  - `dream_reflection_regenerate`
  - `dream_reflection_status` (no quota spend; polls async reflection quota event)
  - `dream_metadata_extract` (post-reflection enrichment; no user quota spend)
  - `dream_followup_reply`
- Interpretation rows can now store:
  - metadata extraction state (`metadata_status`, `metadata_generated_at`, `metadata_error_code`)
  - `reflection_origin`
  - `chat_replies_used`
  - `chat_replies_limit`
  - origin quota / entitlement references
- Free-origin reflections stay eligible for their own 5 follow-up replies.
- Paid-origin reflections become read-only when paid entitlement lapses.
- Reflection AI calls have a gateway timeout; timeout/error releases the quota reservation and leaves the existing UI/input intact.
- Reflection prompts preserve the canonical initial interpretation structure from `src/services/ai.ts`: constitution, role, selected depth format, and user prompt. Body text and reflective questions stay in the dream's primary language; markdown headings stay in English for UI consistency.
- Standard and Advanced reflections end with exactly 2 reflective questions.
- Progressive reflection display is status-poll based: the Edge task streams model chunks into `quota_events.result_context.partial_reflection`, while mobile reveals partial text only after the 15-second threshold and keeps polling until final commit. Streamed partial text uses append-aware phased typing with the same markdown formatter as the settled reflection (`formatInterpretationMarkdown`), so list markers such as Reflective Questions stay as `•` through stream and settle instead of flashing raw `-` then dropping later bullets. If partial text was shown, the final committed reflection replaces it without replaying the typewriter animation from the beginning.
- Metadata extraction requests use the shared canonical prompt in `src/ai/dreamExtractionPrompt.ts` (client and gateway), enforce OpenAI JSON response format through `openai-proxy`, then Zod domain validation with one same-provider repair attempt; invalid or empty extraction output fails fast (502) so the client retry loop can recover instead of saving an empty ready metadata state.
- Metadata extraction is protected by `interpretation_metadata_extraction_jobs` and SQL claim/finish RPCs, so retries and overlapping app calls cannot start two provider metadata requests for the same pending interpretation unless the previous lease expires.
- Gateway and app logs include sanitized cost observability fields for committed reflections and metadata extraction (`reflectionCostUsd`, `metadataCostUsd`, `totalAiCostUsd`, plus flattened `costModel` / `costProvider` / token fields — and on metadata done, `reflectionCostModel` when the reflection leg is known), plus Recent Dream Field / Period Reflection generation costs, derived from provider usage tokens and the shared monthly pricing table in `src/billing/aiPricing.ts` without logging dream content or AI output.

Advanced mode reads as continuous movement through the dream-field, not a forced descent. It targets denser 550–800 word depth and keeps somatic questions tied to the remembered dream-body rather than exercises. The Advanced token limit (2800) is loose headroom so the response can finish cleanly instead of cutting mid-sentence or mid-question; the word target still constrains verbosity.

## DreamDetail presentation

After reflection exists, DreamDetail presents the dream as a quiet reflection space:

- **Dream essence:** a short display distillation title and line when available.
- **Key anchors:** up to five visible anchors, sourced from `display_distillation.visible_anchors` first and metadata fallback second. Missing/empty `visible_anchors` must fall back to metadata (never crash).
- **Inner movement:** one compact tension or movement line.
- **Symbolic reflection:** preview of the assistant reflection.
- **Continue exploring:** text-link action that opens the inline chat.
- **Explore symbolic layers:** collapsed secondary metadata grouped as:
  - **Dream Fabric** (grounded in dream text): Emotional Weather (`affects`), Dream Places (`landscapes`), Relationship Field (`relational_dynamics`), Thresholds, Dream Motifs (`motifs`). On a single dream, motifs are candidates — not yet confirmed recurrence.
  - **Interpretive Echoes** (provisional): Inner Tensions (`central_conflicts`), Archetypal Echoes (`archetypes`), Mythic Echoes (`amplifications`).
- Mythic Echoes are rare optional interpretive enrichment (0–1 named parallel `{ title, tradition, resonance, difference, evidence }`), not Dream Fabric. Prefer `[]` for ordinary dreams; when structural correspondence across several elements supports a recognized myth, return that single parallel and state an important difference. DreamDetail shows `title — tradition` plus resonance/difference. Field: `amplifications`. Not in Forming Patterns aggregation.
- Archetypal Echoes return 0–2 objects `{ canonical_label, expression, resonance, evidence }` when converging structural evidence supports them (not automatic empty, not single-symbol inference). Bare string arrays are invalid for extraction and trigger repair. Primary label is classical whitelist (e.g. Divine Child, Guide / Psychopomp); `expression` is the dream-specific form and stays secondary. DreamDetail shows canonical title + expression/resonance; Insights aggregates `canonical_label`.
- Fabric fields must map compactly: affects = felt tones only (never images); relational dynamics = pattern labels (not plot summary); thresholds/motifs = short canonical phrases.
- Metadata extraction uses the shared canonical prompt in `src/ai/dreamExtractionPrompt.ts` with an explicit SOURCE BOUNDARY between Dream Fabric and Interpretive Echoes. User-facing extraction strings follow the dream's primary language; schema enums and whitelisted archetype `canonical_label` values stay English.

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
- Gateway reflection success: committed response can carry the canonical interpretation directly, mirrors it locally, and avoids an immediate second fetch.
- Async metadata: pending rows render the reflection/chat immediately, a separate metadata action fills `display_distillation` and metadata, pending rows restart enrichment on later loads, and remote refresh brings the completed fields local without changing quota usage.
- Reflection timeout: quota is released and no pending interpretation row is shown as completed.
- Metadata prefetch: unchanged dream content reuses cached extraction, changed content re-extracts, and in-flight prefetches are deduped.
- Hit follow-up limit → send disabled / messaging.
- Paid-origin reflection after lapse → read-only messaging + premium upsell.
- Network drop mid-request → error alert, input restored where implemented.
- Interpretation sync: create on device A, login device B → merge `display_distillation`, `symbol_stances`, and long-term metadata without dropping local-only optional fields.
