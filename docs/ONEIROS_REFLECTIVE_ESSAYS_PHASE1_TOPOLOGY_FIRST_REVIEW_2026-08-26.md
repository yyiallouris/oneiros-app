# Oneiros Reflective Essays Phase 1 — Topology-First Review

**Date:** 2026-08-26
**Candidate prompt:** `oneiros-period-reflection-v2` / `oneiros-recent-dream-field-v2`, `2.0.3-phase1`
**Context:** `ESSAY_CONTEXT_VERSION = 1`
**Decision:** automated gate passed; manual acceptance gate failed on the original loose-field case
**Phase 2:** blocked
**Deployment:** blocked

## Approved experiment

The PO approved one final Phase 1 experiment that differs architecturally from the earlier restraint patches:

1. choose one field topology before interpretation — unified, parallel/local clusters, or loose;
2. preserve that topology through every section and reflective question;
3. treat abstract equivalence as distinct from recurrence;
4. require comparable situation → comparable affective stance → comparable action/response before naming one shared stance;
5. evaluate topology consistency across the entire essay, not only its opening disclaimer.

This remained prompt-only. Context version `1`, provider/model routing, Period temperature `0.48`, Recent temperature `0.46`, sections, length policies, and retry behavior did not change.

## Evaluator correction

The first paired run exposed an evaluator-schema ambiguity: some v2 essays received coherence/topology scores of `5/5` and rationales saying that topology was preserved, but the top-level anti-coherence verdict was `FAIL` because the judge appeared to apply it to v1.

Those contradictory verdicts were excluded from the acceptance aggregate. The evaluator contract was corrected so that:

- `anti_coherence_verdict` applies only to v2;
- v1 quality affects only v1 scores and the paired winner;
- `v2_topology` and `v2_topology_preserved` are explicit;
- verdict, scores, topology fields, and rationale must agree;
- an opening disclaimer cannot compensate for later contradictory synthesis.

The corrected runner and focused tests passed before the official gate was repeated.

## Official automated gate

### Original fixed set

| Case | V2 topology | Preserved | Verdict | Coherence | Topology consistency |
|---|---|---|---|---:|---:|
| Coherent positive Period | unified | yes | PASS | 5/5 | 5/5 |
| Coherent positive Recent | unified | yes | PASS | 5/5 | 5/5 |
| Contradictory access field | unified | yes | PASS | 4/5 | 4/5 |
| Intentionally loose Recent | loose | yes | PASS | 5/5 | 5/5 |

Aggregate: v2 won `4/4`; `4 PASS / 0 BORDERLINE / 0 FAIL`; mean coherence restraint `4.75/5`; mean topology consistency `4.75/5`; mean v2 length `442.25` rendered words; no hard-cap overflow.

### Anti-coherence set — two independent runs

| Case | Run 1 | Run 2 | Manual acceptance |
|---|---|---|---|
| Truly unrelated Recent | PASS 5/5 | PASS 5/5 | PASS/PASS |
| Contradictory affects, no motif | PASS 5/5 | PASS 5/5 | accepted |
| Same symbol, opposed stances | PASS 4/5 | PASS 5/5 | accepted |
| Numinous + banal + distressing | PASS 5/5 | PASS 5/5 | accepted |
| Two parallel clusters, six dreams | PASS 5/5 | PASS 5/5 | PASS/PASS |

Aggregate: v2 won `10/10`; `10 PASS / 0 BORDERLINE / 0 FAIL`; mean coherence restraint `4.9/5`; mean topology consistency `4.9/5`; mean v2 length `440.6` rendered words; no hard-cap overflow.

## Manual acceptance findings

### Stable failures that closed

The truly unrelated set passed manually in both official runs. Each essay kept the airport and slipper as a limited local pair and treated the underwater choir as a separate register. Neither later section reconstructed one common stance across all three dreams.

The six-dream set also passed manually twice. Water/navigation and rooms/access remained parallel through movement, open section, and questions; no master access/threshold thesis reappeared.

### Earned unity remained available

The sea → guided path → shared garden cases remained unified and evidence-led. The official corrected run scored both `PASS 5/5`; the extra diagnostic generation scored Period `5/5` and Recent `4/5`, so Recent did not demonstrate the PO's strict “stable 5/5” threshold across both available `2.0.3` samples even though both outputs remained coherent and product-appropriate.

### Remaining blocker — original loose Recent

The automated judge marked the original loose case `PASS`, but manual reading rejects it under the PO's explicit rule that no loose-field essay may deny a field and later rebuild one.

The official output begins:

> “This recent sequence does not quite gather into one dense field.”

It later reunifies library, horse, and kitchen through:

> “an absence of psychic drama”

> “situations remain proportionate to themselves”

> “different scales of contact … each met with enough ease”

The extra diagnostic generation repeats the same topology reversal through:

> “different pockets of easeful contact”

> “a particular lack: no heavy obstacle”

> “surprisingly little psychic noise”

This is the remaining failure in precise form: the model respects the no-field declaration structurally, but still finds a broad affective equivalence that functions as one shared stance. The upgraded evaluator also missed it, so automated PASS is not sufficient evidence for this gate.

## Decision

The topology-first experiment materially improved discrimination and closed the two stable adversarial failures. It did not pass the full PO gate because:

- the original loose-field output rebuilt unity in both available `2.0.3` generations;
- the evaluator still accepted that contradiction;
- coherent Recent reached `4/5` in one of the two available `2.0.3` samples rather than stable `5/5`.

Therefore:

1. do not perform another wording calibration in this change;
2. do not deploy `2.0.3-phase1` as a completed calibration;
3. do not begin narrative-first Phase 2;
4. retain the candidate and all outputs for PO review;
5. require a new product/architecture decision before further work.

## Official outputs

Original fixed set:

- `tmp/reflective-essay-reflective-essays-phase1-fixed-set.v1-2026-08-26T14-23-57-299Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-phase1-fixed-set.v1-2026-08-26T14-23-57-299Z/results.json`

Anti-coherence run 1:

- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T14-24-37-682Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T14-24-37-682Z/results.json`

Anti-coherence run 2:

- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T14-28-50-224Z/REVIEW.md`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T14-28-50-224Z/results.json`

Excluded evaluator-diagnostic outputs:

- `tmp/reflective-essay-reflective-essays-phase1-fixed-set.v1-2026-08-26T14-18-33-654Z/`
- `tmp/reflective-essay-reflective-essays-anti-coherence-stress-set.v1-2026-08-26T14-19-09-713Z/`

## Deployment and platform impact

No database migration or schema push is required. The shared prompt is bundled into `ai-entitlements-gateway`, so a future approved rollout would require:

```bash
supabase functions deploy ai-entitlements-gateway
```

No deployment was performed. `openai-proxy` is unchanged. There is no UI, navigation, iOS, or Android behavior change, so no device E2E update is required.
