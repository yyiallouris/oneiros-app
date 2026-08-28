# Oneiros Post-Reading Inviter v1 — Gate 1 review

**Date:** 2026-08-28  
**Decision:** `FAIL — STOP`  
**Production:** denied; approval remains `null`  
**Bundle SHA-256:** `70c533e59b56693d5ade15a5234d2a7457ef194ba157750f67e884e13bb42cfa`

## What was tested

The experiment separated the first reflection into two GPT-5.4 jobs:

```text
raw dream → frozen Reader → final reading → Inviter(raw D# + reading)
```

The Reader used the pre-editorial Oneiros prompt baseline from
`d5f68e6e4b1b3c2db7ae81385031ea8331e2f9db:src/services/ai.ts`. It owned no
question and replaced the Standard target range with no minimum and a hard
`520`-word ceiling. The Inviter returned only `question | no_question`, question
text, D# evidence ids, and output language. There was no Director, Composer,
intermediate psychological payload, retry, repair, fallback, or judge.

The same frozen adversarial eight ran under the authorized `$1.00` ceiling.
All fixtures were synthetic.

## Mechanical and cost result

| Signal | Result |
|---|---:|
| Reader calls | 8 |
| Inviter calls | 7 |
| Provider/model | OpenAI `gpt-5.4` |
| Estimated cost | `$0.1824175` |
| Mechanically committed questions | 6 |
| Valid `no_question` | 1 |
| Reader rejections | 1 |
| Inviter/schema rejections | 0 |
| Provider failures | 0 |
| Retries / repairs / judges | `0 / 0 / 0` |
| Internal CLEAR PASS | `1/8` |
| Internal BORDERLINE | `1/8` |
| Internal FAIL | `6/8` |

The blind verdicts and rationales were written before checkpoints or
diagnostics were opened. JA/ZH semantic judgments remain provisional pending
fluent review, but the packet already fails decisively on language-independent
hard families.

## Locked case findings

| Case | Output | Verdict | Finding |
|---|---|---|---|
| `elevator-missing-button` | question | BORDERLINE | Concrete and answerable, but collapses into “merely held or specially significant?” rather than the sharper movement/arrival contradiction. |
| `words-rest-on-table` | question | FAIL | Asks which specific unsaid word would be touched; the dream never supplies that content, so the answer requires missing footage. |
| `dinner-for-absent-host` | Reader rejected | FAIL | Reader produced `579` words against the `520` ceiling. It also inserted English `nevertheless` into Greek prose. |
| `zh-faguo-mingzi` | question | FAIL | Reading already frames paper as covering/seal and as held over water; the question asks the dreamer to choose between those closed terms. Fluent review still required. |
| `sunrise-on-quiet-ridge` | `no_question` | CLEAR PASS | Allows a peaceful, complete dream to end without fabricated unfinished business. |
| `skin-turns-to-bark` | question | FAIL | Reading explicitly says the soil taxi joins transport and planting; question immediately asks transport or planting. |
| `ja-neon-home` | question | FAIL | Asks where over the sea HOME floated, a spatial detail absent from the dream. Fluent review still required. |
| `shared-scarf-at-harbor` | question | FAIL | Asks what changed between the pair while the scarf loosened, after dream and reading already state the bond/freedom ambivalence; the additional development is unstaged. |

## Root diagnosis

### 1. Post-reading visibility is not a novelty guarantee

The Inviter received the complete final reading, but in `bark` and `zh` it used
that reading as a vocabulary source and then re-asked the relation the reading
had already formulated. The shortest-answer rule was present and ignored.
Topology removed the earlier race between question and reading; it did not make
semantic comparison reliable.

### 2. “Unanswered” drifted into “not described”

In `words`, `ja`, and `scarf`, the model escaped already-answered material by
requesting a detail or development the dream never staged. This is the central
double bind still unresolved:

```text
avoid closed meaning → search for unmentioned detail → require missing footage
```

### 3. Removing the word floor did not remove coverage pressure

The Reader remained long for small dreams (`329–395` space-delimited words in
the three short Greek anchors) and exceeded its hard ceiling on the rich dinner
dream (`579`). The retained paragraph structure, interpretive checklist, and
model habit still act as an implicit expansion pressure. A ceiling alone does
not make length dream-earned.

For Japanese and Chinese, whitespace word counts (`11` and `10`) are not valid
cross-language density measures. This is a benchmark-infrastructure limitation,
not a PASS signal; any future Reader length gate must be script-aware.

### 4. Minimal schemas improve observability, not judgment

The four-field schema was mechanically excellent: zero Inviter parse or schema
failures and no validator-as-copywriter dependency. That is worth preserving as
an engineering lesson. It did not improve the psychological decision itself.

### 5. `no_question` remains validated

`sunrise` is the strongest journey. The model recognized enoughness and ended.
The product should retain the right to no question; failure came from false
openings, not from mature endings.

## Decision

The gate requires at least `7/8` CLEAR PASS and zero hard failure families. The
candidate achieved `1/8` with repeated missing-footage and already-closed
families, plus one Reader ceiling/language failure. Bundle `70c533e5…` is denied.

Do not run the sixteen-case continuation. Do not patch and rerun automatically.
A next hypothesis requires a fresh explicit diagnosis and versioned plan. In
particular, do not respond by restoring self-audit fields, adding a third judge,
or stuffing more prohibitions into this prompt.

## Review package

Local synthetic artifacts:

`tmp/post-reading-inviter-gate1-2026-08-28T13-13-15-329Z/`

- `REVIEW_ORDER.md`
- `BLIND_REVIEW.md`
- `INTERNAL_BLIND_REVIEW.md`
- `GOLD_CHECKPOINTS_AFTER_SCORING.md`
- `EXACT_PROMPT_STACK.md`
- `DIAGNOSTICS.json`
- `SUMMARY.json`

No production deploy or database change was made.

