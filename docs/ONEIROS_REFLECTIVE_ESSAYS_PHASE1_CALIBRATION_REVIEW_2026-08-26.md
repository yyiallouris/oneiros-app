# Oneiros Reflective Essays Phase 1 — Anti-Coherence Calibration Review

**Date:** 2026-08-26
**Candidate prompt:** `oneiros-period-reflection-v2` / `oneiros-recent-dream-field-v2`, `2.0.2-phase1`
**Context:** `ESSAY_CONTEXT_VERSION = 1`
**Decision:** calibration is a strong improvement, but the pre-Phase-2 discrimination gate is not yet stable
**Phase 2:** blocked

## What changed

The approved Phase 1 calibration changed prompt instructions only. Model routing, temperatures (`0.48` Period / `0.46` Recent), context shape, sections, length policies, and compact retry behavior stayed unchanged.

The prompt now:

- requires concrete cross-dream evidence before one field may be named;
- treats no-field and parallel-cluster readings as successful outputs;
- forbids chronology from standing in for development;
- rejects generic qualities as sufficient connective evidence;
- clarifies that quoting one anchor per dream does not make an umbrella paraphrase concrete;
- counts a shared stance only when recognizably the same response recurs in comparable dream situations;
- preserves full interpretive ambition when concrete recurrence genuinely earns one field.

Version `2.0.1-phase1` introduced the evidence gate. The first post-patch diagnostic still unified unrelated dreams through `non-interference`; `2.0.2-phase1` added the narrower umbrella-paraphrase rule tested here.

## Frozen evaluation method

The final calibration gate used:

- one run of the four-case original fixed set;
- two independent runs of the five-case anti-coherence stress set;
- the same v1 comparison prompt, provider/model routing, context, and sampling settings;
- the same automated editorial judge, followed by manual reading of the acceptance-critical outputs.

Commands:

```bash
npm run review:reflective-essays-phase1
npm run review:reflective-essays-anti-coherence
npm run review:reflective-essays-anti-coherence
```

## Original fixed-set gate

The calibration preserved interpretive ambition where the material genuinely supports it.

| Case | Verdict | Coherence restraint | Winner |
|---|---|---:|---|
| Coherent positive Period | PASS | 5/5 | v2 |
| Coherent positive Recent | PASS | 5/5 | v2 |
| Contradictory access field | BORDERLINE | 4/5 | v2 |
| Intentionally loose Recent | BORDERLINE | 4/5 | v2 |

Aggregate: v2 won `4/4`; `2 PASS`, `2 BORDERLINE`, `0 FAIL`; mean v2 coherence restraint `4.5/5`; mean v2 length `441` rendered words.

The two deliberately coherent sea → path → garden cases remained coherent and received `PASS 5/5`. The door → train → house essay retained an earned access field while explicitly refusing resolution and linear development. The loose Recent output remained the weaker case: it denied one symbolic theme, then still assembled library, horse, and kitchen into a shared tone of `unforced contact`.

## Anti-coherence gate

Automated results across two independent runs:

| Measure | Result |
|---|---:|
| Total evaluated pairs | 10 |
| v2 preferred over v1 | 10/10 |
| Anti-coherence PASS | 7/10 |
| Anti-coherence BORDERLINE | 3/10 |
| Anti-coherence FAIL | 0/10 |
| Mean v1 coherence restraint | 1.5/5 |
| Mean v2 coherence restraint | 4.8/5 |
| Mean v1 rendered length | 647.3 words |
| Mean v2 rendered length | 461.8 words |
| v2 hard-cap overflows | 0 |

This is a material gain from the frozen pre-calibration result: `0 PASS / 6 BORDERLINE / 4 FAIL`, mean v2 coherence restraint `3.2/5`.

### Stability by failure shape

| Case | Run 1 | Run 2 | Manual acceptance reading |
|---|---|---|---|
| Truly unrelated Recent | BORDERLINE | PASS | Residual remains |
| Contradictory affects, no motif | PASS | PASS | Accepted |
| Same symbol, opposed stances | PASS | BORDERLINE | Accepted with sampling variance |
| Numinous + banal + distressing | PASS | BORDERLINE | Accepted with sampling variance |
| Two parallel clusters, six dreams | PASS | PASS | Accepted; stable prepatch failure closed |

The two-cluster failure is genuinely fixed. Both runs explicitly kept water/navigation and rooms/access parallel and rejected a master developmental thesis.

The unrelated case is not genuinely closed despite one automated `PASS`. In the first run, v2 organized the dreams under `light touch`. In the second, it began correctly — “does not quite gather into one dense field” — but then unified all three through `shared scale of response`, `lack of grasping`, `curious composure`, and `repetition of a stance`. That contradicts the frozen expectation: at most weak local affinities, not one shared movement.

The automated judge rewarded the second output for its explicit no-field disclaimer, but manual reading shows that the essay retracts that restraint in its body. Acceptance must evaluate the whole essay, not the opening disclaimer alone.

## Decision

The calibration proves that the evidence gate is useful:

- stable FAILs fell from `4/10` to `0/10`;
- parallel clusters are now reliably preserved;
- coherent fields remain interpretable with full ambition;
- v2 remains preferred to v1 in every paired comparison;
- no length or runtime-contract regression appeared.

It does **not** yet prove stable discrimination between a genuinely shared stance and three unrelated actions that can be redescribed under one abstract umbrella. Therefore:

1. keep Phase 1 provisionally accepted as the stronger essay architecture;
2. retain `2.0.2-phase1` as the reviewed calibration candidate in the branch;
3. do not begin narrative-first Phase 2;
4. do not deploy this prompt candidate as a completed calibration yet;
5. require a separate PO decision on the remaining topology problem instead of continuing ad hoc prompt wording changes.

## Subsequent PO decision

The PO approved one final, architecturally distinct Phase 1 experiment rather than another generic restraint patch: topology-first `2.0.3-phase1` plus a whole-essay `topology_consistency` evaluator criterion. The new gate must preserve coherent originals, keep parallel clusters at `PASS/PASS`, move truly unrelated dreams to `PASS/PASS` with manual acceptance, produce no anti-coherence FAIL, and reject any essay that denies a field before rebuilding it later. Phase 2 remains blocked until that separate review is complete.

Final result: [`ONEIROS_REFLECTIVE_ESSAYS_PHASE1_TOPOLOGY_FIRST_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_PHASE1_TOPOLOGY_FIRST_REVIEW_2026-08-26.md). Automated gates passed and the two stable adversarial failures closed, but the original loose-field output still rebuilt unity through broad affective equivalence. The manual gate therefore failed and Phase 2 remains blocked.

## Full outputs

Original fixed set:

- `tmp/reflective-essay-reflective-essays-phase1-fixed-set.v1-2026-08-26T12-44-11-975Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-phase1-fixed-set.v1-2026-08-26T12-44-11-975Z/results.json`

Anti-coherence run 1:

- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-45-06-051Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-45-06-051Z/results.json`

Anti-coherence run 2:

- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-49-27-209Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T12-49-27-209Z/results.json`

## Deployment and platform impact

No database migration or schema push is required. The shared prompt is bundled into `ai-entitlements-gateway`, so an eventual approved rollout requires:

```bash
supabase functions deploy ai-entitlements-gateway
```

No deployment was performed because the calibration gate remains open. `openai-proxy` is unchanged and does not require deployment. There is no UI, navigation, iOS, or Android behavior change, so no device E2E update is required.
