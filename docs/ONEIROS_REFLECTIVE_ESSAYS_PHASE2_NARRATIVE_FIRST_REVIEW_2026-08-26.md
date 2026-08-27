# Oneiros Reflective Essays — Phase 2 Narrative-First Context Review

**Date:** 2026-08-26
**Decision:** Phase 2 narrative-first rollout not approved; the follow-up Field Map spike failed its stop rule and Phase 2 R&D is closed
**Prompt:** frozen `2.0.3-phase1` in both arms
**Baseline:** metadata-heavy essay context version `1`
**Candidate:** narrative-first essay context version `2`

## Decision

Narrative-first context is a real grounding improvement, but it has not passed the topology-preservation gate.

Across the original fixed set and anti-coherence set, the candidate received `7 PASS / 0 BORDERLINE / 2 FAIL`. It won five paired comparisons, tied two, and lost two. The failures are not stylistic edge cases: they occur in the original loose Recent and the explicit two-parallel-cluster period case, where context-v2 makes the prose more phenomenological while also giving synthesis bias richer material from which to build an unearned bridge.

Therefore:

- keep prompt `2.0.3-phase1` frozen;
- keep Phase 1 accepted as the production baseline;
- retain the Phase 2 context-v2 implementation as a reviewed candidate;
- do not deploy `ai-entitlements-gateway` yet;
- do not patch the prompt in this change.

## Controlled comparison

Both arms used the same:

- prompt `2.0.3-phase1`;
- model policy;
- temperatures: `0.48` Period and `0.46` Recent;
- sections and language contract;
- semantic length policy;
- one-shot compact retry contract.

Only the supplied evidence context changed.

Context-v1 supplied the existing metadata-heavy block. Context-v2 led with bounded raw dream narrative, retained affects, symbols, symbol stances, landscapes, and relational dynamics, shortened the previous interpretation, and removed Core Mode, motifs, thresholds, central conflicts, Archetypal Echoes, and Mythic Echoes from default injection.

## Results

### Original fixed set

| Case | Candidate verdict | Winner | Topology result |
|---|---|---|---|
| coherent positive Period | PASS | candidate | earned unified field preserved |
| coherent positive Recent | PASS | candidate | earned unified field preserved with better Recent surface fit |
| contradictory Period | PASS | candidate | access/passage field preserved without resolution or progress claims |
| loose Recent | **FAIL** | baseline | candidate promoted weak affinity into one field and a temporal line |

The three supported fields improved materially. The judge consistently found more precise scene-level grounding without loss of restraint. The loose candidate crossed the accepted ambiguity boundary: it did not merely notice a faint atmosphere. It explicitly said the sequence “does not feel loose or fragmented,” named “unstrained orientation” as its field, unified checking / continuing / tightening as one relation to uncertainty, and proposed “increasing concreteness” across chronology.

### Anti-coherence set

| Case | Candidate verdict | Winner | Topology result |
|---|---|---|---|
| truly unrelated Recent | PASS | tie | separate/local relations preserved |
| contradictory affects without motif | PASS | tie | parallel topology preserved, with a slight umbrella-affinity warning |
| same symbol, opposed stances | PASS | candidate | repeated bridge retained without developmental arc |
| numinous + banal + distressing | PASS | candidate | distinct registers preserved |
| two parallel clusters, six dreams | **FAIL** | baseline | correct opening topology later weakened by a cross-cluster master stance |

The two-cluster candidate correctly named water/navigation and rooms/access as parallel, but then linked them through “a distinctive mode of approach,” “family resemblance in handling,” and “two worlds, outer and inner, both approached through tact.” That is an interpretive bridge rather than evidence present across the dream material. Later sections verbally restored separation, but the opening and synthesis section had already promoted the common abstraction into the month’s psychological center.

## Aggregate measurements

| Measurement | Phase 1 context-v1 | Phase 2 context-v2 |
|---|---:|---:|
| mean rendered words | 440 | 449 |
| minimum / maximum words | 356 / 629 | 348 / 658 |
| mean generation latency | 19.6 s | 17.5 s |
| compact retries | 0 | 0 |
| hard-cap overflows | 0 | 0 |
| explicit forbidden-claim hits | 0 | 0 |

Latency is directional only because each arm was sampled once per case and calls were sequential. The runner did not retain provider usage tokens in these packets, so no usage-based cost conclusion is claimed. Since the topology gate already failed, another paid run solely for cost measurement is not justified in this iteration.

## Product interpretation

The PO-approved distinction still stands:

> No sufficiently dense unified field does not mean there may be absolutely no cross-dream similarity.

The Phase 2 failures go beyond weak atmospheric resonance. In both, the candidate turns a broad similarity into an organizing field-level claim and then uses it to structure movement or monthly psychological meaning. The problem is not noticing `ease`, `handling`, or `tact`; it is granting those abstractions architectural authority that the concrete cross-dream evidence does not earn.

At the same time, the seven passes show that raw narrative does not universally increase over-coherence. It improves image-near precision in coherent, contradictory, opposed-stance, and mixed-register cases. The research result is therefore discriminative rather than a rejection of narrative-first context itself:

The one permitted architecture follow-up separated Field Map perception from composition. It scored `2 PASS / 7 FAIL` under manual review, failed the six-dream parallel-cluster target, and classified the two deliberately coherent fields as `loose`. Per the pre-agreed stop rule, no further Phase 2 prompt or architecture iteration follows. See [`ONEIROS_REFLECTIVE_ESSAYS_FIELD_MAP_SPIKE_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_FIELD_MAP_SPIKE_REVIEW_2026-08-26.md).

> Narrative-first evidence improves phenomenological grounding, but the current context balance can reactivate compulsive synthesis in loose and multi-cluster topologies.

## Implementation and rollout state

- During this historical candidate run, `ESSAY_CONTEXT_VERSION = 2` identified the narrative-first arm. After the failed Field Map stop rule, shippable runtime selection returned to `ESSAY_CONTEXT_VERSION = 1`.
- Client and gateway share `src/ai/reflectiveEssayContext.ts`.
- Original dream content is carried into eligible client and gateway essay entries.
- No database migration or RLS change is required.
- No production function was deployed during this evaluation.
- If a later product decision approves this candidate, deploy `ai-entitlements-gateway` with `supabase functions deploy ai-entitlements-gateway` and smoke-test Greek/English Recent and Period surfaces first.
- `openai-proxy` does not require deployment for this context-only change unless routing or shared proxy behavior changes separately.

## Evaluation artifacts

- Original fixed-set packet: `tmp/reflective-essay-phase2-context-reflective-essays-phase1-fixed-set.v1-2026-08-26T15-03-05-853Z/`
- Anti-coherence packet: `tmp/reflective-essay-phase2-context-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T15-06-45-158Z/`

`tmp/` is generated local output and is not a canonical long-term artifact. This document is the durable decision record.
