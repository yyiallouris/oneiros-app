# Reflective Question Composer v1 — production-oriented reset

**Date:** 2026-08-28  
**Status:** Composer v1.1.0 brutal-simple is local and pending human Gate. `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` remains null. Same-call v1.0.0 won its A/B; v1.0.1 is the two-line question correction and is not production.  
**Product invariant:** every initial Oneiros reading always has exactly one reflective question.

Structured Composer v1.0.1 SHA `56150c82…` ran its first valid GPT-5.4 Core packet and scored `0 GOLD / 2 SHIP / 4 WEAK / 2 FAIL`. Forced binaries, supplied-affect reasking, and interviewer phrasing remained. Quick/Advanced Reader calls did not run. This file now records the agreed fallback: one post-Jungian compass line, explicit output language, `{ "question" }` only.

Inviter Gate `09045bf1…` closed the previous line at `0 CLEAR PASS / 1 BORDERLINE / 7 FAIL`. There is no v2.0.2 and no further semantic patch.

---

## 1. Cleanup / change summary

Kept as historical evidence: benchmark fixtures, frozen anchor corpus `2a1a8bc3…`, reviewer packets, diagnostics, denied SHA history, blind-review tooling, cost/latency tooling, deploy guards, and historical docs.

Closed historical R&D, not importable from production question routing:

- Director / Composer
- v5 initial single-pass
- combined editorial arc (`6cd304e1…`)
- question-first combined call
- post-reading Inviter v1 (`70c533e5…`)
- Post-Jungian Inviter v2 / v2.0.1 (`09045bf1…`; pre-gate `14b742db…` superseded)

Failed SHAs remain denied. Deny-list tests remain. Experimental Inviter/editorial cost-approval env names are archived R&D-only. Production kill switch `ONEIROS_REFLECTIVE_QUESTION_COMPOSER_KILL_SWITCH` switches to the localized fallback question and never removes the question.

Live Reader request no longer injects the editorial-arc protocol. Historical `BEGIN_DREAM_READING` envelopes remain salvageable so old streams still type correctly. Constitution, Core headings, modes, length, temperature, and token limits are unchanged.

---

## 2. Exact new system prompt

Canonical source: `src/ai/reflectiveQuestionComposer.ts` → `REFLECTIVE_QUESTION_COMPOSER_PROMPT`.

```text
You write the reflective question that follows a Oneiros dream reading.

Read the raw dream and the completed reading.

Write exactly one natural, beautiful, post-Jungian reflective question that feels specific to this dream and makes the dreamer want to explore it further.

Treat the dream as a living symbolic experience, not as a puzzle to decode or a symptom to explain. Let the question deepen the dreamer's relationship with the dream rather than translate it into a fixed meaning.

Stay close to the dream's actual images, actions, relationships, atmosphere, or movement.

Do not invent anything that did not happen. Do not simply ask the dreamer to repeat something they already said or confirm the reading. Avoid generic therapy questions.

CORE: clear, alive and immediately understandable, but never shallow.

DEEPER: allow greater relational or psychological depth when the dream genuinely supports it, while remaining one natural question.

Write exactly one question, only in the requested output language. Do not explain your choice.
```

No examples. No taxonomy. No self-check. No extra prohibition list.

---

## 3. Exact input wrapper

```text
<RAW_DREAM_EVIDENCE>
[D1] ...
[D2] ...
</RAW_DREAM_EVIDENCE>

<FINAL_READING_READ_ONLY>
...
</FINAL_READING_READ_ONLY>

<QUESTION_DEPTH>
core | deeper
</QUESTION_DEPTH>

<OUTPUT_LANGUAGE>
el
</OUTPUT_LANGUAGE>
```

The Composer sees the whole raw dream and the completed reading.

---

## 4. Exact schema / artifact

Model output:

```json
{
  "question": "..."
}
```

`question` is always a non-empty string. No `kind`, evidence ids, or `output_language` field. The server stamps language from the requested wrapper.

Persisted write schema `10`:

```ts
{
  schemaVersion: 10,
  surface: "initial",
  status: "question",
  question: string,
  languageCode: string,
  evidenceIds: [],
  depth: "core" | "deeper",
  source: "model" | "fallback",
  methodId: "oneiros-reflective-question-composer-v1.1.0-candidate",
  promptId: "oneiros-reflective-question-composer-prompt-v1.1.0-candidate",
  createdAt: string
}
```

New writes never emit `no_question`. Schemas 1–9 remain readable, including historical `no_question` and schema-9 Composer artifacts with `kind`. No database migration: the artifact still lives in `interpretations.messages` JSONB.

Mechanical validation: non-empty question and schema integrity. No ASCII `?` rule. No evidence-id or language-field check.

---

## 5. Exact Core / Deeper semantics

Product reading enums are unchanged: `quick | standard | advanced`. The question layer has two levels only.

| Product mode | Composer depth | Meaning |
|---|---|---|
| `quick` | `core` | One clean, sharp, living opening. Simple does not mean shallow. |
| `standard` | `core` | Same Core question engine as Quick. There is no separate Standard question mode. |
| `advanced` | `deeper` | More psychic complexity only when the dream earns it. One question, one psychic movement. Not longer syntax. |

---

## 6. Localized fallback strings

Key: `dream_reflective_question_fallback`. Not machine-translated at runtime.

| Language | Fallback |
|---|---|
| en | Which image from the dream asks you to stay with it a little longer? |
| el | Ποια εικόνα του ονείρου σε καλεί να μείνεις λίγο ακόμη μαζί της; |
| es | ¿Qué imagen del sueño te pide quedarte un poco más con ella? |
| fr | Quelle image du rêve te demande de rester encore un peu avec elle ? |
| de | Welches Bild aus dem Traum bittet dich, noch ein wenig bei ihm zu bleiben? |
| it | Quale immagine del sogno ti chiede di restare ancora un poco con lei? |
| pt | Que imagem do sonho te pede para ficares um pouco mais com ela? |
| nl | Welk beeld uit de droom vraagt je nog even bij het te blijven? |
| pl | Który obraz ze snu prosi, byś został z nim jeszcze chwilę? |
| ru | Какой образ сна просит тебя остаться с ним ещё немного? |
| ja | 夢のどのイメージが、もう少しそばにいるようにと呼びかけていますか。 |
| zh | 梦里哪一幅画面，在请你再多陪它一会儿？ |

This is emergency production resilience, not the gold path. Fallback and model questions render identically in the card.

---

## 7. Model / temp / token config

| Field | Value |
|---|---|
| Method | `oneiros-reflective-question-composer-v1.1.0-candidate` |
| Prompt | `oneiros-reflective-question-composer-prompt-v1.1.0-candidate` |
| Model | GPT-5.4 |
| Temperature | `0.45` |
| Token ceiling | `360` |
| Task | `reflective_question_generate` |
| Retry / repair / judge | none |

---

## 8. New bundle SHA

```text
a42e79dfcf43bf171ac5f2a6fa73b61e2444b7c4582bba24fb80afa2d35ab7c8
```

Historical structured Composer v1.0.1 SHA, readable evidence only:

```text
56150c8226dcda66302e29f6eab82b261e1874466095f08acb6062a8823d8ba9
```

Historical three-depth Composer v1.0.0 SHA, R&D evidence only:

```text
44a44cc43635d1939a10d3c3f70462b9e3576513a05af177350712903d49cbd2
```

---

## 9. Reader untouched

Confirmed. Live `buildInitialReflectionRequest` is constitution + role + format + reading-only user directive. Temperatures remain `0.68 / 0.55 / 0.6`. Token limits remain `500 / 1450 / 2600`. Core headings, length guidance, streaming/typewriter, metadata, Echoes, archetypes, amplifications, and chat Dialogue `1.9.1` are unchanged. Historical editorial-arc strings remain only so denied SHA `6cd304e1…` stays reproducible.

---

## 10. Previous R&D unavailable to production

Confirmed. `src/services/ai.ts`, `entitledAiService.ts`, `ai-entitlements-gateway/index.ts`, and `billing-ai.ts` do not import `src/ai/rd/` or Inviter candidates. Deploy guard blocks those references. `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` remains `null`.

---

## 11. Local test counts

Ran after the reset, with **no paid calls**:

| Command | Result |
|---|---|
| Focused Composer + hold + card + editorial salvage + ai + production surface/deploy/edge/chatScroll | 9 files, 84 passed (after contract updates) |
| `npm run test:flows` | **58** suites, **298** passed |
| `npm test` | **132** suites passed, **2** skipped; **808** passed, **5** skipped |
| `npx tsc --noEmit` | clean |
| `npm run guard:ai-entitlements-gateway-deploy` | fail-closed as required (`44a44cc…`, approval null) |

Detox/E2E was not run. iPhone and Android share the same RN card/question contract; fallback and model questions render identically.

---

## 12. Estimated cost (do not run until approved)

Prior Inviter 8-call actual: `$0.043675` on the same frozen readings.

| Packet | Calls | Estimate | Hard cap |
|---|---|---|---|
| Phase A | 8 frozen Standard, Composer only | actual `$0.01382250` | `$0.30` |
| Mode comparison | 16 Composer-only calls on the same frozen eight at Core + Deeper. Standard is reused, not re-run. Prompt/code/SHA unchanged. | actual `$0.02032410` this run; cumulative `$0.03414660` | `$1.00` total including Phase A |

No retries. No judge. No repair. No automatic prompt mutation. Do not change the Composer from the Standard FAIL/WEAK pattern until the Core/Deeper comparison is scored.

Phase A human score (locked): `0 GOLD / 3 SHIP / 2 WEAK / 3 FAIL`. Not production-ready, clearly closer than Inviter `0/1/7`. Observed craft tendency: beautiful/dream-specific writing, then manufactured dilemma/contrast.

Phase A pass condition: `0 FAIL`, at least `7/8` GOLD or SHIP, no repeated generic-therapist or missing-footage phenotype. **Not met.** Do not bury the candidate; do not mutate yet.

---

## Gold rubric (for later live review)

GOLD / SHIP / WEAK / FAIL. Hard questions:

1. Would I actually want to answer this?
2. Does it pull me back into this specific dream?
3. Could this question work almost unchanged for ten other dreams?
4. Is it asking me to remember something the dream never gave me?
5. Is the AI putting its own interpretation into my mouth?
6. Is it beautiful because it is precise — or merely trying to sound poetic?
7. Does the depth fit Core / Standard / Deeper?

Sunrise is the COMPLETION gold test: a question must exist and must not manufacture tension.
