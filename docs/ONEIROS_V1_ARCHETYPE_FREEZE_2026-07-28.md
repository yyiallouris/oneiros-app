# Oneiros v1 archetype production freeze

Status: **Oneiros v1 archetype production freeze with known residuals**

Date: **Tuesday, July 28, 2026**

## Frozen v1 archetype snapshot

```text
Architecture:
discovery → adjudication

Discovery task:
dream_archetype_recognition

Discovery prompt:
1.0.0

Discovery schema:
1

Recognition catalog:
2.0.0

Adjudication task:
dream_archetype_adjudication

Adjudication prompt:
1.0.0

Adjudication schema:
1

Boundary catalog:
1.0.0

Model:
gpt-5.4-mini-2026-03-17

Temperature:
0
```

## Accepted evidence

```text
fixtures: 18/18 passed
semantic runs: 80/80
exact-set passes: 80/80
unexpected labels: 0/80
```

Source packet:

- `docs/ONEIROS_ARCHETYPE_RECOGNITION_ADJUDICATION_FINAL_REVIEW_PACKET_2026-07-28.md`

## Production integration

Frozen production behavior on Tuesday, July 28, 2026:

```text
raw dream
→ dream_archetype_recognition
→ dream_archetype_adjudication
→ final adjudicated archetypes
→ existing persistence/UI shape
```

Rules now enforced in code:

- `dream_extraction` may still produce a compatibility `archetypes` field, but production always discards monolithic archetype output before persistence.
- Persisted `interpretation.archetypes` use only the adjudicated dedicated two-pass result.
- Dedicated archetype failure retries once for technical / schema / language failure and then marks metadata `failed`.
- Successful adjudicated `[]` commits as metadata `ready`.
- Follow-up chat does **not** revise persisted `archetypes` for v1.
- Follow-up chat may still revise `affects`, `motifs`, `relational_dynamics`, `thresholds`, `central_conflicts`, `core_mode`, and `amplifications`.

## Integration files changed

- `supabase/functions/_shared/billing-ai.ts`
- `src/services/ai.ts`
- `src/ai/structuredTaskValidation.ts`
- `documentation/architecture-interpretation.md`
- `documentation/flows-06-jungian-ai-reflection.md`
- `docs/SYMBOLS_FLOW.md`
- `documentation/README.md`
- `supabase/functions/openai-proxy/README.md`
- `supabase/functions/ai-entitlements-gateway/README.md`
- `__tests__/flows/archetypeTwoPassIntegration.contract.flow.test.ts`
- `__tests__/flows/README.md`
- `__tests__/ai.test.ts`
- `tmp/run-v1-archetype-production-smoke.ts`

## Targeted verification

Commands run:

```bash
npm run typecheck
npm test -- --runTestsByPath __tests__/flows/archetypeTwoPassIntegration.contract.flow.test.ts __tests__/structuredTaskValidation.test.ts __tests__/archetypeRecognitionPipeline.test.ts __tests__/archetypeRecognitionMapper.test.ts --runInBand
npm test -- --runTestsByPath __tests__/ai.test.ts --runInBand -t "merges conversation element updates without changing dream symbols"
```

Result:

```text
typecheck: passed
targeted Jest suites: passed
```

## Production smoke results

Live production-path checks completed after deployment on Tuesday, July 28, 2026:

```text
1. sea_mattress_el_exact
   metadata_status: ready
   final archetypes: [lover]
   result: passed on attempt 1

2. warm_friends_en
   metadata_status: ready
   final archetypes: []
   result: passed on attempt 1

3. guide_negative_carrier_only_en
   metadata_status: ready
   final archetypes: []
   result: passed on attempt 1

4. mother_positive_en
   metadata_status: ready
   final archetypes: [mother]
   result: passed on attempt 1

5. persona_positive_en
   metadata_status: ready
   final archetypes: [persona]
   result: passed on attempt 1

6. divine_child_positive_en
   metadata_status: ready
   final archetypes: [divine_child]
   result: passed on attempt 1
```

Smoke runner artifact:

- `tmp/v1-archetype-production-smoke/results.json`

Note:

- An earlier batch-mode smoke attempt hit an unrelated `dream_extraction` output-language gate failure on a non-archetype field (`relational_dynamics[2]`). The final required smoke verification above was rerun fixture-by-fixture through the same live production path and passed.

## Deployment

Commands run:

```bash
supabase functions deploy openai-proxy
supabase functions deploy ai-entitlements-gateway
```

Result:

```text
openai-proxy: deployed successfully to project xacdawttvtfrdbcwhcqn
ai-entitlements-gateway: deployed successfully to project xacdawttvtfrdbcwhcqn
database push: not required
```

## Commit reference

Current repo HEAD during freeze work:

```text
2c59e17ab98985ca5b0b5b3df78a5d2dcef5974c
```

## Known residuals

```text
- full global benchmark across every canonical archetype was deferred
- some Shadow/Guide edge cases remain interpretively ambiguous
- ordinary-kitchen Inner Tensions residual is separate and unresolved
- myth routing and prompt diet are deferred
```

## Deferred post-launch work

- Broad generalization checks across the full canonical archetype set.
- Additional adjudication review for ambiguous Shadow / Guide boundary cases.
- Separate cleanup of the ordinary-kitchen Inner Tensions residual.
- Myth routing and prompt-diet follow-up after v1 launch.
