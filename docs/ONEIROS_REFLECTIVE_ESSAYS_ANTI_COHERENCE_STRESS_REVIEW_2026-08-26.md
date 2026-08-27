# Oneiros Reflective Essays Phase 1 — Anti-Coherence Stress Review

**Date:** 2026-08-26
**Decision state:** Historical pre-calibration `2.0.0-phase1` finding; calibrated results are reviewed separately
**Phase 2:** remains blocked after the calibrated dual regression
**Production prompt changes in this step:** none

## Why this stress set exists

The first Phase 1 regression showed a clear overall improvement, but the PO identified a more exact residual: the model may avoid pathology and conflict while still producing **over-coherence** — an elegant gestalt that the supplied dream field does not earn.

The question is therefore not merely whether the model can synthesize selectively. It is whether it can distinguish:

- **selective synthesis:** choosing the strongest supported relation;
- **compulsive synthesis:** feeling obliged to turn every supplied set into one meaningful field.

A mature response must be allowed to say that the dreams do not yet form a sufficiently dense field, that only weak local affinities are visible, or that two clusters remain parallel without a supported bridge.

## Frozen method

The test did not change:

- `oneiros-period-reflection-v2` / `2.0.0-phase1`;
- `oneiros-recent-dream-field-v2` / `2.0.0-phase1`;
- `ESSAY_CONTEXT_VERSION = 1`;
- Period temperature `0.48`;
- Recent temperature `0.46`;
- provider/model routing;
- the metadata-heavy essay context.

Fixture: `testing/live-scenarios/reflective-essays-anti-coherence-stress-set.v1.json`
Runner: `npm run review:reflective-essays-anti-coherence`

Five failure shapes were tested twice each:

1. truly unrelated recent dreams;
2. contradictory affects without a shared motif;
3. the same symbol with opposed stances;
4. numinous + banal + distressing dreams;
5. six dreams forming two equally dense parallel clusters.

## Aggregate result

Across two independent runs, v2 remained a better essay system than v1, but it did not pass the anti-coherence gate.

| Measure | Result |
|---|---:|
| Total evaluated pairs | 10 |
| v2 preferred over v1 | 10/10 |
| Anti-coherence PASS | 0/10 |
| Anti-coherence BORDERLINE | 6/10 |
| Anti-coherence FAIL | 4/10 |
| Mean v1 coherence-restraint score | 1.5/5 |
| Mean v2 coherence-restraint score | 3.2/5 |
| Mean v1 rendered length | 658.6 words |
| Mean v2 rendered length | 453.7 words |
| v2 hard-cap overflows | 0 |

This is not a regression to v1. V2 is consistently shorter, less repetitive, more provisional, and better fitted to Recent/Period. The unresolved problem is narrower: when a unified field is not supported, v2 still often creates one.

## Stability by failure shape

| Case | Run 1 | Run 2 | Stable reading |
|---|---|---|---|
| Truly unrelated Recent | FAIL | FAIL | Stable failure |
| Contradictory affects, no motif | BORDERLINE | BORDERLINE | Stable residual |
| Same symbol, opposed stances | BORDERLINE | BORDERLINE | Stable residual |
| Numinous + banal + distressing | BORDERLINE | BORDERLINE | Stable residual |
| Two parallel clusters, six dreams | FAIL | FAIL | Stable failure |

The identical verdict pattern across both runs makes the two failures unlikely to be one-off sampling noise.

## Case findings

### 1. Truly unrelated Recent — stable FAIL

The field intentionally combines a failed vending-machine purchase, an underwater choir, and a chewed slipper. Both v2 runs correctly preserve their different tones, but then build a shared stance of non-interference or proportion.

Representative v2 formulations:

> “What links these scenes is not passivity so much as a particular proportion.”

> “The sequence seems to keep testing whether experience can remain itself without being overmanaged.”

The prose is restrained and attractive, but the relation is manufactured. The mature answer would say that the scenes are currently too loose for one supported pulse.

### 2. Contradictory affects without a motif — stable BORDERLINE

V2 explicitly rejects one unified meaning and treats celebration, technical alarm, and snowy relief as different states. That is meaningful progress.

It still groups the table and bench as forms of `παραμονή` and describes a temporal passage through alarm into another kind of solitude. Those may be possible observations, but the fixture does not make them dense enough to organize the month.

### 3. Same symbol with opposed stances — stable BORDERLINE

The recurring bridge is genuine evidence. V2 successfully avoids calling refusal a failure and recognizes crossing, refusing, and observing as different relations.

The residual appears when temporal order becomes development:

> “The movement now seems to be away from automatic enactment.”

> “Exhilarated crossing gives way to a clear no, and then to sustained watching.”

The essay needs stronger permission to hold opposed stances without turning their sequence into widening capacity, preparation, or integration.

### 4. Numinous + banal + distressing — stable BORDERLINE

V2 explicitly says the dreams do not form one fully organizing line and keeps the whale, eggs, and alarm in visibly different registers.

It nevertheless proposes a movement from witnessing to practical attention to urgent orientation, then leaves open whether all three express the same capacity. This is appropriately tentative but still shows synthesis pressure.

### 5. Two parallel clusters — stable FAIL

This is the clearest architectural failure. The six dreams intentionally form:

- water/navigation: boat, shore, jetty;
- rooms/access: key, window, interior rooms.

The fixture states that no bridge between the clusters is supported. V2 identifies both clusters and then merges them:

> “The water dreams carry the same quality in another register.”

> “The field seems less interested in what lies hidden inside than in the forms of conduct that make inner and outer spaces inhabitable.”

> “The month does not move from exclusion to revelation so much as from careful approach to a more established stewardship of thresholds.”

This is elegant compulsive synthesis. It should instead present two parallel clusters and state that the available material does not yet show whether they belong to one movement.

## Product conclusion

Phase 1 remains a clear improvement and is provisionally accepted for normal reflective-essay use. The stress result does not justify reverting it.

However, the pre-Phase-2 anti-coherence gate is **not passed**:

- v2 is comfortable denying pathology;
- v2 is increasingly comfortable denying linear progress;
- v2 is not yet reliably comfortable denying a unified gestalt altogether.

Therefore Phase 2 should not begin yet. Narrative-first evidence could improve grounding, but it could also give the same compulsive-synthesis tendency richer material from which to construct an unsupported unity. The prompt architecture should first demonstrate that `no unified field` and `two parallel clusters` are legitimate successful outputs.

## Recommended next decision — subsequently approved

The PO subsequently approved this narrow Phase 1 calibration target:

1. explicitly define “no sufficiently dense field yet” as a successful essay outcome;
2. forbid treating generic stance similarities such as attention, restraint, proportion, or presence as a unifying field unless supported by repeated image/action/affect relations;
3. when two clusters are comparably dense, present them separately and do not create a master bridge without concrete cross-cluster evidence;
4. state that chronological order alone does not establish development;
5. keep the current model, context, temperatures, sections, word policies, and operational retry unchanged during that calibration.

Any approved calibration should receive a new Phase 1 prompt patch version and rerun both the original regression and this frozen stress set before Phase 2.

That calibration was completed as candidate `2.0.2-phase1`. See [`ONEIROS_REFLECTIVE_ESSAYS_PHASE1_CALIBRATION_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_PHASE1_CALIBRATION_REVIEW_2026-08-26.md) for the final dual regression and decision.

## Full outputs

Run 1:

- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-04-39-167Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-04-39-167Z/results.json`

Run 2:

- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-09-13-105Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-09-13-105Z/results.json`

## Deployment and platform impact

This is evaluation infrastructure and documentation only. No production prompt, Edge Function behavior, schema, storage, UI, iOS behavior, or Android behavior changed. No Supabase function deploy and no database push are required.
