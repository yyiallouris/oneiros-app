# Oneiros Interpretive Echoes — v3.8.0 single-call replacement

## Scope

Keep the existing single `dream_metadata_extract` call.

Keep unchanged:
- Dream Fabric extraction
- display distillation
- schema version 4
- persistence
- Dream Detail UI
- 0–2 Archetypal Echoes
- 0–1 Mythic Echo

Replace the current `INTERPRETIVE ECHOES` section with the block below.
Replace the debug suffix with the supplied debug suffix.
Bump `prompt_version` to `3.8.0`.

---

## Production system-prompt block

```text
INTERPRETIVE ECHOES

Purpose:
Return only the archetypal or mythic echoes that genuinely sharpen this
specific dream. These are provisional resonances, not fixed meanings and not a
second interpretation.

Use the raw dream as the sole evidence source for selection.
The supplied reflection may help wording only after selection. It must not add,
name, strengthen, or rank a candidate.

FIRST: FORM A DREAM MAP SILENTLY

Reduce the dream to:

- 4–7 ordered beats, each describing one local event or one continuous action
- the pivot beat: the single beat that most changes the relation, agency,
  danger, identity, permission, or possible outcome
- the dominant relation: the main relation or pressure carried across the dream
- the ending: what is restored, lost, transformed, repeated, or left open

Keep the beats in the dream's order.
Do not merge events from separate scenes into one beat.
Do not confuse the opening of a problem with the later action that reverses it.
Do not confuse the final repair with the pivot unless the repair itself directly
changes the controlling relation.

ARCHETYPAL ECHOES (0–2)

An Archetypal Echo is earned by FUNCTION, not by appearance.

Use only selectable canonical labels from the supplied Oneiros archetype
catalog. Do not invent labels. Never return Ego.

ONEIROS ARCHETYPE CATALOG:
<INJECT COMPACT SELECTABLE CATALOG HERE>

CANDIDATES

Silently consider up to three carrier–label pairs.

Look first at:
- the figure, relationship, or configuration carrying the dominant relation
- the action or transformation occurring in the pivot beat
- any autonomous figure or pattern that changes several beats of the dream

A carrier may be a figure, dream-ego action, relationship, configuration, or
transformation.

APPEARANCE-STRIPPING TEST

Temporarily ignore the carrier's age, gender, occupation, costume, beauty,
darkness, size, sacred atmosphere, and conventional symbolism.

If the archetypal function is no longer clearly enacted by what the carrier
does in the dream, reject the label.

QUALIFICATION

Select a candidate only when:

- FUNCTIONAL FIT:
  the catalog function is directly enacted

- STRUCTURAL IMPORTANCE:
  the carrier organizes the dominant relation, the pivot beat, or several
  stages of the dream

- CONVERGING EVIDENCE:
  at least two concrete dream details support the same function

- ADDED PRECISION:
  the label says something more exact than the literal description of a known
  person, emotion, action, social role, or relationship

Compare plausible candidates directly.
Prefer the label that explains what the carrier does most specifically and with
the fewest assumptions.

Return a second echo only when it has a different carrier or clearly different
function, is nearly as important as the first, and adds non-redundant precision.

Zero or one echo is normal.
Return [] when ordinary relational language is more accurate than an
archetypal name.

Anima and Animus are independent of the dreamer's gender, sex, and orientation.
Use them only when an autonomous figure mediates between the dream-ego and
unknown imaginal or relational life, and Lover, Guide / Psychopomp, Shadow, a
Wise figure, or the literal known relationship is less precise.

OUTPUT — ARCHETYPES

Return 0–2 objects:
{
  "canonical_label": "exact selectable catalog label",
  "expression": "concrete carrier in the dream's primary language",
  "resonance": "one sentence",
  "evidence": ["...", "..."],
  "confidence": "high" | "medium"
}

expression:
- name the concrete figure, action, relationship, configuration, or
  transformation
- must not equal the canonical label

resonance:
- one sentence
- ideal 18–32 words; hard maximum 40
- begin with the carrier or its action
- describe its primary function and what it changes in the dream
- remain image-near and provisional
- do not retell the whole dream
- avoid: represents, symbolizes, embodies, functions as, the psyche, wholeness,
  integrity, inner power, transformation

evidence:
- 1–2 short, faithful details from distinct dream moments
- never reverse, merge, or invent an action

confidence:
- high: central, specific, and strongly enacted
- medium: meaningful and structurally supported but partial
- never return low-confidence candidates

MYTHIC ECHO (0–1)

A Mythic Echo is one specific recognized narrative whose STORY MECHANISM and
ordered structure closely resemble the dream. It is not selected from a famous
object, character, atmosphere, or broad theme.

STORY-MECHANISM CHECK

A story mechanism is a causally linked pattern such as:
- prohibition followed by violation and consequence
- bargain followed by price or reversal
- deception that changes the balance of power
- descent or passage through ordered stages
- impossible task followed by aid, test, or recognition
- sacrifice followed by loss, restoration, or changed return
- death or dissolution followed by emergence in a new form

These are mechanism types, not titles.

If the dream contains no distinctive story mechanism and is mainly ordinary,
personal, fragmentary, or thematic, return [].

If a distinctive story mechanism is present, silently recall up to three
specific recognized narratives before deciding [].

CANDIDATE RECALL

Search memory in this order:

1. the story mechanism and pivot beat
2. the ordered dream beats
3. functional relational roles
4. the ending
5. linked images
6. individual objects, creatures, occupations, or broad themes

For each candidate, recall its own established plot independently of the dream:

- title and source tradition or source corpus
- 3–7 defining beats in order
- functional roles
- defining rule, bargain, prohibition, test, deception, recognition,
  sacrifice, or reversal
- characteristic outcome

Do not borrow dream events to complete a candidate's story.
Reject the candidate if its title, tradition, or defining plot is uncertain.

Merge title variants of the same specific narrative.
Prefer the most specific reliable level:
specific tale or episode > recognized cycle.
A generic story family, motif, or bare mythic figure is not eligible.

STRUCTURAL MATCH

A candidate qualifies only when:

- at least three of its defining beats match concrete dream beats
- the broad order is preserved
- the functional roles correspond
- its defining story mechanism is recognizable in the dream
- the match spans more than one stage of the dream
- the divergence modifies a real match rather than excusing a missing one

SURFACE-STRIPPING TEST

Temporarily ignore shared objects, creatures, occupations, names, cultural
fame, setting, and broad theme.

If the candidate is no longer recognizable from mechanism + roles + ordered
beats, reject it.

FINAL COMPARISON

When candidates compete, choose in this order:

1. closest defining story mechanism
2. closest ordered sequence
3. closest functional roles
4. closest pivot
5. closest ending
6. linked images
7. objects or broad themes

The first four criteria dominate the last three.

A broad frame such as wasteland, descent, marriage, restoration, rebirth,
victory, or loss must not outrank a more specific tale that matches the central
mechanism and sequence.

Return [] when:
- no specific narrative qualifies
- two candidates remain genuinely inseparable
- title or tradition is uncertain

A false Mythic Echo is worse than no echo.
However, once a specific narrative clearly matches the mechanism, roles, and
at least three ordered beats, do not suppress it merely because the dream
changes the ending.

OUTPUT — MYTHIC ECHO

Return 0–1 object:
{
  "title": "recognized narrative, tale, cycle, or episode title",
  "tradition": "one accurate source tradition or source corpus",
  "resonance": "one sentence",
  "divergence": "one sentence",
  "evidence": ["...", "...", "..."],
  "confidence": "high" | "medium"
}

title:
- use a recognized localized title only when certain
- otherwise use the canonical or widely recognized scholarly title
- never invent a translation or poetic title
- never output a bare figure, motif, or vague story family

tradition:
- use one accurate source tradition or source corpus
- prefer a known corpus when appropriate over a vague geographical label

resonance:
- one concise sentence naming the shared mechanism, roles, and sequence
- do not reduce the match to a broad theme

divergence:
- one concise sentence showing how this dream changes, redirects, softens,
  intensifies, or leaves unfinished the narrative

resonance + divergence:
- target 35–55 words total
- hard maximum 65

evidence:
- 2–3 faithful details drawn from different stages of the dream

confidence:
- high: unusually distinctive mechanism + multi-stage ordered match
- medium: clear structural match with meaningful differences
- never use high confidence from objects, figures, or atmosphere alone

Never say that the dream reenacts, proves, or means the narrative.
Never assign a fixed meaning to the dream.
```

---

## Compact catalog formatter

Do not inject `kind`, `UI`, or `competes with` into the model prompt.
The UI may continue using those fields elsewhere.

Format each selectable entry as:

```text
- <canonical label>
  function: <coreFunction>
  qualifies when: <selectWhen joined compactly>
  not enough: <insufficientWhen joined compactly>
```

Exclude `Ego`.

This keeps the operational knowledge while removing metadata and competitor
lists that consume attention without being necessary for selection.

---

## Debug suffix

```text
DEBUG INTERPRETIVE ECHOES (internal only — not user-facing):

Finalize the normal production `archetypes` and `amplifications` first.
Then add one top-level key without changing those production selections:

"interpretive_diagnostics": {
  "dream_map": {
    "beats": ["B1: ...", "B2: ...", "B3: ..."],
    "pivot_beat": "B# or none",
    "dominant_relation": "...",
    "ending": "..."
  },
  "archetype_audit": [{
    "label": "...",
    "carrier": "...",
    "carrier_kind": "figure" | "dream_ego_action" | "relationship" |
                    "configuration" | "transformation",
    "function_match": "yes" | "no",
    "structural_importance": "yes" | "no",
    "evidence": ["...", "..."],
    "adds_precision": "yes" | "no",
    "selected": true | false,
    "reason": "..."
  }],
  "mythic_audit": [{
    "title": "...",
    "tradition": "...",
    "story_mechanism": "...",
    "canonical_beats": ["...", "...", "..."],
    "matched_beats": [{
      "canonical_beat": "...",
      "dream_beat": "B#",
      "dream_evidence": "..."
    }],
    "surface_stripping_result": "pass" | "fail",
    "selected": true | false,
    "reason": "..."
  }]
}

Rules:
- Each dream beat must be one local event or one continuous action.
- Do not merge separate scenes into one beat.
- The pivot must be one of the listed beats.
- Audit only candidates actually considered.
- Do not use numerical self-scores.
- If no archetype candidate was considered, return `archetype_audit: []`.
- If no distinctive story mechanism was present, return `mythic_audit: []`.
- If a distinctive story mechanism was present, show the specific candidates
  considered even when production `amplifications` is [].
- Prefer exact dream text; prefix faithful paraphrases with `summary:`.
```

---

## Compact user-prompt line

Replace repeated Archetype/Mythic user instructions with:

```text
Interpretive Echoes: select from the raw dream only. Build the ordered dream
map first, then apply the function-based archetype test and the
story-mechanism myth test from the system prompt. Return 0–2 catalog archetypes
and 0–1 specific recognized narrative, or [] when not earned. Use the
reflection only to refine wording after selection. Do not write a new
interpretation.
```

---

## Test protocol

- Deploy exactly this version.
- Do not add benchmark-specific examples.
- Run every test dream three times with fresh extraction.
- Test production output first; debug mode is for diagnosis and may slightly
  affect generation.
- Do not edit the prompt between runs.
- Judge the batch, not one isolated run.
