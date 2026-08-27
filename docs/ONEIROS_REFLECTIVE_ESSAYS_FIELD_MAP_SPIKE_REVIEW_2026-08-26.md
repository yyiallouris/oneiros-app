# Oneiros Reflective Essays — Field Map Architecture Spike Review

**Date:** 2026-08-26
**Decision:** architecture spike rejected; stop Phase 2 R&D and retain Phase 1 as the shippable baseline
**Essay prompt:** frozen `2.0.3-phase1`
**Production context:** restored to metadata-heavy version `1`
**Research context:** frozen narrative-first version `2`
**Field Map prompt:** `oneiros-reflective-essay-field-map-spike` / `0.1.0-rd`; schema `1`; temperature `0`

## Outcome

The experiment separated field perception from essay composition exactly once:

1. an evidence-only structured Field Map classified `unified`, `parallel_clusters`, or `loose`;
2. the unchanged `2.0.3-phase1` essay generator received that map as a binding boundary plus the frozen narrative-first context;
3. the result was compared with the already-generated direct Phase 2 baseline on the same nine cases.

The architecture did **not** satisfy its stop rule.

- It closed the original loose-Recent failure.
- It did not close the six-dream parallel-cluster failure: the Field Map pass returned no parseable map in the recorded concurrent run.
- It degraded coherent-field sensitivity: both deliberately coherent sea → path/thread → garden cases were classified `loose`.
- It also classified the concrete door → train → altered-house access/passage field as `loose`, contrary to the accepted fixture reading.
- One additional map was schema-invalid (`parallel_clusters` with only one declared cluster).
- Two valid loose maps were not faithfully preserved by the essay through the final question or umbrella framing.

This is not evidence for another prompt patch. It is evidence that the proposed pre-pass trades compulsive synthesis for unstable or excessive fragmentation while composition can still reintroduce unsupported glue.

## Case decisions

| Case | Field Map | Architecture decision | Reason |
|---|---|---|---|
| `period-coherent-positive-el` | `loose` | FAIL | Deliberately coherent field was under-read. The automated `pass` is manually overridden because its own rationale scored map accuracy `1/5`. |
| `recent-coherent-positive-el` | `loose` | FAIL | Coherent current field was under-read; gate also failed automatically. |
| `period-contradictory-en` | `loose` | FAIL | Door, train, and altered house support an accepted shared access/passage field without implying resolution. The map removed the field rather than preserving contradiction inside it. |
| `recent-loose-en` | `loose` | PASS | The prior umbrella unity and developmental thickening were removed without flattening the scenes. |
| `recent-truly-unrelated-en` | `loose` | PASS | Map and essay kept the unrelated scenes separate. |
| `period-contradictory-affects-no-motif-el` | `loose` | FAIL | Valid map, but the reflective question promoted a weak loneliness affinity into a bridge. |
| `recent-same-symbol-opposed-stances-en` | invalid | FAIL | Returned `parallel_clusters` with only one declared cluster. |
| `recent-mixed-numinous-banal-distressing-el` | `loose` | FAIL | Essay rebuilt umbrella glue across the three registers despite the map. |
| `period-two-parallel-clusters-six-dreams-en` | invalid | FAIL | No parseable Field Map; the primary topology target remained unresolved. |

Manual architecture result: **2 PASS / 7 FAIL**.

## Stop-rule decision

The accepted stop rule was:

> If the Field Map closes the two topology failures without degrading coherent essays, accept the architecture. Otherwise stop R&D and ship Phase 1.

The rule failed on both required sides. Therefore:

- freeze `2.0.3-phase1`; no `2.0.4`;
- keep `ESSAY_CONTEXT_VERSION = 1` in shippable client and gateway code;
- retain narrative-first context v2 and Field Map code only as evaluation artifacts;
- do not add another mapper, validator, judge, or prompt-calibration loop;
- do not deploy Phase 2 narrative-first or Field Map architecture.

Canonical product framing:

> Phase 2 narrative-first rollout is not approved. Phase 1 `2.0.3` with context version `1` remains the shippable baseline. The agreed architecture spike did not pass its stop rule, so Phase 2 R&D is closed.

## Evidence artifacts

- Original fixed set: `tmp/reflective-essay-field-map-reflective-essays-phase1-fixed-set.v1-2026-08-26T15-24-31-030Z/`
- Anti-coherence set: `tmp/reflective-essay-field-map-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T15-27-55-465Z/`

The second run used bounded concurrency `3`; each case still preserved the internal order Field Map → essay → judge. The production app, database, extraction contracts, Echo catalogs, and user-visible UX were not changed by the spike itself.
