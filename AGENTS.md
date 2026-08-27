# Oneiros Agent Instructions

These instructions apply to the whole repository.

## Collaboration Tone

- Address the user as bro, browski, μπρο, μπροκολοκο, or similar friendly variants.
- Stay warm and direct, but keep the work 1000% professional.

## Documentation Must Stay Current

For every code, configuration, schema, flow, or UX change:

- Start by checking `documentation/README.md` and the repo-local skill at `.codex/skills/oneiros-repo/SKILL.md`.
- Use `documentation/flows-00-complete-app-journey.md` for the end-to-end app map.
- Use `documentation/architecture-app-map.md` and `documentation/architecture-features.md` to understand feature ownership and change impact.
- Use `documentation/architecture-interpretation.md` plus `docs/SYMBOLS_FLOW.md` for AI interpretation, extraction, `display_distillation`, and Insights metadata changes.
- For AI prompt, extraction-contract, repair-prompt, or catalog work, also update the prompt inventory docs in the same change:
  - `docs/AI_PROMPTS_INVENTORY.md`
  - `docs/ECHOES_PROMPTS_AND_CATALOG.md`
- When changing any prompt or connected file, keep the code and docs versioned together: update prompt ids / prompt versions / schema versions / catalog versions anywhere they are surfaced to readers.
- Check whether any Markdown documentation needs an update.
- Update all relevant `.md` files in the same change, not later.
- Prefer the existing documentation structure before adding a new file.
- When a behavior changes, update the matching flow doc under `documentation/`.
- When a new flow doc or flow test is added, update the index files that point to it, especially `documentation/README.md` and `__tests__/flows/README.md`.
- Keep setup docs current when changing build, auth, AI, Supabase, Detox, native project, or environment variable behavior.
- If no docs need changing, mention that explicitly in the final response.

Common documentation locations:

- `documentation/` for product and app flows.
- `documentation/architecture-app-map.md`, `documentation/architecture-features.md`, and `documentation/architecture-interpretation.md` for practical architecture and impact maps.
- `docs/` for focused technical notes.
- Root Markdown files for setup, architecture, build, auth, AI, and offline testing.
- `supabase/functions/*/README.md` for Edge Function behavior.
- `src/theme/COLORS.md` for theme/token changes.

## Database And Supabase Changes

When a change adds, edits, or requires a Supabase migration, database schema change, RLS policy change, Edge Function deployment, or remote persistence update:

- Clearly tell the user in the final response what must be pushed or deployed.
- Name the exact migration file or Supabase function involved.
- Include the command when known, e.g. `supabase db push` or `supabase functions deploy <function-name>`.
- If the code works locally but remote sync/storage needs the database push, say that explicitly.
- If no database push is needed, mention that only when the task touched storage, Supabase, remote sync, or schema-adjacent code.

## Tests Must Track Behavior

For every non-trivial change:

- Add or update tests that cover the changed behavior.
- Prefer fast Jest/unit/service tests when logic can be isolated.
- Add or update flow tests under `__tests__/flows/` when a documented user/system flow changes.
- Keep the top-level flow test mapping in `__tests__/flows/README.md` aligned.
- Update existing tests rather than adding duplicate coverage.
- If a change does not need tests, explain why in the final response.

Useful commands:

```bash
npm test
npm run test:flows
npm run typecheck
```

## iPhone and Android Coverage

When a change affects mobile UI, navigation, native configuration, permissions, deep links, auth, storage, biometrics, voice recording, networking, or platform-specific behavior:

- Consider both iPhone/iOS and Android behavior before finishing.
- Add or update platform-aware tests when behavior can differ by platform.
- Update Detox/E2E coverage when the change affects visible app flows that Jest cannot validate well.
- Keep Android E2E commands/config current, including `detox.config.js` and `e2e/` expectations.
- Add or update iOS/iPhone Detox configuration and tests when an iOS-specific or cross-platform UI/native flow needs E2E coverage.
- If full device/simulator E2E cannot be run locally, still update the relevant test files/config and clearly say which checks were not run.

Current Android Detox commands:

```bash
npm run detox:build:android
npm run detox:test:android
```

## Worktree Safety

- Do not revert or overwrite user changes.
- Check `git status --short` before editing.
- If existing modified files are unrelated, leave them alone.
- If existing modified files affect the task, read them and work with the changes.

## UX And Product Contracts Require Explicit Approval

**Do not silently remove, replace, or “simplify away” user-visible product behavior while fixing a bug.**

Especially locked (requires the user’s explicit approval in the current conversation before changing):

- DreamDetail live reflection **typing / streaming reveal** (`PhasedTypingText` while `isStreaming` or settle `isTyping`).
- The ~15s partial-reveal threshold and Exploring-chat stream surface.
- Other intentional motion / reveal UX that users already rely on (typewriter, phased reveal, stream catch-up).

Hard rules:

1. Fix the actual failure mode (layout, clipping, resume, schema, deploy). Do **not** delete the UX as a shortcut.
2. Never replace streamed `PhasedTypingText` with instant full-text dumps “because the typewriter is slow” without approval.
3. If a locked UX contract and a bug appear to conflict, keep the contract and ask the user before changing product feel.
4. Keep the matching Markdown + contract tests updated in the same change; do not weaken tests to allow a silent UX removal.
5. Same rule for analogous product locks: if docs/tests mark a behavior as **user-approval required**, stop and ask.

Canonical docs:

- `documentation/flows-06-jungian-ai-reflection.md` → **Locked UX contract: reflection streaming typing**
- `.codex/skills/oneiros-repo/SKILL.md`
- Contract tests: `__tests__/flows/dreamDetail.streamingTyping.contract.flow.test.ts`

## Metadata Extraction Must Stay Bulletproof

Recurring `dream_metadata_extract` / `structured_schema_invalid` invoke failures after prompt or schema edits are **unacceptable**. The reflection can succeed and metadata still 502 — users see broken Dream Details.

**Whenever you change** extraction prompts, echo shapes, Zod schemas, normalizers, or repair hints:

1. Keep **soft defaults** for fields the model commonly omits (today: missing echo `confidence` → `medium` via coerce **and** Zod preprocess). Do not add a new required echo field without a coerce/preprocess fallback or an explicit optional design.
2. Keep prompt example JSON, TypeScript types, Zod, normalizers, and repair hints in lockstep (canonical mythic key is `divergence`).
3. Bump `DREAM_EXTRACTION_SCHEMA_VERSION` (and prompt semver when pedagogy changes).
4. Extend `__tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts` + unit validation tests for the new omission case.
5. Deploy **both** `openai-proxy` and `ai-entitlements-gateway` after shared validation/prompt changes — client Metro reload alone is not enough for production extract.
6. Never “fix” extract failures by silently dropping all Interpretive Echoes or by weakening validation so empty garbage becomes `ready`.

Canonical docs:

- `documentation/flows-06-jungian-ai-reflection.md` → **Locked contract: metadata extraction resilience**
- `docs/SYMBOLS_FLOW.md`, `documentation/architecture-interpretation.md`
- `supabase/functions/openai-proxy/README.md`

## Reflective-question production must not drift

Remote `ai-entitlements-gateway` currently serves recovered `reflective-question-psychological-aliveness-v1.4.0` SHA `4885e351…`. Local Oneiros Reader v1.4.0 SHA `0ea4b9a2…` is `DO NOT DEPLOY`.

**Whenever you deploy** `ai-entitlements-gateway`:

1. Use `npm run deploy:ai-entitlements-gateway` only. Do not run raw `supabase functions deploy ai-entitlements-gateway`.
2. The wrapper fails closed unless the bundled reflective-question method ID + prompt SHA are explicitly approved.
3. Denied candidates cannot be approved with an env override.
4. Do not import `src/ai/reflectiveQuestionProductionHold.ts` or `src/ai/rd/` into client or gateway runtime.
5. Candidate B SHA `08cd3eaf…` is the only active reflective-question R&D base. Closed experiments stay archived. Do not add flags to the archived mega-runner.

Canonical docs:

- `documentation/flows-06-jungian-ai-reflection.md` → **Locked contract: reflective-question production deploy hold**
- `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`
- Contract tests: `__tests__/reflectiveQuestionProductionHold.test.ts`, `__tests__/flows/reflectiveQuestions.productionDeployGuard.contract.flow.test.ts`

## Completion Checklist

Before final response, verify:

- Relevant Markdown docs were updated, or no doc update was needed.
- Relevant Jest/flow tests were added or updated, or no test update was needed.
- No locked UX/product contract was changed without explicit user approval (especially DreamDetail streaming typing).
- Metadata extraction schema/prompt changes kept soft defaults + contract tests, and required gateway/proxy deploy was called out.
- Any required Supabase/database push or function deploy was called out explicitly.
- `ai-entitlements-gateway` deploys used `npm run deploy:ai-entitlements-gateway` (fail-closed reflective-question hold), or no gateway deploy was made.
- iPhone/iOS and Android impact was considered for mobile-facing changes.
- Commands run are reported, including failures or skipped checks.
