# Oneiros v1.0.4 imaginal-handoff Q2 candidate — 2026-08-29

**Final status: HUMAN QUALITY HOLD after the one authorized frozen evaluation.**
This is an immutable offline R&D artifact, not a production prompt and not a
deployment approval.

## Frozen identity

| Field | Value |
|---|---|
| Question method | `oneiros-same-call-reflective-questions-v1.0.4-candidate` |
| Prompt bundle SHA-256 | `a4f972c00bbde525ad3f39db160afd18e3a1c18f8a92090e0eb7078b137e277d` |
| Reader artifact | `oneiros-dream-reflection-v3.2.4-candidate` |
| Production predecessor | `oneiros-same-call-reflective-questions-v1.0.3-candidate` / `f5399a49…` |
| Candidate source | `src/ai/rd/reflective-questions/v104ImaginalHandoffCandidate.ts` |
| Fixture | `testing/reflective-questions/v1.0.4-imaginal-handoff-evaluation-2026-08-29.json` |
| Fixture SHA-256 | `ec7becc8f382399c1bab1d50edbce4c3568b468e17ab5edd124131987147a211` |

The prompt bundle and fixture were hashed before the first model call. Neither
was edited during the run. The offline builder uses the production Reader
request builder and replaces exactly one Q2 composition block in the
Standard/Advanced format message.

## Exact semantic diff

Removed:

```text
- Question 2 — symbolic / relational / imaginal: open the dream symbolically, relationally, or imaginally. It may follow an image, relation, transformation, contradiction, recurring gesture, unresolved movement, symbolic tension, or surprising juxtaposition. Deepen or reopen the central movement already developed in the reading; do not start a new analytic thread. The second question may be more psychologically or symbolically suggestive than the first. Do not make it safe by reducing it to generic phenomenology.
```

Inserted exactly:

```text
- Question 2 — imaginal handoff:
  Return to one unresolved imaginal configuration already explicit in the dream and made salient by the reading.
  Hold it in the event, relation, or juxtaposition the dream itself stages, and ask one open question that carries its tension forward while leaving the next symbolic connection for the dreamer to make.
```

There were no new safeguards, lexical bans, examples, or negative-rule stack.
Q1, Reader prose, Quick, chat, Essays, Recent Dream Field, models,
temperatures, cardinality, extraction, the structure normalizer, deterministic
observer, and streaming/partial reveal remained unchanged.

## Frozen evaluation scope

The single 21-call packet contained:

- 3 known supplied-menu/supplied-frame Q2 failures;
- 6 genuinely strong Q2 controls;
- 12 sealed unseen holdouts, one in every current production language: English,
  Greek, Spanish, French, German, Portuguese, Italian, Dutch, Russian,
  Japanese, Chinese, and Polish.

The holdout covered sparse, relational, near-overlap, multi-scene, ambiguous
juxtaposition, body/transformation, grief/ancestor, and conflict/threshold
dreams. The planned maximum reserve was `$0.945`; the hard cap was `$1.00`.
No semantic judge, quality retry, repair, question-only model, prompt edit, or
deployment was permitted.

Final human review and the complete result are recorded in
[`ONEIROS_V104_IMAGINAL_HANDOFF_EVALUATION_REVIEW_2026-08-29.md`](./ONEIROS_V104_IMAGINAL_HANDOFF_EVALUATION_REVIEW_2026-08-29.md).
