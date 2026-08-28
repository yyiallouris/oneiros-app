# Oneiros Reflection Editorial Arc v2 — Anchor Gate Review

**Date:** 2026-08-28  
**Decision:** `FAIL — EARLY STOP`  
**Production:** denied; approval remains `null`  
**Method:** `oneiros-reflection-editorial-arc-v2.0.0-candidate`  
**Reading prompt:** `oneiros-dream-reflection-v3.1.0-candidate`  
**Bundle SHA:** `6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49`

## Authorized experiment

The approved experiment allowed up to twenty-four fresh Standard GPT-5.4
journeys under a `$1.00` hard ceiling. Eight frozen anchors had to run first.
The sixteen stratified cases could run only if the anchors reached at least
`7/8` convincing journeys with zero hard failure and no repeated failure family.

No retry, repair, judge, cache, separate question call, prompt mutation, Quick,
or Advanced mode was allowed. The runner reserved conservative maximum cost
before each request.

## Actual run

| Signal | Result |
|---|---:|
| Anchor calls | 8 |
| Provider/model | OpenAI `gpt-5.4` for all 8 |
| Estimated cost | `$0.1287325` |
| Questions committed mechanically | 6 |
| Valid `no_question` | 1 |
| Mechanical rejection | 1 |
| Provider failures | 0 |
| Language mismatches | 0 |
| Internal whole-journey CLEAR PASS | 2/8 |
| Internal whole-journey FAIL | 6/8 |
| Stratified continuation | **not run** |

The internal whole-journey judgments were written and locked before diagnostic
checkpoints and raw evidence mechanics were opened.

## Locked whole-journey findings

- **PASS — `dinner-for-absent-host`:** preserves waiting polarity and creates a
  concrete relation between the carried plum and carried chair.
- **PASS — `sunrise-on-quiet-ridge`:** correctly chooses `no_question`; the calm,
  complete dream is allowed to end.
- **FAIL — `elevator-missing-button`:** returns to a portable “Πώς είναι…” felt
  shell and over-amplifies the parsley/threshold material.
- **FAIL — `words-rest-on-table`:** re-asks a waiting state whose quality is
  already supplied and turns silence into a larger truth/presence thesis.
- **FAIL — `zh-faguo-mingzi`:** invents a binary motive—protecting the light or
  making it enter water—that the dream does not stage.
- **FAIL — `skin-turns-to-bark`:** directly re-asks the explicitly supplied
  “παράξενη περηφάνια.”
- **FAIL — `ja-neon-home`:** overstates belonging/distance and returns a line
  ending as a statement (`でしょう。`); deterministic structure rejects it.
- **FAIL — `shared-scarf-at-harbor`:** rephrases the dreamer's already supplied
  freedom-versus-staying-bound binary.

Repeated families matter more than the aggregate:

- already-supplied material: at least 3;
- generic felt/reaction shell: 2;
- invented or forced premise: 1;
- malformed interrogative structure: 1.

## Root diagnosis

### 1. Decision-first did not solve semantic cannibalization

The private opening is emitted before the reading, but both are still composed
inside one inference. The model can choose an apparent opening and then consume
or explain that same opening while writing the complete reading. In three cases
the question ultimately repeats either an explicit dream answer or the final
ambivalence already stated by the dreamer.

### 2. D# provenance is necessary but too coarse to guarantee a new answer

The evidence ids correctly prove that the cited material occurs in the raw dream.
They do not prove that the answer has not already been supplied. Most short dreams
are one `D1` span, so exact provenance cannot distinguish a living relation from
a paraphrase of the whole supplied scene.

### 3. The model still prefers familiar therapeutic syntax

Pruning reduced prompt mass, but it did not remove the generator's attraction to
“How is it for you…?” and “How did it feel…?” forms. Those forms can pass syntax,
language, evidence-id, and length checks while remaining experientially redundant.

### 4. Sparse readings still attract interpretive inflation

The adaptive-length instruction is directionally correct, but the Standard frame
still produced substantial readings for tiny dreams. In the Chinese and Japanese
anchors, the prose expanded water, blessing, belonging, threshold, distance, and
lack beyond the evidence. The problem therefore concerns the whole editorial
journey, not only the final question.

### 5. `0–1` is validated, not rejected

`sunrise-on-quiet-ridge` is the clearest success in the packet. The model correctly
recognized that a peaceful completed dream needed no manufactured unfinished
business. The optional-question product decision should remain available in any
future topology.

## Decision

The continuation gate failed decisively. The sixteen new stratified dreams were
not called, preserving `$0.8712675` of the authorization ceiling. The exact v2
SHA is denied and cannot be production-approved through an environment override.

Do not patch this candidate with another small list of prohibitions. A next
experiment, if approved, must begin from the topology-level diagnosis: how to
compare a proposed opening against both the complete raw dream and the final
reading without making a validator the dominant writer or manufacturing a
leftover. The product-level `0–1` ending remains a useful invariant.

## Artifacts

Generated locally under:

`tmp/reflection-editorial-arc-standard24-anchors-2026-08-28T12-44-21-532Z/`

- `BLIND_REVIEW.md`
- `INTERNAL_EARLY_STOP_REVIEW.md`
- `GOLD_CHECKPOINTS_AFTER_SCORING.md`
- `DIAGNOSTICS.json`
- `SUMMARY.json`
- `REVIEW_ORDER.md`

The fixture dreams are synthetic. No production dream or user data was used.
