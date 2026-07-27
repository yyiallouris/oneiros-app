# Oneiros v3.7.0 — Single-call Archetypal & Mythic Echo Prompt

## Implementation instruction

Keep the existing single `dream_metadata_extract` call.

Do **not** create a second AI task. Keep Dream Fabric, display distillation,
schema, persistence, and Dream Detail UI unchanged.

In `buildDreamExtractionSystemPrompt()`:

1. Remove the current `ARCHETYPAL ECHOES` section from its heading through its
   output rules.
2. Remove the current `MYTHIC ECHO` section from its heading through its
   output rules.
3. Replace both with the block below.
4. Keep the operational archetype catalog injection at
   `<ONEIROS_ARCHETYPE_CATALOG>`.
5. Do not inject `Ego` as a selectable user-facing catalog entry. Ego-position
   remains part of the structural reading, but `canonical_label: "Ego"` must
   never be returned.
6. Remove numerical candidate scoring and the current winner-consistency logic.
7. Replace the debug suffix with the compact audit suffix included below.
8. Bump `prompt_version` to `3.7.0`.

---

## Drop-in replacement

```text
INTERPRETIVE ECHOES

Interpretive Echoes are optional, provisional amplifications. They must deepen
the specific dream without replacing it with taxonomy or cultural explanation.

Use the raw dream as the sole evidence source for selection.
The supplied reflection may help wording only after selection. It must not
introduce, strengthen, rank, or name a candidate.

Before selecting either an Archetypal or Mythic Echo, silently form the dream's
STRUCTURAL SPINE:

- opening field: the initial situation, atmosphere, and dream-ego position
- central movement: the main relationship, pressure, pursuit, task, or change
  carried across the dream
- causal reversal: the event after which the previous relation of power,
  danger, identity, alliance, permission, or possibility cannot continue in
  the same way
- final movement: restoration, loss, return, transformation, repetition,
  suspension, or unresolved ending
- dream-ego shift: how the dream-I's agency, belonging, distance, consent, or
  orientation changes

Do not confuse:
- the most vivid image with the central movement
- the first action with the causal reversal
- the final repair with the causal reversal
- a figure's age, gender, occupation, appearance, or atmosphere with its
  structural role
- a shared object with a shared narrative

ARCHETYPAL ECHOES (0–2)

Purpose:
Offer an archetypal name only when it describes a structural function more
precisely than ordinary relational or psychological language.

Use only canonical labels from the supplied Oneiros archetype catalog.
Do not invent labels. Do not return Ego.

<ONEIROS_ARCHETYPE_CATALOG>

CARRIER COVERAGE

Silently identify the strongest possible carriers across:
- figures
- dream-ego actions or modes of action
- relationships
- repeated configurations
- transformations

Give explicit consideration to:
- the carrier of the central movement
- the carrier of the causal reversal
- any figure or configuration that changes the whole dream-field

Do not privilege personified, old, mysterious, powerful, dark, beautiful,
sacred-looking, maternal, masculine, feminine, or numinous figures.
A carrier may be an action or relationship rather than a character.

Generate at most three plausible catalog candidates internally.
Do not create a candidate from every carrier class.

ARCHETYPAL QUALITY GATE

A candidate qualifies only when ALL are true:

1. FUNCTION
   The catalog's primary function is clearly enacted in this dream.

2. STRUCTURAL WEIGHT
   The carrier is central to the dream's continuing movement, causally decisive,
   or meaningfully reorganizes the dream-field or dream-ego position.

3. CONVERGING SUPPORT
   At least two distinct dream moments, actions, positions, or relationships
   support the same archetypal function.

4. ADDED PRECISION
   The canonical label reveals something more exact than a plain description
   such as anger, attraction, authority, care, conflict, advice, action,
   confusion, change, or a known personal relationship.

5. COMPARATIVE FIT
   No competing catalog label explains the carrier's primary function more
   specifically and with fewer unsupported assumptions.

If any condition fails, reject the candidate.

FINAL ARCHETYPAL COMPARISON

Compare the strongest candidates pairwise. Ask:

- Which one best describes what the carrier DOES?
- Which one is most central to the structural spine?
- Which one is supported across more than one moment?
- Which one requires fewer conventional-symbol assumptions?
- Which one would be most misleading if shown to the user?

Prefer one strong echo over two overlapping or decorative echoes.

Return a second echo only when:
- it has a different carrier or clearly different function
- it is nearly as structurally important as the first
- it adds non-redundant precision

Zero or one echo is normal.
A realistic or personal dream may correctly return [] even when emotionally
intense.

Do not infer:
- Shadow from anger, danger, darkness, aggression, instinct, animals, strangers,
  or frightening atmosphere alone
- Persona from politeness, public behaviour, clothing, work, or social
  embarrassment alone
- Anima or Animus from sex, gender, attraction, romance, mystery, beauty, or the
  presence of a man or woman alone
- Self from a centre, circle, heart, mandala, sacred image, positive feeling, or
  coherence alone
- Hero because the dreamer acts, confronts danger, rescues, or succeeds
- Trickster because something is strange, comic, dishonest, chaotic, or
  confusing
- Guide / Psychopomp from advice, transport, companionship, guarding, or an
  older speaker alone
- Wise Old Man or Wise Old Woman from age, warning, knowledge, or advice alone
- Divine Child from the presence, memory, or vulnerability of a child alone
- Double from resemblance, mirroring, shared features, or familiarity alone
- Death–Rebirth from death, descent, change, departure, return, or a new
  beginning alone
- Sacred Marriage from romance, a couple, wedding imagery, or union alone

Anima and Animus are independent of the dreamer's gender, sex, and orientation.
Use them only for an autonomous mediating function between the dream-ego and
unknown imaginal or relational life, and only when Lover, Guide, Shadow, a Wise
figure, or the literal known relationship is less precise.

OUTPUT — ARCHETYPES

Return 0–2 objects only:
{
  "canonical_label": "exact selectable catalog label",
  "expression": "the concrete carrier in the dream's primary language",
  "resonance": "one sentence",
  "evidence": ["...", "..."],
  "confidence": "high" | "medium"
}

expression:
- may name a figure, dream-ego action, relationship, configuration, or
  transformation
- must not equal the canonical label

resonance:
- one sentence
- ideal 18–32 words; hard maximum 40
- begin from the concrete carrier or its action
- state its primary function and effect on the dream's movement
- remain image-near and provisional
- do not summarize the whole plot
- avoid: represents, symbolizes, embodies, functions as, acts as a carrier of,
  the psyche, wholeness, integrity, transformation, inner power

evidence:
- 1–2 short, concrete phrases from distinct dream moments
- quote exactly when practical; otherwise use a faithful concise summary
- never reverse or invent an action

confidence:
- high: central, specific, and strongly enacted across the dream
- medium: meaningful and structurally supported, but partial
- never return low-confidence candidates

MYTHIC ECHO (0–1)

Purpose:
Offer one specific recognized narrative only when its defining structure
closely amplifies the dream. A Mythic Echo is not a decoding key and must
preserve the dream's difference.

Do not begin from a famous object, figure, theme, or title.

DREAM SIGNATURE

Before recalling narratives, silently derive:

- 4–7 ordered dream beats
- functional relational roles
- the defining rule, prohibition, bargain, test, deception, sacrifice,
  recognition, or reversal
- the causal reversal
- the final movement

CANDIDATE GENERATION

Generate at most three specific recognized narratives, cycles, tales, episodes,
religious narratives, fairy tales, epics, or alchemical sequences.

Do not generate candidates merely to fill a quota.
If the dream's configuration is mainly ordinary, personal, fragmentary, or
supported only by broad themes, return [].

Merge title variants of the same specific narrative before comparison.
Preserve the most specific reliably known level:
specific tale or episode > recognized cycle > generic story family > motif.

A generic story family or motif is not eligible for output.

CANDIDATE-INDEPENDENT RECALL

For each candidate, before matching it to the dream, silently recall the
candidate's own canonical narrative signature:

- 3–7 defining beats in their established order
- functional roles
- defining rule, prohibition, bargain, test, deception, recognition, or reversal
- characteristic outcome

Recall this independently of the dream.
Do not import dream events into the candidate's story.
If the title, tradition, or defining signature is uncertain, reject the
candidate.

STRUCTURAL MATCH GATE

A candidate qualifies only when ALL are true:

1. At least three defining candidate beats correspond to concrete dream events
   across at least two different stages of the dream.

2. The broad order of the matched beats is preserved.

3. Functional roles correspond. Literal occupation, name, gender, costume, or
   surface identity is irrelevant unless structurally essential to the story.

4. The candidate's defining rule, prohibition, bargain, test, deception,
   recognition, sacrifice, or reversal remains recognizable in the dream.

5. The candidate's fit is not carried mainly by one object, creature, setting,
   atmosphere, broad theme, shared ending, or famous association.

6. The divergence changes, redirects, softens, intensifies, or leaves unfinished
   a genuine match; it does not excuse a missing defining structure.

7. No other considered candidate offers a clearly closer defining sequence and
   role configuration.

If any condition fails, reject the candidate.

FINAL MYTHIC COMPARISON

Compare qualifying candidates pairwise in this order:

1. defining action, rule, prohibition, bargain, or reversal
2. distinctive ordered sequence
3. functional relational roles
4. causal turning point
5. linked images across different stages
6. final outcome
7. broad theme or object similarity

The first four criteria dominate the last three.

A candidate with famous matching props must lose to a candidate with a closer
defining plot and role structure.

A shared late restoration, loss, marriage, descent, return, wasteland, rebirth,
or victory may enrich the divergence but must not outweigh a more exact
multi-stage sequence.

Do not borrow an event from one narrative to justify another.
Do not choose a story because its title, protagonist's occupation, or cultural
fame resembles a dream detail.

Return [] when:
- no candidate passes every structural gate
- two candidates remain inseparable
- title or tradition is uncertain
- the result would sound impressive but culturally unreliable

Silence is better than a false Mythic Echo.
Do not suppress an unusually direct specific match that clearly passes every
gate.

OUTPUT — MYTHIC ECHO

Return 0–1 object:
{
  "title": "recognized narrative, cycle, tale, or episode title",
  "tradition": "accurate standardized source tradition or source corpus",
  "resonance": "one sentence",
  "divergence": "one sentence",
  "evidence": ["...", "...", "..."],
  "confidence": "high" | "medium"
}

title:
- use an established localized title only when certain
- otherwise use the canonical scholarly or widely recognized title
- never create an ad-hoc translation
- never use a bare figure, generic motif, or invented poetic title

tradition:
- identify the recognized source tradition or source corpus precisely
- prefer a known corpus such as One Thousand and One Nights or Grimm fairy tale
  over a vague ethnic label when appropriate
- use one tradition only

resonance:
- one concise sentence naming the shared defining configuration
- describe sequence and roles, not a generic theme

divergence:
- one concise sentence naming the dream's meaningful transformation or
  difference

resonance + divergence:
- target 35–55 words total
- hard maximum 65 words

evidence:
- 2–3 concrete dream details from different stages
- exact text when practical; otherwise faithful concise summaries

confidence:
- high: unusually distinctive multi-stage sequence, roles, and defining reversal
- medium: clear structural correspondence with meaningful differences
- never use high confidence from object or figure similarity alone

Never state that the dream reenacts, proves, or means the narrative.
Never assign a fixed meaning to the dream.
```

---

## Replacement debug suffix

Use only in development. It remains part of the same extraction call, but it
must audit the decision rather than force candidate quotas or numerical scores.

```text
DEBUG INTERPRETIVE ECHOES (internal only — not user-facing):

After finalizing the normal production archetypes and amplifications, include
one additional top-level key:

"interpretive_diagnostics": {
  "structural_spine": {
    "central_movement": "...",
    "causal_reversal": "...",
    "final_movement": "...",
    "dream_ego_shift": "..."
  },
  "archetype_audit": [{
    "label": "...",
    "carrier": "...",
    "carrier_kind": "figure" | "dream_ego_action" | "relationship" |
                    "configuration" | "transformation",
    "gate_results": {
      "function": "pass" | "fail",
      "structural_weight": "pass" | "fail",
      "converging_support": "pass" | "fail",
      "added_precision": "pass" | "fail",
      "comparative_fit": "pass" | "fail"
    },
    "selected": true | false,
    "reason": "..."
  }],
  "mythic_audit": [{
    "title": "...",
    "tradition": "...",
    "candidate_signature": ["canonical beat 1", "canonical beat 2", "..."],
    "matched_beats": [{
      "candidate_beat": "...",
      "dream_evidence": "..."
    }],
    "defining_structure_match": "pass" | "fail",
    "ordered_sequence_match": "pass" | "fail",
    "role_match": "pass" | "fail",
    "selected": true | false,
    "reason": "..."
  }]
}

Audit only candidates genuinely considered during the normal decision.
Do not add candidates to fill the diagnostics.
Do not use numerical self-scores.
Do not change production fields because debug diagnostics were requested.
Prefer exact dream spans; prefix summaries with "summary:".
```

---

## Replacement user-prompt lines

Replace the current repeated Archetype/Mythic instructions in
`buildDreamExtractionUserPrompt()` with:

```text
Interpretive Echoes: use the raw dream only for selection and the reflection
only for wording after selection. Apply the structural-spine, archetypal
quality, and mythic narrative-signature gates from the system prompt.
Return 0–2 catalog Archetypal Echo objects and 0–1 specific named Mythic Echo,
or [] when an echo is not earned. Do not write a new interpretation.
```

---

## Catalog adjustment

`Ego` may remain available to the wider Oneiros interpretation system, but it
should not be interpolated as a selectable Echo entry.

Preferred implementation:

```ts
type ArchetypeCatalogEntry = {
  canonicalLabel: string;
  displayLabel: string;
  selectableAsEcho: boolean;
  // existing fields...
};
```

Set:

```ts
Ego.selectableAsEcho = false;
```

Then `formatArchetypeCatalogForPromptV1()` should interpolate only
`selectableAsEcho !== false`.

Do not add case-specific catalog rules from individual benchmark dreams.

---

## Why this replaces v3.6.7

The prior prompt combined:
- forced carrier coverage
- one ambiguous `decisive_turning_point`
- free numerical self-scoring
- winner-consistency patches
- candidate quotas in debug
- repeated precision/recall warnings

This produced detailed-looking diagnostics without reliable discrimination.

This version uses:
- one structural spine
- separate causal reversal and final movement
- all-or-nothing quality gates
- pairwise comparative elimination
- candidate-independent myth recall
- canonical-beat matching
- no numerical self-scoring
- no forced debug candidates

It remains a single AI call and keeps the existing extraction schema and UI.
