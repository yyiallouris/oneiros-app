# Oneiros v1.0.2 surgical anchor review — 2026-08-29

**Decision:** HOLD. Do not approve or deploy
`oneiros-same-call-reflective-questions-v1.0.2-candidate` / SHA
`94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96`.

This is the single frozen evaluation authorized by the PO. No second prompt
rewrite, broad benchmark, semantic judge, retry, or deployment followed it.
The exact prompts and replay implementation are recorded in
[`ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md).

## Run facts

| Field | Result |
|---|---:|
| Calls | 20 |
| Reader failure anchors | 10 |
| Chat failure anchors | 4 |
| Previously strong controls | 6 |
| Model retries | 0 |
| Semantic-judge calls | 0 |
| GPT-5.4 calls | 15 |
| GPT-5.4-mini calls | 5 |
| Exact cost | `$0.23542850` |
| Hard cap | `$1.00` |
| Latency min / median / mean / max | `2,451 / 7,792 / 9,242 / 23,438 ms` |

Exact full dreams, user turns, before/after responses, extracted questions,
validator objects, models, latency, and cost are preserved in
[`RAW_BEFORE_AFTER.json`](../testing/reflective-questions/artifacts/v1.0.2-surgical-anchor-evaluation-2026-08-29/RAW_BEFORE_AFTER.json).

## Outcome

| Review layer | Before | Candidate |
|---|---:|---:|
| Deterministic validator | 6 PASS / 14 FAIL | 9 PASS / 11 FAIL |
| Human editorial review | 6 control PASS / 14 selected failures | 11 PASS / 9 FAIL |

Within the 14 selected failure anchors, the candidate repaired 7 and left 7
unresolved. It preserved 4 of 6 controls and regressed 2. One unresolved Reader
anchor also lost the required `## Reflective Questions` heading, so its two
visible bullets were not extracted and the structural contract failed.

The successful cases stayed specific and Oneiros-like; there was no broad
flattening into generic therapy shells. The stop condition is nevertheless met
because option menus remain common, two strong controls regressed, and one
structural failure appeared.

## Human editorial verdict by case

Human PASS means the candidate removed the selected failure while keeping a
specific, alive question, or preserved a control without flattening. Validator
PASS/FAIL is reported separately and is not used as the editorial verdict.

| Case | Cohort | Validator | Human | Exact editorial finding |
|---|---|---|---|---|
| `en-s-ancestor-coat:reading_standard` | Reader failure | FAIL | FAIL | Required heading disappeared, extraction returned zero questions, and the first visible bullet still supplies `weight, age, or...` answer vocabulary. |
| `en-s-conflict-bridge:reading_standard` | Reader failure | FAIL | FAIL | The first question still offers three candidate explanations for why the bridge feels narrow. |
| `en-a-surreal-whale-library:reading_advanced` | Reader failure | FAIL | PASS | Missing-body-footage premise disappeared; both questions stay specific to candle/library/return. Validator false-positive comes from generic cross-language `of` matching `one of them`. |
| `en-a-complex-city-tide:reading_advanced` | Reader failure | FAIL | PASS | Unreported dream-body premise disappeared; questions remain anchored to childhood rooms, planted key, and waiting tide. Validator false-positive comes from generic cross-language `of` matching `kind of answer`. |
| `el-s-body-bark:reading_standard` | Reader failure | FAIL | FAIL | First question still supplies a three-part answer frame: rhythm, weight of hands, or felt quality of writing. |
| `el-s-conflict-house:reading_standard` | Reader failure | FAIL | FAIL | First question still asks the dreamer to choose among room, distance between bodies, or own position. |
| `el-a-complex-hospital:reading_advanced` | Reader failure | PASS | PASS | Supplied bodily states disappeared; both questions deepen already-staged relations without flattening. |
| `el-a-ancestor-olive-door:reading_advanced` | Reader failure | FAIL | FAIL | First question still supplies three spatial arrangements for the table. |
| `pl-a-conflict-stairs:reading_advanced` | Reader failure | PASS | PASS | Missing-body options disappeared; the questions stay concrete and deepen the stairs/own-voice relation. |
| `zh-a-ambiguous-ancestor-river:reading_advanced` | Reader failure | FAIL | FAIL | First question remains an explicit binary and the prose itself adds another binary rhetorical question, causing a real extra-question structural failure. |
| `el-q-relational-brother:chat_followup` | Chat failure | PASS | PASS | Binary hand-versus-silence menu became one open, specific question about a recognized gesture of care. |
| `el-a-surreal-moon-kitchen:chat_followup` | Chat failure | PASS | PASS | Color/weight/floating menu became an open question grounded in the user's phrase about presence without stability. |
| `es-q-relational-balcony:chat_followup` | Chat failure | PASS | PASS | Watering-versus-holding binary disappeared; the replacement follows the user's already-stated shared care. |
| `pl-a-conflict-stairs:chat_followup` | Chat failure | FAIL | FAIL | The replacement remains a direct family-loss versus missed-own-voice binary. |
| `en-q-restorative-garden:reading_quick` | Control | PASS | PASS | Quick stays compact, specific, relational, and at Core depth. |
| `en-s-body-glass-hands:reading_standard` | Control | PASS | PASS | Standard remains specific and alive; no supplied answers or missing footage. |
| `el-a-surreal-moon-kitchen:reading_advanced` | Control | FAIL | FAIL | Previously clean control regressed into a kitchen-versus-sky binary. |
| `pt-s-body-feathers:reading_standard` | Control | FAIL | FAIL | Previously clean control regressed into three supplied feather-development states. |
| `de-q-threshold-forest:reading_quick` | Control | PASS | PASS | Quick preserved Core depth and became more relational without becoming generic. |
| `en-a-complex-city-tide:chat_followup` | Control | PASS | PASS | Open question remains tightly connected to the user's stated first personal choice. |

## Validator versus human review

Candidate validator totals were 9 PASS / 11 FAIL. Issue incidence:

- `manufactured_answer_menu`: 10
- `question_count_mismatch`: 2
- `missing_reflective_questions_heading`: 1

Human review found 9 actual failures. Two validator-only failures were the two
English Advanced Readers above. The shadow observer intentionally performs a
second language-agnostic menu scan; its generic regex includes Dutch `of`, so
ordinary English `kind of` / `one of` phrases are marked as menus. That is a
deterministic observer false-positive, not a prompt-quality failure. This review
does not change the validator because the PO required validator findings to stay
separate from editorial judgment and forbade automatic iteration.

No human FAIL received an overall validator PASS in this packet. However, the
ancestor-coat answer menu was masked by missing-heading extraction, and the
Chinese count mismatch arose from a third rhetorical question in the prose even
though the extracted section still contained two bullets.

## Replay engineering result

The independent committed-replay patch passes focused coverage:

1. first pending request generates and commits once;
2. identical committed replay has no ephemeral `result.value`;
3. persisted message IDs reconstruct the original assistant reply and messages;
4. model generation remains at one call;
5. quota commit remains at one call;
6. legacy rows use a constrained adjacent-message fallback;
7. unreconstructable committed evidence returns HTTP 409 instead of generating again.

This engineering repair is sound. It has since been isolated on the approved
v1.0.1 runtime bundle and deployed in guarded `ai-entitlements-gateway`
version `112`. Live replay evidence confirmed reconstruction of the same
persisted result with no second model call, quota commit, or persistence write.

## Recommendation

**HOLD the complete v1.0.2 candidate.** The prompt identity is now explicitly
denied and absent from runtime; the replay fix is retained independently on
approved v1.0.1 / `e7e4ea4b…`. Do not perform a second prompt rewrite or
validator patch until the PO reviews these exact results and chooses the next
scope. Offline diagnosis:
[`ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md).

No prompt, gateway, database, `openai-proxy`, or mobile deployment was made.
