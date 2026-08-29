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

Launch production is **same-call**: one Reader/chat/essay inference writes the reading and the questions. There is no second reflective-question LLM, Composer, Integrity Gate, Repair, Premise Check, or question fallback pipeline.

Cardinality:

- Quick: exactly **1** terminal question, no heading
- Standard / Advanced: exactly **2** bullets under `## Reflective Questions`
- Chat non-final: exactly **1** trailing question; closing/final: **0**
- Essays: exactly **2** under `## Reflective Questions`

V1 app chrome is English-only. Structural headings, navigation, shared buttons,
and metadata section titles are not localized before Oneiros v2. In particular,
the heading is exactly `Reflective Questions` and the shared CTA is exactly
`Continue the conversation` in every content language. Generated reflection prose and
questions still follow the resolved dream/conversation language.

Canonical feature release `v1.0.3` uses alias `oneiros-same-call-reflective-questions-v1.0.3` → immutable evaluated artifact `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a49…` (`APPROVED_REFLECTIVE_QUESTION_PRODUCTION`), and Reader alias `oneiros-dream-reflection-v3.2.3` → evaluated artifact `oneiros-dream-reflection-v3.2.3-candidate`. The aliases are release metadata only and must never replace the evaluated artifact ids in runtime telemetry or change prompt bytes. The approved package is live in `ai-entitlements-gateway` function version `113` with follow-up chat `oneiros-followup-chat-v2.0.1`, normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`, and runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. Q1 uses the PO-approved enacted-relation composition job; the current production Q2 is intentionally retained. Q2 prompt iteration is closed unless a future architecture/product decision explicitly reopens it. Exploring `chat_followup` stays `gpt-5.4-mini`. Carry only three safeguards: no manufactured either/or, no missing dream footage, do not treat interpretation as dream fact. Do not port v1.2 live-edge / discovery-test / Gate taxonomy into the Reader. Deterministic marker/language/cardinality/no-answer-menu validation is **shadow telemetry only** for this release: it observes the completed output, never blocks delivery and never triggers a contract retry. The observer itself is fail-open: exceptions produce `passed: null` plus compact error telemetry/logging and must never fail, retry, or alter a successful generation. Preserve the existing stream, ~15s partial reveal, and `PhasedTypingText`; never add a question-only model call. Closed R&D (Composer, v1.2 orchestration, Gate/Repair/Premise, Inviter, editorial arc) stays archived and denied. Essays remain Phase-1 metadata-context v1 on `2.0.4-phase1` (the `2.0.3` topology plus the two-question prompt contract); their pre-existing one-shot whole-essay retry is operational for incomplete/over-limit output only, never question validation. Canonical sources: `src/ai/dreamReflectionPrompt.ts`, `src/ai/reflectiveQuestionExtract.ts`, `src/ai/reflectiveContractObservation.ts`, `src/ai/reflectiveEssayPrompt.ts`, `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`, `docs/REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md`.

Archived surgical candidate: `oneiros-same-call-reflective-questions-v1.0.2-candidate` / SHA `94d4a92a…`, Reader `oneiros-dream-reflection-v3.2.2-candidate`, Chat `oneiros-followup-chat-v2.0.2-candidate`. Its one authorized frozen 20-call evaluation cost `$0.23542850` and returned HOLD: human 11 PASS / 9 FAIL, with 7/14 selected failures repaired but 2/6 controls regressed. Its prompt delta is no longer runtime and the identity is explicitly denied; the independent committed `dream_followup_reply` replay repair remains preserved from the v1.0.1 release. Do not rerun, broaden the evaluation, run a semantic judge, or iterate the prompt automatically. Canonical review: `docs/ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md`. Offline composition diagnosis: `docs/ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md`.

PO-approved production candidate: `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a49…`, Reader `oneiros-dream-reflection-v3.2.3-candidate`, Chat unchanged `oneiros-followup-chat-v2.0.1`. Its single 21-call Reader-only evaluation used fixture SHA `cc60ad8e…` and cost `$0.33461750`. Product-calibrated human review passed Q1 `21/21`: known failures `10/10`, controls equivalent `3/3`, sealed multilingual holdout `8/8`. One Chinese holdout lost the required heading, so the prompt-only packet was `20/21` under its zero-structural-failure gate; the separately versioned normalizer closes that engineering miss without changing the prompt or partial stream. Earned, dream-grounded interpretive vitality is desired; do not fail it merely for not being sterile. The PO approved this exact prompt+normalizer package for guarded production deployment on 2026-08-29. No rerun, judge, second prompt candidate, or further Q1 edit. Review: `docs/ONEIROS_V103_ENACTED_RELATION_EVALUATION_REVIEW_2026-08-29.md`.

PO-approved production structural repair: `oneiros-reflective-question-structure-normalizer-v1.0.0`. It runs only on a completed Standard/Advanced response with the required end marker and an unambiguous terminal pair of question bullets; its only permitted operation is insertion of exact `## Reflective Questions` plus required newlines. Ambiguous input is a byte-identical no-op. It never changes Q1/Q2/prose, calls a model, retries, buffers, or touches streaming partials. Compact `question_structure_normalization` telemetry records `applied`, `operation`, and `normalizer_version`. Frozen offline replay repaired the two real historical heading misses and left the other 39 outputs byte-identical. The v1.0.3 prompt SHA remains `f5399a49…`; the deployable runtime is identified separately as `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. It does not claim to alter or solve Q2 quality.

Frozen Q2 imaginal-handoff evaluation: `oneiros-same-call-reflective-questions-v1.0.4-candidate` / SHA `a4f972c…`, Reader `oneiros-dream-reflection-v3.2.4-candidate`, is **HOLD and denied** after its one authorized 21-call run. Human Q2 `17/21`, known repairs `2/3`, controls `5/6`, unseen `10/12`, complementarity `21/21`, Q1 regression check `20/21`, structure `21/21`; exact cost `$0.31680500`. One serious control regression, one Q1 regression, and a three-case `meaning_completion_past_handoff` family failed the strict SHIP gate. Production v1.0.3/Q2 is unchanged. Do not deploy v1.0.4, rerun it, create v1.0.5 automatically, or tune the prompt/validator without new explicit approval. Review: `docs/ONEIROS_V104_IMAGINAL_HANDOFF_EVALUATION_REVIEW_2026-08-29.md`.

Final Q2 source-ownership evaluation: after explicit approval, `oneiros-same-call-reflective-questions-v1.0.5-candidate` / SHA `16da1d13…`, Reader `oneiros-dream-reflection-v3.2.5-candidate`, completed one frozen 22-call run for `$0.33537750` and returned **HOLD / STOP**. Human Q2 `17/22`, v1.0.4 repairs `3/4`, protected controls equivalent `4/6`, fresh unseen holdout `9/12`, complementarity `22/22`, Q1 regression check `20/22`, structure `22/22`. One serious control regression and recurring manufactured-category, control-vitality, generic-Q2, Q1-regression, and source-boundary families failed the gate. Production v1.0.3/Q2 is unchanged. Do not deploy/rerun v1.0.5, create v1.0.6 automatically, or continue Q2 prompt tuning. Review: `docs/ONEIROS_V105_SOURCE_OWNERSHIP_EVALUATION_REVIEW_2026-08-29.md`.

Committed follow-up replay invariant: deployed in guarded `ai-entitlements-gateway` function version `112`. Once `dream_followup_reply` has committed, the same idempotency key must reconstruct the original persisted user/assistant pair using compact quota-result message IDs (or the constrained legacy adjacent-message fallback). It must never run the model, commit quota, or persist again; missing committed evidence fails explicitly.

**Whenever you deploy** `ai-entitlements-gateway`:

1. Use `npm run deploy:ai-entitlements-gateway` only. Do not run raw `supabase functions deploy ai-entitlements-gateway`.
2. The wrapper fails closed unless the bundled same-call method ID + prompt SHA are explicitly approved.
3. Denied candidates cannot be approved with an env override.
4. Do not import `src/ai/reflectiveQuestionProductionHold.ts`, `src/ai/rd/`, `src/ai/reflectiveQuestionPipeline.ts`, or Composer/Gate/Repair into client or gateway runtime.
5. Candidate B SHA `08cd3eaf…` is the frozen reflective-question research base. Composer, v1.2 Generator, Integrity Gate, Repair, Premise Check, Candidate C SHA `c2b0f766…`, remainder-first SHA `a37426d1…`, post-reading Inviter v1 SHA `70c533e5…`, and Post-Jungian Inviter v2.0.1 SHA `09045bf1…` are closed offline experiments. Closed experiments stay archived. Do not add flags to the archived mega-runner.
6. Questions live in the reading/chat/essay markdown. Do not render a separate high-salience question card on new writes. Exact English `Continue the conversation` stays available in every content language; do not translate it before Oneiros v2. Historical schema artifacts remain readable. Keep fail-safe reading salvage and the locked DreamDetail streaming typing contract.
7. Keep `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` pinned to the PO-approved `oneiros-same-call-reflective-questions-v1.0.3-candidate` / SHA `f5399a49…`, with runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`. Any later identity change requires a new explicit PO approval. Orchestration `fc8b6304…`, v2 SHA `6cd304e1…`, post-reading Inviter SHA `70c533e5…`, Post-Jungian Inviter v2 SHA `09045bf1…`, and editorial v1 SHA `57a066e5…` remain denied.
8. Keep the completed-output structure normalizer versioned separately from the prompt SHA. The guard must find `oneiros-reflective-question-structure-normalizer-v1.0.0` in the runtime path and its compact telemetry; do not describe a prompt-only candidate as byte-identical to a deployable bundle that includes the normalizer.

Canonical docs:

- `documentation/flows-06-jungian-ai-reflection.md` → **Locked contract: production reflective-question identity** and **Locked contract: reflective-question production deploy hold**
- `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`
- Contract tests: `__tests__/reflectiveQuestionProductionHold.test.ts`, `__tests__/sameCallReflectiveQuestions.contract.test.ts`, `__tests__/flows/reflectiveQuestions.productionSurfaces.contract.flow.test.ts`, `__tests__/flows/reflectiveQuestions.productionDeployGuard.contract.flow.test.ts`

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
