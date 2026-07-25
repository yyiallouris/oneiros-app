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
- Edge Function behavior changes require the relevant `supabase/functions/<name>/README.md` update and a final deploy note.
- AI provider/model routing changes live in `supabase/functions/openai-proxy/task-config.ts` and require `supabase functions deploy openai-proxy`.
- Dream metadata extraction prompts must stay on the shared canonical module `src/ai/dreamExtractionPrompt.ts` (client + gateway). Do not reintroduce a thinner gateway-only extraction stub.
- `archetypes` are Archetypal Echoes: classical objects (`{ canonical_label, expression, resonance, evidence }`), default `[]`. Normalize via `src/ai/archetypalEchoes.ts`. Dream Detail shows canonical title + expression/resonance; Insights aggregates `canonical_label`. Prefer classical labels; keep expression secondary.
- `amplifications` are Mythic Echoes: rare named parallels (`{ title, tradition, resonance, difference, evidence }`), default `[]`, not Dream Fabric and not Forming Patterns aggregation. Normalize via `src/ai/mythicEchoes.ts` (legacy string / `echo_name` / `{ dream_image, echo, resonance }` still accepted).
- Single-dream `motifs` UI label is Dream Motifs; Insights aggregation of motifs is Recurring Scenes. Extraction should map compactly (felt-tone affects, pattern-label relational dynamics, short thresholds/motifs) and allow 0–2 archetypal / 0–1 mythic echoes on converging configurations — not automatic emptiness.
- Never log raw dream content, prompts, messages, or AI responses. Use `src/services/logger.ts` patterns.

## Work style

- Check `git status --short` before editing.
- Do not revert user changes.
- Keep documentation practical and current rather than duplicating every implementation detail.
- When no docs, tests, database push, or E2E are needed, say so explicitly in the final response.
