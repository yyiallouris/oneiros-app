# Oneiros Reflective Essays v2 Phase 1 — Regression Result

**Date:** 2026-08-26
**Decision state:** Phase 1 provisionally accepted; anti-coherence stress follow-up keeps Phase 2 blocked
**Fixed set:** `testing/live-scenarios/reflective-essays-phase1-fixed-set.v1.json`
**Runner:** `npm run review:reflective-essays-phase1`

## Controlled comparison

The runner sent the same existing metadata-heavy context to the frozen v1 baseline and v2 Phase 1. It kept the production model route and existing temperatures unchanged:

- Period Reflection: `0.48`
- Recent Dream Field: `0.46`
- essay context version: `1`

The set contains:

- a coherent, positive Greek period that should not be pathologized;
- the same Greek field as Recent, to test Period-vs-Recent differentiation;
- an English contradictory period that should not be forced into linear progress;
- a loosely connected English Recent sequence that should remain light.

Full generated essays and per-case scorecards are in:

`tmp/reflective-essay-phase1-regression-2026-08-26T11-32-38-593Z/REVIEW.md`

Machine-readable results are in:

`tmp/reflective-essay-phase1-regression-2026-08-26T11-32-38-593Z/results.json`

## Result

The paired editorial comparison selected v2 Phase 1 in **4 of 4 cases**. The evaluator was explicitly instructed not to favor an output because it was newer or shorter.

| Criterion, 1–5 | v1 average | v2 Phase 1 average | Change |
|---|---:|---:|---:|
| Repetition control | 3.00 | 4.50 | +1.50 |
| Interpretive restraint | 4.00 | 5.00 | +1.00 |
| Insight density | 3.00 | 4.25 | +1.25 |
| Surface fit | 3.00 | 4.75 | +1.75 |
| Stopping discipline | 2.25 | 4.75 | +2.50 |

Average rendered length fell from **624 words in v1 to 421 words in v2 Phase 1**, a **32.5% reduction**, while keeping the strongest evidence anchors and complete reflective-question sections.

## Per-case summary

| Case | v1 words | v2 words | v2 hard max | Questions v1 → v2 | Winner |
|---|---:|---:|---:|---:|---|
| Coherent positive Period, Greek | 623 | 419 | 550 | 2 → 2 | v2 Phase 1 |
| Coherent positive Recent, Greek | 516 | 330 | 425 | 2 → 1 | v2 Phase 1 |
| Contradictory Period, English | 812 | 536 | 550 | 2 → 2 | v2 Phase 1 |
| Loosely connected Recent, English | 545 | 399 | 425 | 1 → 1 | v2 Phase 1 |

All v2 outputs stayed within their initial hard maximum in the accepted run. None contained a fixture-defined forbidden claim. The adaptive question contract behaved correctly: the model used one question where a second did not add genuine value.

## Reviewer-focus findings

### Repetition

The editorial evaluator consistently found that v1 restated the same central insight across sections. V2 sections were more cumulative: each added evidence, complication, or temporal/current movement.

### Interpretive overreach

The positive Greek cases remained non-pathologizing in both versions. In the harder English cases, v1 introduced formulations such as `the psyche imagines`, `the psyche is circling`, and `the psyche wanders`; v2 stayed closer to supplied images and provisional field-level claims.

### Insight density

V2 retained the core evidence while using materially fewer words. The coherent Period output selected two of the three candidate anchors rather than inventorying all available material; the other v2 outputs retained all relevant anchors.

### Recent vs Monthly differentiation

For the paired Greek field, the v2 Recent output was 330 words versus 419 for Period and received a surface-fit score of 4/5 versus v1 Recent at 2/5. The evaluator described v1 Recent as closer to a miniature monthly essay and v2 as more immediate and appropriately light.

### Stopping discipline

This produced the largest scoring gain: 2.25/5 to 4.75/5. V2 stopped after establishing a substantial reading instead of filling the available token budget. No string truncation was used.

## Runtime length contract

Separate contract/unit coverage verifies:

```text
generate
→ count rendered words without headings/hidden marker
→ if incomplete or above initial hard maximum, rewrite the whole essay once
→ measure against the small post-retry tolerance
→ preserve semantic completeness; never truncate the returned string
```

The accepted live run did not require the retry because every v2 primary output landed within its hard maximum. The retry path remains covered deterministically in Jest.

## Gate decision

Phase 1 passes this fixed-set regression and is ready for human output review. This result does **not** authorize:

- Phase 2 narrative-first context;
- removing interpretive-heavy fields from essay context;
- changing model or temperature;
- production deployment.

The next decision is reviewer acceptance of the attached outputs and scorecards. Only after that separate approval should Phase 2 begin.

## PO follow-up

The PO accepted the general Phase 1 direction but identified a narrower risk: elegant **over-coherence**, especially when loosely connected dreams are turned into one gestalt. The required two-run stress result is documented in [`ONEIROS_REFLECTIVE_ESSAYS_ANTI_COHERENCE_STRESS_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_ANTI_COHERENCE_STRESS_REVIEW_2026-08-26.md). Result: v2 remained better than v1 in 10/10 comparisons, but achieved 0/10 anti-coherence passes. Phase 2 must not begin until the PO decides the narrow Phase 1 calibration response.
