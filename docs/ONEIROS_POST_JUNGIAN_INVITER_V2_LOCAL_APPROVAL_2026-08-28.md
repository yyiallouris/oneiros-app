# Oneiros Post-Jungian Inviter v2 — local approval packet

**Status:** `LOCAL IMPLEMENTED — NOT RUN — NOT APPROVED`

This is the local-only artifact requested before any paid Gate 1 call. It
changes the Inviter's task ontology from information retrieval to imaginal
re-entry while freezing model, temperature, token limit, topology, minimal
response contract, and the eight reading inputs. It is not imported by client,
gateway, or proxy runtime. `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` remains
`null`.

## 1. Exact v2 system prompt

```text
You are the post-reading invitation editor for Oneiros, a post-Jungian dream journal.

You receive the complete raw dream as D# evidence and an exact frozen reading. The reading is read-only.

Your task is not to retrieve missing information and not to continue, verify, or extend the interpretation. Return zero or one invitation.

A worthy invitation reopens the dream as a living relation. It returns the dreamer to a concrete image, gesture, position, tension, transformation, paradox, or strange dream-logic already staged in the raw dream, while leaving the discovery to the dreamer now. The answer does not need to have existed during the dream; it may emerge in the present encounter with the image. Every factual premise, however, must already be staged in D# evidence.

Begin from the raw dream. Let its specific image, action, relation, gesture, contradiction, or movement carry the invitation. Use the reading only to prevent repetition and interpretive contamination. A relation is not closed merely because the reading noticed it. Reject a question when it would mainly ask the dreamer to repeat, confirm, endorse, choose between, or paraphrase something already supplied by the dream or reading. Never turn an interpretation from the reading into a fact about the dream.

Do not ask the dreamer to recover an unstated event, detail, motive, continuation, hidden fact, or alternate scene. Do not ask the dreamer merely to restate an explicitly supplied state, feeling, choice, non-event, or ambivalence. Do not ask for confirmation, ranking, selection between interpretations, or endorsement of the reading. A generic reaction or significance report is not made specific merely by inserting dream nouns.

Preserve agency, polarity, negation, direction, temporality, and ambiguity. Keep the invitation brief, singular, and natural in the requested language. Do not explain it.

If no image-near invitation can do this honestly, return no_question. Silence is a complete editorial act; never produce a fallback.

Return exactly the supplied schema. For question, cite one to three D# spans that directly stage every factual premise. For no_question, return question null and evidence_ids [].
```

Prompt audit: no gold examples and no default positive scaffolds `felt`,
`experience`, `what is it like`, `how does it feel`, or `what comes up` occur in
the runtime prompt. `living relation` is operationalized through the staged
image/relation/gesture first, not through an instruction to solicit feelings.

## 2. Exact user wrapper

```text
<RAW_DREAM_EVIDENCE>
{complete numbered D# spans from the exact raw dream}
</RAW_DREAM_EVIDENCE>

<FROZEN_READING_READ_ONLY>
{exact persisted frozen reading}
</FROZEN_READING_READ_ONLY>

<OUTPUT_LANGUAGE>{supported Oneiros language code}</OUTPUT_LANGUAGE>
```

The generated local package contains the **eight fully materialized messages**,
not only this template, in `02_EXACT_INPUTS.json`.

## 3. Structured Output schema

The schema is deliberately unchanged from Inviter v1, including its provider
schema name. This prevents a response-contract change from contaminating the
ontology experiment.

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "oneiros_post_reading_inviter_v1",
    "strict": true,
    "schema": {
      "type": "object",
      "additionalProperties": false,
      "required": ["decision", "question", "evidence_ids", "output_language"],
      "properties": {
        "decision": { "type": "string", "enum": ["question", "no_question"] },
        "question": { "type": ["string", "null"] },
        "evidence_ids": {
          "type": "array",
          "maxItems": 3,
          "items": { "type": "string", "pattern": "^D[1-9][0-9]*$" }
        },
        "output_language": {
          "type": "string",
          "enum": ["en", "el", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ja", "zh"]
        }
      }
    }
  }
}
```

## 4. Frozen anchor corpus manifest

Corpus: `oneiros-frozen-anchor-readings-v1` / `1.0.0`  
Tracked file SHA-256: `2a1a8bc3a5b4a0019155e2856771c3eea4450be44e57ad1eeea0907d52738628`  
Source artifact SHA-256: `4f0c6f048dcded41bc86e9fd42c59952d545b0a28623b91e19183a8eceb42504`

| Case | Dream SHA-256 | Reading SHA-256 |
|---|---|---|
| `elevator-missing-button` | `78b87d9d2c28c811df5068988dc1374ab154a31b055dc1c2be22e89ad49da3ec` | `18401d56339e13fe9902636efecb5d2cb39608a6640415df0e5d9bf171b37852` |
| `words-rest-on-table` | `8c2318c0729097406990d0f3f5ff0cba7d0a9c7b4197a179f07a12a96b9a58a3` | `34ef7b2ad996c3f298d5a998a98ffb347b433566df1099311aa41d6376e7b0b0` |
| `dinner-for-absent-host` | `3ac7644682b6ffc5d5a74600a6f00deca65e93301c1c22558acfa6d0829b2515` | `9c40eb25cfa7ec51e396ff41783ce6a217eec223b520d486ed0bbd90a588182c` |
| `zh-faguo-mingzi` | `6026d98578149be371d840459cbb673d2a0475d196dfe22d9fe9e4fe2f1b388a` | `c5a7a9c3ea0e0d9f717d8e336626cf56acf7e58a18e6609aba53c43eced28b97` |
| `sunrise-on-quiet-ridge` | `76683e68ef2087096dce9a9078b9d97de031d7b4c55f76b83141b0a8f6a57f73` | `f25ed3c18ca40329ce133782cb8d5f9fc23b20955c2e8693af6b120f10c000a9` |
| `skin-turns-to-bark` | `fe8a3829204e7b2a1e2c84555598f8c43bdcda09c21086c267cff5c7bda1f7ed` | `ec261571be12bbfa29dc8e0219658b9e532fac6fd147633e7af2e7f5ab9aee88` |
| `ja-neon-home` | `e812d93cf0f1d1e993ac91e29f874d7efcb6feb2c91b98faea546b007653ab87` | `97e06dd0f8fed1149540f75c4b8f76deeb25602ee814dce222e19962f2925ad0` |
| `shared-scarf-at-harbor` | `5aa638c41dcc2d401c60b8f97326c8b052b898b1ba1b349f78d58e473196ad64` | `2590d6c1d632abaa0436b83a1a048bf28bd9e12a0ffdcc4f36f251e34a089eb9` |

Provenance is intentionally narrow: the source records fresh GPT-5.4
`interpretation_standard` provider/model/route data per case, but not the
generating Reader prompt identity. The manifest records this as `null` and does
not claim stronger prompt provenance.

## 5. Candidate identity and local verification

| Field | Frozen value |
|---|---|
| Method | `oneiros-post-jungian-inviter-v2.0.1-candidate` |
| Prompt | `oneiros-post-jungian-inviter-prompt-v2.0.1-candidate` |
| Schema | `1`, same four-field contract as v1 |
| Model | `gpt-5.4` |
| Temperature | `0.35` |
| Token limit | `360` |
| Route | existing `interpretation_quick` |
| Topology | one Inviter call per frozen case; no Reader call |
| Bundle SHA-256 | `09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e` |
| Cost gate | locked; eight calls; `$0.30` hard ceiling |

Local checks completed before this packet:

- `npm run typecheck` — PASS.
- focused v1/v2 Inviter contracts — `20/20` PASS.
- final candidate + prior-denial + deploy-guard contracts — `4/4` suites,
  `36/36` tests PASS.
- `npm run test:all` — `131/131` suites PASS; `796/796` executed tests
  PASS (`2` suites / `5` tests intentionally skipped).
- `npm run test:flows` — `58/58` suites, `298/298` tests PASS.
- `git diff --check` — PASS.
- live-run conservative preflight — `$0.195715` maximum for eight calls, below
  the `$0.30` hard ceiling.
- deploy guard — expected fail-closed: production approval is absent and the
  currently wired editorial-arc SHA is denied.
- paid Gate — **NOT RUN**.

The review authority before a paid call is the exact generated package at
`tmp/post-jungian-inviter-v2-local-approval/`.

Superseded pre-gate identity `14b742dba95ffad7d26368aa330ae28ba2d4f0c7e5a65f2ac689157854c27215`
made zero paid calls. It was replaced because its reading-veto language could
wrongly close a raw-dream relation merely because the reading had noticed it.
