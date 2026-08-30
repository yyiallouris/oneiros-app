# Adaptive Shot 3 vs production — blind confirmation review

**Decision: HOLD / PARK FOR ONEIROS V2. Do not deploy and do not make another prompt round.**

The exact frozen Shot 3 did not clearly outperform production under the
pre-registered product-calibrated gate. Blind ending preference was only
`11 Shot 3 / 9 production`, not the required `>=13 / <=4`. Shot 3 demonstrated
real stopping intelligence, but traded that gain against three serious
manufactured answer menus and fewer independently shippable endings than
production.

Production remains exactly:

- method `oneiros-same-call-reflective-questions-v1.0.3-candidate`
- prompt SHA `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`
- Reader `oneiros-dream-reflection-v3.2.3-candidate`
- structure normalizer `oneiros-reflective-question-structure-normalizer-v1.0.0`
- runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`
- `ai-entitlements-gateway` function version `113`

No production prompt, runtime, model, cardinality, extraction, streaming,
chat, Essays, Recent Dream Field, schema, database, or Edge Function changed.

## Frozen identities and method

- adaptive candidate:
  `oneiros-adaptive-reflective-openings-v0.3.0-final-candidate`
- adaptive SHA:
  `13eea6078f3885f5651f6bc8a3582be65b1a9e93ed658d7206a67cf68d2067ab`
- unseen fixture: 20 synthetic dreams, 10 Standard / 10 Advanced, 12 languages
- fixture SHA:
  `6c6f9c59a294b5059b26c733f3a094e58e5273abdacfe86202207da0e002f953`
- frozen rubric SHA:
  `30990b2fc7b0bea309c27f12af7ab41efecbe31bcf5ecd6829b94ae5e3a1fee1`
- sealed randomized key SHA:
  `92b60442ced1e8d502f42fbe78bc35667dc7e82fb20e6cefca494ae783a8b063`
- seal SHA:
  `71bb70e32701a107091ccc40ee83c8a0c8f1435a61a5e416f27f9ddf5afee957`
- calls: 40/40 paired production-versus-Shot-3 generations
- retries, semantic judges, repair, reranking, prompt changes, deployments: 0
- exact cost: `$0.60746000 / $1.00`

The fixture and rubric were frozen before calls. A/B placement was randomized
and sealed. All 20 A/B verdicts were completed before opening the key; the
frozen verdict file SHA is
`8b575a7911d0641b67ce03e8c88d88e62e0c905eb58028a4223a9448a8e9c74b`.
No theoretical `enacted / imaginal / both` target labels were used.

## Blind product results

| Metric | Shot 3 | Production | Gate |
|---|---:|---:|---:|
| Clear ending preference | 11 | 9 | Shot 3 `>=13`; production `<=4` |
| Clear full-reading preference | 11 | 9 | production `<=3` |
| Would ship to a real user | 16/20 | 18/20 | Shot 3 `>=15` |
| Earned cardinality | 20/20 | 18/20 | Shot 3 `>=17` |
| Vital and specific | 19/20 | 20/20 | editorial evidence |
| Serious fabricated dream facts | 0 | 0 | Shot 3 `0` |
| Serious manufactured answer menus | 3 | 2 | Shot 3 `0` |
| Structural/language hard failures | 0 | 0 | Shot 3 `0` |

Shot 3 selected one question in 3/20 cases and two questions in 17/20. The
three one-question endings — bakery, paper moon, and red-thread nest — all
earned their restraint and won their blind comparison. This is evidence that
the candidate improved the stopping boundary.

The improvement was not dominant enough to ship. Shot 3 lost nine pairwise
comparisons, was independently shippable less often than production, and
created serious bounded answer menus in Spanish, Japanese, and Chinese. Its
recurring non-serious `leading_symbolic_frame` family also exceeded the
pre-registered limit.

## Gate verdict

PASS:

- Shot 3 would-ship `16/20`
- earned cardinality `20/20`
- fabricated dream facts `0`
- structural hard failures `0`

FAIL:

- Shot 3 clear ending wins `11`, required at least `13`
- production clear ending wins `9`, allowed at most `4`
- Shot 3 serious answer menus `3`, allowed `0`
- recurring Shot 3 failure families exceeded one occurrence
- production clear full-reading wins `9`, allowed at most `3`

The gate is therefore **HOLD / PARK FOR ONEIROS V2**. The rubric is not changed
post hoc and the exact Shot 3 prompt is not rewritten.

## Product diagnosis

The prompt-only candidate can sometimes recognize when one question is enough.
It cannot yet make that gain without destabilizing the composition of the
question it keeps or adds. In this packet, adaptive cardinality did not solve
the supplied-answer problem; it displaced some of the risk into the surviving
questions.

This is not evidence for sterile fixed output as a universal ideal. It is
evidence that launch production should not accept additional runtime and UI
complexity for a candidate that wins only `11–9` and produces more serious
menus than the current fixed-two baseline. A future Oneiros v2 reopening should
treat selection/cardinality as an architectural or product decision, not as a
fourth prompt clause.

## Evidence

- raw outputs SHA:
  `acaf37a3453b6d77e4e727192ce6159f8c2628fada731660891ce1c278bf51f9`
- blind packet SHA:
  `530706ec4ae2802a5c5f4a55627fca41ff13a361dc09455d1645c264ac3e432e`
- blind human verdicts SHA:
  `8b575a7911d0641b67ce03e8c88d88e62e0c905eb58028a4223a9448a8e9c74b`
- reviewed results SHA:
  `0361b31912bfbc293c8456c4bf56f94ee20efb0543ce03ac4e4f762096245801`
- generated report SHA:
  `363f2bb6f6cd987ed171339b31b1599d848b208971201bc8e710718db02a5163`
- artifact directory:
  `testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30/`

The earlier mechanistic three-shot packet remains valid historical evidence;
this confirmation did not create Shot 4 or change the prompt. It tested the
exact frozen Shot 3 against production under a fresh, user-facing blind rubric.
