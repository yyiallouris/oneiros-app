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
- When changing AI prompts, extraction contracts, repair prompts, prompt schemas, or injected catalogs, update `docs/AI_PROMPTS_INVENTORY.md` and `docs/ECHOES_PROMPTS_AND_CATALOG.md` in the same change.
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
- **Reflective-question production:** launch is same-call Reader + questions. Approved identity `oneiros-same-call-reflective-questions-v1.0.0` / SHA `25b1114a…`. Reader `oneiros-dream-reflection-v3.2.0`. Chat `oneiros-followup-chat-v2.0.0`. Quick 1 terminal question; Standard/Advanced exactly 2 under `## Reflective Questions`; chat non-final 1 / closing 0; essays exactly 2. No second question LLM, Composer, Gate, Repair, or Premise Check in runtime. Three safeguards only: no manufactured either/or, no missing footage, interpretation is not dream fact. Exploring `chat_followup` stays `gpt-5.4-mini`. Closed Inviter/editorial/orchestration SHAs stay denied. Deploy only through `npm run deploy:ai-entitlements-gateway`. Canonical: `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`. Guards: `__tests__/sameCallReflectiveQuestions.contract.test.ts`, production surface/deploy flow tests.
- `archetypes` are Archetypal Echoes (Jungian/post-Jungian patterns): objects (`{ canonical_label, expression, resonance, evidence, confidence }`), default `[]`. Normalize via `src/ai/archetypalEchoes.ts`. Dream Detail shows catalog `displayLabel` + resonance only (no auto-“The”, no “Appears as…”); empty arrays hide the subsection. Insights aggregates `canonical_label`.
- `archetypes` (v4.1.7-E.1 **frozen — accepted_with_known_residuals**): output-language lock + deterministic pre-commit language gate (`src/ai/dreamOutputLanguage.ts`) with field-scoped faithful repair + local `Record<ExactPath, NonEmptyString>` validation + semantic fingerprint. Catalog `1.6.0`. Spec: `docs/ONEIROS_V4_1_7_E_PATCH.md`. Canonical E.1.1 benchmark: `tmp/global-archetype-benchmark-2026-07-27T15-16-35-686Z/`. Gateway logs `outputLanguageCommit` + `heroTelemetry`.
- **Patch F (open, diagnostic-only):** archetype selection stability — Greek sea-mattress ×20 + naturalistic ×5 suite. **No** language-gate / Lover-specific / dream-example / server-heuristic / multi-call-union changes until reviewer inspection. Spec + runner: `docs/ONEIROS_V4_1_8_F_DIAGNOSTIC.md` + `bash scripts/run-patch-f-stability.sh`.
- `archetypes` Hero hard gate (D.1, still frozen): `ordeal_or_confrontation` + `purposeful_quest_movement` + `boon_or_changed_outcome` (catalog gates). Single `trickster` id (B.2 carrier variants frozen as non-production experiment). Trickster optional — not a release blocker. Hard gates for Trickster / Hero / Guide / Lover / Death–Rebirth / Terrible Mother; Ego excluded; max 0–2. Spec: `docs/ONEIROS_V4_1_6_D1_HERO_PRECISION.md`.
- `amplifications` Mythic Echo (closed catalog v1.2.0, 128 ids, prompt-index V2): model returns `catalog_id` + `evidence_ids` or `[]`; server validates catalog integrity only (C.1); resolves title/tradition/source_type; no open-world fallback. Flag `MYTHIC_CLOSED_CATALOG_V1` (default ON). Rebuild index: `npm run build:mythic-prompt-index`. UI: resolved title + muted tradition.
- Extraction prompt id `dream-field-map-interpretive-v4.1.9-M1` / `prompt_version` `4.1.9-M1` / schema `13` / `temperature` `0`. Current line: polarity-neutral Mother/Father archetype catalog + E.1 output-language gate + myth namespace enforcement/integrity-only validation. Build-time catalog ID enums: `npm run build:interpretive-catalogs`. Mythic Echo uses deterministic `evidence_ids` → exact dream spans (`src/ai/dreamEvidenceSpans.ts`, display spread via `selectDisplayEvidence`). Optional debug is compact `selection_notes` only; production benchmarks keep debug OFF.
- Dream Detail UI for Fabric / Inner Tensions stays unchanged. Echo copy: archetypal resonance ~18–32 words; mythic resonance+divergence ~35–55 words.
- Optional `debug_interpretive_echoes` diagnostics never persist/UI. Covered by `__tests__/flows/interpretiveEchoesV31.ranking.flow.test.ts`.
- Live production-only echo baseline (paste dream → uncached proxy runs, debug OFF by default): `docs/LIVE_ECHOES_BASELINE_RUNNER.md` + `scripts/live/run-production-baseline.{ts,sh}` with tracked scenarios under `testing/live-scenarios/` (generated packets still go to `tmp/`). Do not treat debug-suffix runs as the production stability signal.
- Closed-catalog 5-dream combination acceptance (3× each, **always fully parallel by default**, costs + reviewer stage logs): `docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.{md,jsonl}` + `bash scripts/run-5-dream-acceptance.sh` / `npm run test:5-dream-acceptance`. **Global archetype evaluation** (v1.2.0: 72 fixtures, catalog_conformance + naturalistic buckets, leakage validator — Patch E frozen `accepted_with_known_residuals`): `docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.{md,jsonl}` + `bash scripts/run-global-archetype-benchmark.sh` (default concurrency **2**; 429 exponential backoff + jitter). Reconciliation: `npm run reconcile:global-archetype-benchmark -- tmp/global-archetype-benchmark-<stamp>`; primary-only rerun: `npm run rerun:global-archetype-primary -- tmp/global-archetype-benchmark-<stamp>` (needs `openai-proxy` deploy for `disable_anthropic_fallback`). Archived v1.0.0 white-box suite: `docs/ONEIROS_GLOBAL_ARCHETYPE_CATALOG_CONFORMANCE_V1.jsonl`. Closed copper-vessel: `bash tmp/runClosedMythCatalogBenchmark.sh` (also parallel). Pro-reviewer Phase 0 package: `tmp/phase0-v411-diagnostics-*/PHASE0_PACKAGE.json`.
- Single-dream `motifs` UI label is Dream Motifs; Insights aggregation of motifs is Recurring Scenes.
- Never log raw dream content, prompts, messages, or AI responses. Use `src/services/logger.ts` patterns.

## Work style

- Check `git status --short` before editing.
- Do not revert user changes.
- Keep documentation practical and current rather than duplicating every implementation detail.
- When no docs, tests, database push, or E2E are needed, say so explicitly in the final response.
