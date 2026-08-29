# Oneiros v1.0.2 surgical patch candidate — 2026-08-29

**Status:** EVALUATED — HOLD / ARCHIVED / DO NOT DEPLOY. The frozen anchor packet
repaired 7/14 selected failures but left 7 unresolved and regressed 2/6
controls. Its prompt delta is no longer runtime and its identity is explicitly
denied; the independent replay repair remains on approved v1.0.1. Review:
[`ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md).
Offline root cause:
[`ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ROOT_CAUSE_2026-08-29.md).

| Field | Value |
|---|---|
| Method | `oneiros-same-call-reflective-questions-v1.0.2-candidate` |
| Bundle SHA-256 | `94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96` |
| Reader | `oneiros-dream-reflection-v3.2.2-candidate` |
| Chat | `oneiros-followup-chat-v2.0.2-candidate` |
| Approved/deployed predecessor | `v1.0.1` / `e7e4ea4b…` |
| Evaluation | completed: 20 calls, `$0.23542850`; human 11 PASS / 9 FAIL; HOLD |

## Engineering preflight

- Candidate bundle hash recomputed as
  `94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96`.
- Frozen baseline fixture hash verified as
  `5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc`.
- Evaluation preflight confirms exactly 20 calls: 10 Reader failure anchors,
  4 chat failure anchors, and 6 controls; zero model retries and zero semantic
  judge calls.
- Focused candidate/replay/deploy contracts: 10 suites, 62 tests passed.
- Full Jest: 139 suites / 843 tests passed; 2 suites / 5 tests skipped.
- TypeScript typecheck and `git diff --check` passed.
- At evaluation time, the deploy guard correctly rejected local
  v1.0.2-candidate against approved v1.0.1. Local runtime has since been restored
  to v1.0.1 and the failed candidate added to the denied registry. No deployment
  was attempted.

## Exact prompt delta

Reader prose, constitution, structure, product depth, models, temperatures, token
limits, output language, cardinality, streaming, and shadow validation are
unchanged. The question safeguards add only:

```text
- Never supply candidate answer vocabulary: do not list possible feelings, bodily states, meanings, motives, qualities, interpretations, or reactions for the dreamer to choose from. The answer-space must remain genuinely open.
- Do not reconstruct missing inner footage. If the dream did not report a bodily feeling, emotional quality, perception, or reaction, do not phrase the question as though that experience definitely existed and only needs to be remembered. Ask into an already-staged image, gesture, relation, movement, threshold, tension, or event instead.
- Keep every question specific to a living dream detail. Never retreat to generic shells such as “How does this make you feel?”, “What does this mean to you?”, “What comes up for you?”, or “What do you notice?”.
- Depth comes from following the relation between already-connected dream elements, not from supplying more nuanced options. Deepen the relation; do not widen the menu.
```

Question 1 now explicitly permits remembered-body wording only when the dream
reports or clearly stages that experience. Question 2 now says Deeper depth must
follow an already-connected relation rather than candidate meanings/states.
Quick and Standard keep the existing Core depth; cardinality is unchanged.

Follow-up chat adds exactly one line:

```text
When ending with a reflective question, ask one genuinely open question; never offer binary, either/or, or X/Y/Z candidate answers unless the dream itself explicitly stages that exact unresolved choice and preserving it is necessary.
```

## Committed follow-up replay patch

New follow-ups persist compact user/assistant message IDs in quota
`result_context`. On an already-committed idempotency replay,
`dream_followup_reply` skips model work and quota commit, finds the persisted
assistant turn by those IDs, and returns the same reply/message list. Historical
committed rows without IDs use a bounded adjacency fallback on the persisted
user-message/assistant-message pair. A missing persisted pair fails safely with
HTTP 409 instead of dereferencing absent ephemeral `result.value`.

This engineering repair is now isolated on the approved/local v1.0.1 prompt
bundle. It still requires a guarded `ai-entitlements-gateway` deployment before
remote production receives it.

## Frozen evaluation packet

- 10 Reader failure anchors: supplied options and missing-inner-footage patterns.
- 4 genuine open-chat answer-menu failures.
- 6 previously strong controls across Quick, Standard, Advanced, and chat.
- Exactly 20 fresh calls, concurrency 2, no retry, no judge, hard cap `$1`.
- Exact v1.0.1 before outputs are loaded from the tracked diagnostic artifact;
  after outputs and validator observations are preserved in full.

The explicitly approved run completed once. Do not rerun automatically:

```bash
ONEIROS_V102_SURGICAL_ANCHORS_COST_APPROVED=1 \
npm run benchmark:reflective-v102-surgical-anchors
```

Exact outputs and the separate validator/editorial findings are preserved in
[`ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md`](./ONEIROS_V102_SURGICAL_ANCHOR_REVIEW_2026-08-29.md).
No deploy or database push is part of this candidate review.
