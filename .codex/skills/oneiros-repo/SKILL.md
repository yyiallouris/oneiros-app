---
name: oneiros-repo
description: Use when working in the Oneiros app repository, especially for feature changes, documentation updates, tests, Supabase/AI flows, navigation, storage, sync, mobile UI, or design-system work.
---

# Oneiros Repo

Use this skill before changing the Oneiros app. The goal is to keep agents aligned with the product flows, architecture, tests, documentation, and deployment obligations.

## Required first reads

1. Read `AGENTS.md`.
2. Read `documentation/README.md` to identify affected flow docs.
3. For broad or uncertain changes, read:
   - `documentation/architecture-app-map.md`
   - `documentation/architecture-features.md`
4. For AI interpretation, DreamDetail, extraction, metadata, or Insights synthesis, also read:
   - `documentation/architecture-interpretation.md`
   - `docs/SYMBOLS_FLOW.md`

## UI and design changes

Before editing UI, check the existing visual system:

- Design index: `src/theme/DESIGN.md`
- Colors: `src/theme/colors.ts` and `src/theme/COLORS.md`
- Buttons: `src/theme/buttons.ts`
- Loading: `src/theme/loading.ts` and `src/theme/LOADING.md`
- Typography: `src/theme/typography.ts` and `src/theme/TYPOGRAPHY.md`
- Shared UI: `src/components/ui/`.

Prefer existing tokens and shared components. If a token, type role, visual rule, or shared UI behavior changes, update the matching theme doc in the same change.

## Flow and test obligations

- Update the relevant `documentation/flows-*.md` file whenever behavior, routes, UX, persistence, AI behavior, sync behavior, legal copy, or failure states change.
- If adding a new flow doc or flow test, update `documentation/README.md` and `__tests__/flows/README.md`.
- Prefer focused Jest/service/flow tests for logic changes.
- Consider Detox only when visible app flow behavior cannot be validated well by Jest.
- Always report commands run and any skipped checks.

## Supabase and AI obligations

- Schema, RLS, persistence, or remote storage changes require a migration under `supabase/migrations/`, migration docs, and a final `supabase db push` note.
- Before adding foreign keys, RPC params, or claim/lock tables against existing app data, verify the real database column types from existing migrations and remote mapping code. Oneiros uses app-generated `text` ids for `dreams.id` and `interpretations.id`; do not assume `uuid` just because related billing/auth tables use UUIDs.
- **`billing_commit_quota` must keep `interpretation_id` as text** (never `::uuid`). Casting to uuid broke `dream_followup_reply` with gateway `Failed to commit quota` after the AI reply ran. Guarded by `__tests__/flows/billingCommitQuota.interpretationIdText.contract.flow.test.ts`.
- Edge Function behavior changes require the relevant `supabase/functions/<name>/README.md` update and a final deploy note.
- AI provider/model routing changes live in `supabase/functions/openai-proxy/task-config.ts` and require `supabase functions deploy openai-proxy`.
- Never change Anthropic fallback models without checking sampling-param compatibility: `claude-sonnet-5` rejects `temperature`/`top_p`/`top_k` (HTTP 400). The proxy must omit those params. Reflection uses ordered `fallbackAnthropicModels` (Sonnet→Haiku). See `supabase/functions/openai-proxy/README.md` “Sampling params”.
- **USER APPROVAL REQUIRED — DreamDetail reflection typing/streaming:** Live partials after ~15s **must** use append-aware `PhasedTypingText` while `isStreaming` (catch-up allowed). Do **not** replace with instant `FormattedMessageText` / full-text dumps, remove typing, or “simplify” the reveal while fixing layout/resume bugs unless the user explicitly approves in the current chat. Guarded by `documentation/flows-06-jungian-ai-reflection.md` (Locked UX contract) and `__tests__/flows/dreamDetail.streamingTyping.contract.flow.test.ts`. See also `AGENTS.md` → “UX And Product Contracts Require Explicit Approval”.
- DreamDetail Exploring chat is a nested ScrollView (`src/screens/dreamDetailChatLayout.ts`): keep bounded `maxHeight` + `nestedScrollEnabled`; never add `overflow: 'hidden'` / `flex: 1` on the Exploring card or force `width: '100%'` on assistant Text there — those clip or collapse the nested chat (especially during ~15s partial streaming).
- In-flight dream reflection must survive leave/kill: persist pending `{ dreamId, quotaEventId, ... }` via `pendingReflectionJobService`, resume with `resumeOrAttachDreamReflection` on DreamDetail focus, use stable generate idempotency keys, and keep gateway `async_background_started` so replays do not double-start Edge workers. Soft poll timeout must not clear the handle.
- Dream metadata extraction prompts must stay on the shared canonical module `src/ai/dreamExtractionPrompt.ts` (client + gateway). Do not reintroduce a thinner gateway-only extraction stub.
- **Metadata extract resilience (do not regress):** `dream_extraction` must survive common model omissions via coerce + Zod preprocess soft defaults (e.g. missing echo `confidence` → `medium`). Never add a new required echo field without a soft default/optional design + contract test. After prompt/validation changes deploy **both** `openai-proxy` and `ai-entitlements-gateway`. Guarded by `documentation/flows-06-jungian-ai-reflection.md` (Locked contract: metadata extraction resilience) and `__tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts`. Recurring `structured_schema_invalid` after small edits is a process failure.
- `archetypes` are Archetypal Echoes (established transpersonal patterns): classical objects (`{ canonical_label, expression, resonance, evidence, confidence }`), default `[]`. Normalize via `src/ai/archetypalEchoes.ts`. Dream Detail shows canonical title + natural resonance only (no “Appears as…”); `expression` stays structural/secondary. Insights aggregates `canonical_label`. Prefer classical labels; high|medium only.
- `archetypes` (v3.6): dream-only candidates; closed whitelist + concise hard gates for Double / Guide / Divine Child / Terrible Mother / Ruler (evaluation optional; explicit false signals reject; missing evaluation must not wipe UI); stripped before persist/UI; max 0–2.
- `amplifications` Mythic Echo: open-world 0–1 direct output of `dream_extraction`, then lightweight post-validator (banned generic titles / evidence / confidence). No corpus, resolver, or external retrieval. Precision over coverage — false echoes worse than `[]`, but do not omit unusually direct multi-stage structural matches (normally return when ≥4 sequenced correspondences + defining action/prohibition + qualifying divergence).
- Extraction prompt id `dream-field-map-interpretive-v3.6` / `prompt_version` `3.6.3` / schema `4`.
- Dream Detail UI for Fabric / Inner Tensions stays unchanged. Echo copy length is controlled in the extraction prompt only (archetypal resonance ~20–35 words; mythic resonance+divergence one compact paragraph ~35–55 words). No production archetype `evaluation` bag — candidate notes only in `__DEV__` interpretive_diagnostics. Mythic titles must be narratives/episodes, not bare figures.
- Optional `debug_interpretive_echoes` diagnostics never persist/UI. Covered by `__tests__/flows/interpretiveEchoesV31.ranking.flow.test.ts`.
- Single-dream `motifs` UI label is Dream Motifs; Insights aggregation of motifs is Recurring Scenes.
- Never log raw dream content, prompts, messages, or AI responses. Use `src/services/logger.ts` patterns.

## Work style

- Check `git status --short` before editing.
- Do not revert user changes.
- Keep documentation practical and current rather than duplicating every implementation detail.
- When no docs, tests, database push, or E2E are needed, say so explicitly in the final response.
