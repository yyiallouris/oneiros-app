# Adaptive Reflective Openings — three-shot final review

**Decision: HOLD / STOP. Do not deploy. Do not create a fourth prompt candidate.**

> **Later confirmation addendum:** after explicit owner/PO authorization, this
> exact frozen Shot 3 was compared blind against production on 20 fresh dreams.
> It earned cardinality `20/20` but won only `11–9`, was independently shippable
> `16/20` versus production `18/20`, and produced three serious answer menus.
> The pre-registered confirmation gate failed; adaptive cardinality is parked
> for Oneiros v2. This was not a fourth prompt candidate. Final review:
> [`ONEIROS_ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_CONFIRMATION_REVIEW_2026-08-30.md`](./ONEIROS_ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_CONFIRMATION_REVIEW_2026-08-30.md).

The bounded prompt-only experiment did not make adaptive one-versus-two reflective-question selection reliable enough for production. Shot 3 preserved vitality and improved the stopping boundary, but passed only `5/10` full Reader cases against a `9/10` gate and retained three serious premise/menu failures.

Production remains exactly:

- method `oneiros-same-call-reflective-questions-v1.0.3-candidate`
- prompt SHA `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`
- Reader `oneiros-dream-reflection-v3.2.3-candidate`
- structure normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`
- runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`
- `ai-entitlements-gateway` function version `113`

No production prompt, cardinality, model, extraction, streaming, chat, Essays, Recent Dream Field, schema, database, or deployed Edge Function changed.

## Frozen experiment

The same sealed ten-dream synthetic multilingual fixture was used throughout:

- fixture: `testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json`
- fixture SHA: `4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71`
- cohorts: 2 enacted-only, 2 imaginal-only, 4 both-earned, 2 ambiguous
- surfaces: five Standard and five Advanced; Quick was also evaluated in Shots 1 and 2
- data boundary: synthetic dreams only; no production or user dream data
- runtime boundary: production request builder/model routing, no quality retries, semantic judge, repair, reranking, or deploy

| Shot | Frozen candidate / SHA | Prompt-engineering delta | Paid calls | Exact cost | Result |
|---|---|---|---:|---:|---|
| 1 | `oneiros-adaptive-reflective-openings-v0.1.0-candidate` / `da717215…` | Adaptive selection wrapped around the existing numbered Q1/Q2 jobs | 20 | `$0.22698500` | Full `6/10`; fixed two-slot behavior remained `10/10`; 3 serious failures |
| 2 | `oneiros-adaptive-reflective-openings-v0.2.0-candidate` / `ca2dbedb…` | Neutral job names plus private `ENACTED_ONLY / IMAGINAL_ONLY / BOTH` route | 20 | `$0.22575500` | Full target+quality `4/10`; two questions `9/10`; 4 serious failures |
| 3 | `oneiros-adaptive-reflective-openings-v0.3.0-final-candidate` / `13eea607…` | Asymmetric minimum-sufficient selection: one complete by default, second only when necessary | 10 | `$0.14549000` | Full target+quality `5/10`; three serious failures; final HOLD |

Shot 3 reused the ten byte-identical Shot 2 Quick outputs without model calls. Shot 2+3 spend was `$0.37124500 / $1.00`; all three shots together cost `$0.59823000`.

## Shot 3 final gate

- target selection + product quality: `5/10` (required `9/10`)
- target selection regardless of quality: `6/10`
- one-question output: `4/10`; two-question output: `6/10`
- strong complementarity among two-question outputs: `5/6`
- serious invented-premise / supplied-frame failures: `3` (allowed `0`)
- vitality: `10/10 PASS`
- human structural review: `10/10 PASS`
- deterministic R&D observer: `9/10 PASS`; the one flag was a quoted French dream-language question in prose, not a third reflective question
- retries, judges, repair, reranking, deployments: `0`

| Case | Expected | Actual outcome | Verdict | Main finding |
|---|---|---|---|---|
| Greek café seat | enacted only | two enacted questions | FAIL | redundant second opening after a resolved movement |
| English meeting voice | enacted only | one enacted question | PASS | correct restraint and relational precision |
| Greek warm sun | imaginal only | manufactured enacted change | FAIL | static reported happiness became an invented causal transition |
| Spanish blue bowl | imaginal only | manufactured enacted relation | FAIL | mere looking became a created relation; unreported flight history was added |
| German feather coat | both | both | PASS | distinct transformation and threshold openings |
| French grandfather/map | both | both | PASS | distinct handoff and absent-tree configuration |
| Portuguese half-gate | both | imaginal only | FAIL | a strong crossing opening was over-pruned |
| Italian bowl scenes | both | both | PASS | distinct unreflected place and inherited-name relation |
| Japanese umbrella/pond | both allowed | both | FAIL | supplied “withdrawing force / retreat” vocabulary framed the answer |
| Chinese lantern/stairs | both allowed | both | PASS | two related but distinct openings remained alive |

## Root cause

Shot 1 showed slot pressure: literal numbered Q1/Q2 jobs acted as mandatory output slots. Shot 2 removed those labels, but the symmetric three-way route defaulted to `BOTH`. Shot 3 made the choice asymmetric and improved cardinality, yet exposed a deeper instability: the same prompt policy could overproduce in a resolved café scene, underproduce in the half-gate dream, and manufacture movement in static imaginal scenes.

The remaining problem is not excessive caution. Vitality stayed `10/10`. It is source-eligibility and stopping-threshold reliability: deciding whether a source truly supports an opening and whether a second opening is necessary. A fourth clause would likely displace the error again rather than solve that decision consistently across dream types and languages.

## Final recommendation

Close this adaptive-cardinality prompt line. Preserve all three candidates, manifests, frozen outputs, human verdicts, hashes, and review reports as denied R&D evidence. Keep production v1.0.3 and its exact Standard/Advanced cardinality contract unchanged.

Adaptive cardinality may be reconsidered only after an explicit future product/architecture decision defines a different decision mechanism and authorizes a new evaluation. It should not be reopened as another prompt-wording iteration.

## Frozen Shot 3 evidence

- manifest SHA: `48dd4a0066c3579bc20a4400680dd76843d2f85a27d299947636fb992d762b03`
- raw evaluation SHA: `7efb14f81e4947c3e9af443fc52048d2897592e8c93104a06cfa6db17704d854`
- human verdicts SHA: `6da1e03a564f9a8c11a560e26b68f59aed9acab78789626ada0e7e29c8823ba6`
- reviewed results SHA: `a136e3d13181f80bc1e63c4cdd0a5732861dfa208f6525f9d180fa1b49818252`
- artifact directory: `testing/reflective-questions/artifacts/adaptive-openings-shot3-final-2026-08-29/`
