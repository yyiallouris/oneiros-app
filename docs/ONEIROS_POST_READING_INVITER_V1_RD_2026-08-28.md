# Oneiros Post-Reading Inviter v1 — R&D contract

**Status:** `GATE 1 FAILED — STOP`; production approval remains `null`  
**Date:** 2026-08-28  
**Bundle SHA-256:** `70c533e59b56693d5ade15a5234d2a7457ef194ba157750f67e884e13bb42cfa`

## Why this experiment exists

The combined editorial-arc candidate failed because a single inference could
choose an opening and then consume that opening while writing the reading. The
v5 single-pass question engine also showed that self-audit fields can report
clean semantics while the user-facing question remains answered, generic, or
premised on unstaged material.

This experiment changes topology, not psychological theory:

```text
raw synthetic dream
  → frozen Oneiros Reader (GPT-5.4)
  → completed reading
  → post-reading Inviter (GPT-5.4; raw D# + read-only final reading)
  → question | no_question
```

## Reader identity

The Reader is based on the pre-editorial prompt in
`d5f68e6e4b1b3c2db7ae81385031ea8331e2f9db:src/services/ai.ts`. Its constitution,
role, Core modes, image-near Standard structure, mythic restraint, temperature,
and GPT-5.4 route are retained.

Two boundary changes are explicit and versioned:

1. the Reader returns only reading prose; it does not own a question;
2. Standard has no word minimum or target range and has a `520`-word ceiling.

The second change removes pressure to exhaust a small dream. The ceiling is a
safety boundary, not a target. Quick and Advanced are not part of Gate 1.

Identity:

- method `oneiros-frozen-reader-ceiling-v1.0.0-candidate`
- prompt `oneiros-frozen-reader-standard-v1.0.0-candidate`
- version `1.0.0-candidate`
- model/task `gpt-5.4` / `interpretation_standard`

## Inviter identity and job

- method `oneiros-post-reading-inviter-v1.0.0-candidate`
- prompt `oneiros-post-reading-inviter-prompt-v1.0.0-candidate`
- version `1.0.0-candidate`
- schema `1`
- model/task `gpt-5.4` / research alias `interpretation_quick`

The Inviter is an aperture discriminator. It treats everything already supplied
by either the raw dream or final reading as closed. It may return a question
only when a concrete image/action/relation remains answerable by the dreamer
without missing footage, hidden motive, waking-life application, polarity or
agency reversal, or a portable therapist shell.

The decisive novelty check is the shortest honest answer: if that answer is
already in the dream or reading, the opening is invalid. `no_question` is a
complete outcome and receives no fallback.

Returned JSON contains only:

```json
{
  "decision": "question | no_question",
  "question": "string | null",
  "evidence_ids": ["D1"],
  "output_language": "el"
}
```

There is no Director, Composer, intermediate psychological field, score,
self-check flag, repair, retry, fallback, or judge.

## Gate 1

The runner is
`scripts/live/reflective-questions/run-post-reading-inviter-gate1.ts` and the
command is:

```bash
ONEIROS_POST_READING_INVITER_GATE1_COST_APPROVED=1 \
npm run benchmark:post-reading-inviter-gate1
```

It runs the same frozen adversarial eight, using two GPT-5.4 calls per valid
case, under a `$1.00` hard ceiling. Cost is reserved conservatively before each
call. It uses synthetic fixtures only and writes results under `tmp/`. No
production user dream is read or written.

Acceptance requires zero hard psychological failure families, fluent JA/ZH
approval, and at least `7/8` CLEAR PASS. A passing `no_question` counts as a
valid journey. Failure stops the line; the sixteen-case continuation is not
automatic.

Gate 1 ran for `$0.1824175` and failed at internal `1 CLEAR PASS / 1 BORDERLINE /
6 FAIL`. Repeated missing-footage and already-closed-material families stop the
line; the sixteen-case continuation was not run. Full findings:
[`ONEIROS_POST_READING_INVITER_GATE1_REVIEW_2026-08-28.md`](./ONEIROS_POST_READING_INVITER_GATE1_REVIEW_2026-08-28.md).

## Product and runtime boundary

This candidate is not imported by client, gateway, or proxy runtime. It changes
no streaming/typewriter behavior, UI, metadata extraction, Echoes, archetypes,
amplifications, persistence, database schema, or production deployment. The
existing production hold remains fail-closed.
