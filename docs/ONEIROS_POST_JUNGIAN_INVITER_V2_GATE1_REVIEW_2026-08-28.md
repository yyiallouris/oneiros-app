# Oneiros Post-Jungian Inviter v2 — Live Gate 1 review

**Date:** 2026-08-28  
**Decision:** **FAILED — STOP**  
**Production approval:** `null`

## Frozen identity

| Field | Exact value |
|---|---|
| Method | `oneiros-post-jungian-inviter-v2.0.1-candidate` |
| Prompt | `oneiros-post-jungian-inviter-prompt-v2.0.1-candidate` |
| Bundle SHA-256 | `09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e` |
| Corpus | `oneiros-frozen-anchor-readings-v1` |
| Corpus SHA-256 | `2a1a8bc3a5b4a0019155e2856771c3eea4450be44e57ad1eeea0907d52738628` |
| Model | GPT-5.4 |
| Temperature | `0.35` |
| Token limit | `360` |
| Live topology | eight sequential Inviter-only calls |

The run used the exact approved system prompt, user wrapper, minimal
four-field Structured Output schema, and eight frozen readings. It made no
Reader, retry, repair, selector, judge, fallback, or prompt-mutation call. The
additional sixteen were not run.

## Mechanical result

- `8/8` valid responses and `8/8` question decisions.
- `0` provider failures, `0` deterministic/schema failures, and `0` confident
  language mismatches.
- Cost: `$0.043675` against the `$0.30` hard ceiling.
- Latency: p50 `2609.5 ms`; p95 nearest-rank `4439 ms`.
- No production deploy, database change, runtime import, or metadata change.

## Locked blind review

The internal reviewer read only the raw dream, frozen reading, and resulting
invitation. Scores and rationales were written and hashed before diagnostics or
gold checkpoints were opened.

- Blind lock SHA-256:
  `d23a2168bd4eec03ee2353c1dbd85757a7bb4914ee571509691f6ed5325e1a03`
- Result: `0 CLEAR PASS / 1 BORDERLINE / 7 FAIL`.
- Fluent JA/ZH review remains pending, but cannot rescue the failed aggregate
  and repeated hard-failure families.

| Case | Blind verdict | Primary finding |
|---|---|---|
| `elevator-missing-button` | FAIL | Portable felt-quality interview shell |
| `words-rest-on-table` | FAIL | Missing footage and imagined logistics |
| `dinner-for-absent-host` | BORDERLINE | Image-bound, but abstract/agentless movement and strained speech |
| `zh-faguo-mingzi` | FAIL | Forced selection and decomposition of the image |
| `sunrise-on-quiet-ridge` | FAIL | Unnecessary question inventing a next gaze |
| `skin-turns-to-bark` | FAIL | Generic felt-response shell |
| `ja-neon-home` | FAIL | Generic somatic response not staged by the dream |
| `shared-scarf-at-harbor` | FAIL | Generic body interview and unstaged response |

## Failure taxonomy

- `generic_reaction`: `4`
- `missing_footage_or_unstaged_response`: `4`
- `image_flattening`: `2`
- `interpretation_confirmation_or_selection`: `1`
- `unnecessary_question`: `1`
- `abstract_movement`: `1`
- `spoken_naturalness`: `1`
- `language_naturalness_pending`: `2`

Counts overlap because a single invitation can express more than one failure.

## Diagnosis

The living-relation ontology changed the surface of the outputs: almost every
invitation explicitly returned to a concrete dream image. It did not reliably
change the function of the question. The model repeatedly converted imaginal
re-entry into reusable interview moves: felt-quality prompts, generic bodily
response, hypothetical continuation, or forced choice among image parts.

The candidate therefore improved image selection more than reflective
intelligence. Its mechanics are reliable, but its psychological and editorial
operation remains below the Oneiros bar. This is evidence to stop prompt-only
synonym revision on this line. No v3 wording iteration, repeat Gate, or larger
packet is authorized by this result; any successor requires a concrete
mechanism-level diagnosis and separate approval.

## Reviewer artifact

The generated packet under
`tmp/post-jungian-inviter-v2-gate1-2026-08-28T14-37-56-785Z/` contains:

- all eight raw dreams, frozen readings, and outputs;
- the exact prompt stack and schema;
- the locked blind review and its hash;
- post-scoring gold checkpoints;
- raw and normalized diagnostics;
- per-case cost/latency and failure taxonomy;
- executive summary, final diagnosis, and verification report.

The corpus is synthetic and contains no production or user data.
