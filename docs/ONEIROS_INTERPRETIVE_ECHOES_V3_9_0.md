# Oneiros Interpretive Echoes v3.9.0 — single-call full replacement

## Implementation scope

Keep unchanged:
- the existing single `dream_metadata_extract` call
- model and billing path
- Dream Fabric and display distillation
- schema version 4
- persistence and Dream Detail UI
- 0–2 Archetypal Echoes
- 0–1 Mythic Echo

Replace the current Interpretive Echoes section and its debug suffix with the
blocks below. Do not append this to v3.8.2. Replace it.

---

## Production prompt

```text
INTERPRETIVE ECHOES

Purpose:
Return only archetypal or mythic echoes that make this particular dream more
precise. They are provisional resonances, not fixed meanings and not a second
interpretation.

Use the raw dream as the sole evidence source for selection.
The reflection may refine wording only after selection.

STEP 1 — ORDERED EVENT MAP

Silently map the dream into ordered beats.

- Use as many beats as needed to preserve every causally important event;
  usually 4–12, occasionally more for an event-dense dream.
- Each beat must contain one local event or one uninterrupted action sequence.
- Start a new beat whenever leverage, threat, goal, knowledge, permission,
  alliance, identity, location, or possible outcome changes.
- Never compress setup → response → reversal into setup → outcome.
- Never merge events from separate scenes merely because they involve the same
  figure, object, or theme.

STEP 2 — ROLE–VERB MECHANISM

Translate the causally central sequence into one abstract role–verb chain.

Use role labels and causal verbs only.
Remove names, occupations, genders, cultures, creatures, objects, settings,
materials, and decorative imagery.

Format internally as:

[role A] —verb→ [role B/state] —verb→ [new relation/state] ...

The mechanism must preserve:
- who acts on whom
- what changes the relation
- the order of the changes
- the resulting condition

Then identify the DECISIVE SPAN:
the shortest contiguous set of 1–3 beats after which the previous controlling
relation cannot continue in the same way.

The decisive span begins with the action that initiates the reversal and ends
when the new relation is established.

Do not choose:
- the event that merely creates or releases the danger
- later guidance, travel, discovery, or restoration
when an earlier action already changed threat, captivity, pursuit, permission,
identity, dependence, or bargaining power.

ARCHETYPAL ECHOES (0–2)

An Archetypal Echo is selected by enacted function, not appearance.

Use only selectable canonical labels from the supplied Oneiros archetype
catalog. Never invent labels. Never return Ego.

ONEIROS ARCHETYPE CATALOG:
<INJECT COMPACT SELECTABLE CATALOG HERE>

Silently consider up to three carrier–label candidates from:

1. the decisive span as a dream-ego action or mode of action
2. the figure or relationship carrying the dominant relation
3. an autonomous figure, configuration, or transformation that changes
   several beats

The decisive-span carrier must be considered whenever its enacted action has a
plausible catalog fit. Consideration does not require selection.

APPEARANCE-STRIPPING TEST

Ignore age, gender, occupation, costume, beauty, darkness, size, sacred
atmosphere, and conventional symbolism.

Judge only what the carrier does across the ordered beats.
If the catalog function is no longer clearly enacted, reject the label.

SELECT A CANDIDATE ONLY WHEN:

- its catalog function is directly enacted
- it is central to the decisive span, dominant relation, or several beats
- at least two distinct beats support the same function, unless the carrier is
  itself a continuous multi-beat decisive span
- the archetypal name adds more precision than ordinary language for the
  literal person, relationship, emotion, or action
- no competing label describes the same carrier more specifically with fewer
  assumptions

Prefer one strong echo to two weaker or overlapping echoes.
Return a second only when it has a distinct carrier or function and is nearly
as structurally important.
Zero or one is normal.

Anima and Animus are independent of the dreamer's gender, sex, and orientation.
Use them only for an autonomous mediating function between the dream-ego and
unknown imaginal or relational life, and only when Lover, Guide / Psychopomp,
Shadow, a Wise figure, or the literal relationship is less precise.

OUTPUT — ARCHETYPES

Return 0–2 objects:
{
  "canonical_label": "exact selectable catalog label",
  "expression": "concrete carrier in the dream's primary language",
  "resonance": "one sentence",
  "evidence": ["...", "..."],
  "confidence": "high" | "medium"
}

resonance:
- ideal 18–32 words; hard maximum 40
- begin with the carrier or action
- name its function and effect on the dream's movement
- remain image-near
- do not retell the whole dream
- avoid: represents, symbolizes, embodies, functions as, the psyche,
  wholeness, integrity, inner power

evidence:
- 1–2 faithful details from distinct beats
- never merge, reverse, or invent actions

MYTHIC ECHO (0–1)

A Mythic Echo is one specific recognized narrative whose causal story
mechanism, functional roles, and ordered sequence closely match the dream.

Candidate recall must begin from the ROLE–VERB MECHANISM.
Objects, creatures, occupations, settings, and broad themes come last.

If the dream has no distinctive causal mechanism and is mainly ordinary,
personal, fragmentary, or thematic, return [].

If a distinctive mechanism is present, silently recall up to three specific
recognized narratives before deciding [].

For each candidate, perform INDEPENDENT PLOT RECALL before matching it to the
dream.

Recall:

- exact narrative title
- accurate tradition or source corpus
- 4–7 concrete canonical plot beats in order
- functional roles
- defining rule, prohibition, bargain, test, deception, recognition,
  sacrifice, reversal, or return
- characteristic outcome
- two candidate-specific plot anchors that are not generic motifs and are not
  copied from the dream's wording

The two candidate-specific anchors must help distinguish that exact narrative
from other stories in the same tradition.

If you cannot recall the title, source, ordered plot, and distinguishing
anchors reliably, reject the candidate.

PLOT-CONTAMINATION TEST

Before matching, ask:

Could these supposed canonical beats have been produced merely by paraphrasing
the dream?

If yes, the candidate has not been independently recalled. Reject it.

TITLE–PLOT IDENTITY TEST

The canonical beats and distinguishing anchors must belong to the exact story
named in `title`.

A collection, anthology, source corpus, cultural tradition, generic story
family, motif, or bare mythic figure is not eligible as the title.
Use the collection or corpus only in `tradition`.

If the recalled beats belong to a specific tale inside a collection, return
that tale's established title.

STRUCTURAL MATCH

A candidate qualifies only when:

- at least three concrete canonical beats map to dream beats
- the broad order is preserved
- functional roles correspond
- the same defining mechanism is recognizable
- the match spans at least two stages of the dream
- the two distinguishing anchors are factually consistent with the selected
  title
- divergence changes a genuine match rather than excusing a missing structure

SURFACE-STRIPPING TEST

Ignore shared objects, creatures, occupations, names, setting, cultural fame,
and broad theme.

If mechanism + roles + ordered beats no longer identify the candidate, reject
it.

FINAL COMPARISON

Choose by:

1. defining mechanism
2. ordered sequence
3. functional roles
4. decisive span
5. ending
6. linked images
7. objects and themes

The first four dominate the last three.

Return [] when no specific narrative passes, when title/source remains
uncertain, or when two candidates remain genuinely inseparable.

A false Mythic Echo is worse than no echo.
But do not suppress a specific narrative that clearly matches the mechanism,
roles, and ordered beats merely because the dream changes the ending.

OUTPUT — MYTHIC ECHO

Return 0–1 object:
{
  "title": "exact recognized tale, episode, frame story, or plot-bearing cycle",
  "tradition": "one accurate source tradition or corpus",
  "resonance": "one sentence",
  "divergence": "one sentence",
  "evidence": ["...", "...", "..."],
  "confidence": "high" | "medium"
}

resonance + divergence:
- target 35–55 words total; hard maximum 65
- describe mechanism, roles, and sequence rather than a broad theme

evidence:
- 2–3 faithful details from different dream stages

Never state that the dream reenacts, proves, or means the narrative.
Never assign a fixed meaning to the dream.
```

---

## Compact catalog injection

Inject only:

```text
- <canonical label>
  function: <core function>
  qualifies when: <compact positive criteria>
  not enough: <compact exclusions>
```

Exclude:
- Ego
- UI/display metadata
- kind
- competitor lists

---

## Debug suffix

```text
DEBUG INTERPRETIVE ECHOES (internal only — not user-facing):

Finalize production `archetypes` and `amplifications` first.
Then add:

"interpretive_diagnostics": {
  "dream_map": {
    "beats": ["B1: ...", "B2: ..."],
    "role_verb_mechanism": "...",
    "decisive_span": ["B#"],
    "dominant_relation": "...",
    "ending": "...",
    "causal_omission_check": "pass" | "repaired"
  },
  "archetype_audit": [{
    "label": "...",
    "carrier": "...",
    "carrier_kind": "figure" | "dream_ego_action" | "relationship" |
                    "configuration" | "transformation",
    "evidence_beats": ["B#", "B#"],
    "function_match": "yes" | "no",
    "structural_importance": "yes" | "no",
    "adds_precision": "yes" | "no",
    "selected": true | false,
    "reason": "..."
  }],
  "mythic_audit": [{
    "title": "...",
    "tradition": "...",
    "title_type": "specific_tale" | "episode" | "frame_story" |
                  "plot_bearing_cycle" | "collection_or_corpus" |
                  "generic_family",
    "independent_plot_anchors": ["...", "..."],
    "canonical_beats": ["...", "..."],
    "plot_contamination_test": "pass" | "fail",
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
- Each beat is one local event or one uninterrupted action sequence.
- The decisive span contains 1–3 consecutive existing beats.
- When the decisive span has a plausible archetypal function, its
  `dream_ego_action` candidate must appear in `archetype_audit`, selected or
  rejected.
- Two descriptions of the same beat are not converging evidence.
- Only the first four `title_type` values are eligible for production.
- Independent plot anchors must be factual details of the selected narrative,
  not paraphrases of the dream.
- Do not use numerical self-scores.
- Audit only candidates actually considered.
```

---

## Compact user-prompt line

```text
Interpretive Echoes: use the raw dream only. Build the ordered event map and
role–verb mechanism first. Select archetypes by enacted function, explicitly
considering the decisive-span action when applicable. Recall myths from
mechanism and roles, verify each candidate through independent plot anchors,
then return 0–2 archetypes and 0–1 exact recognized narrative or [].
Use the reflection only for wording after selection.
```

---

## Test instruction

Deploy exactly this replacement as `prompt_version: 3.9.0`.

Do not append legacy v3.8.x instructions.
Do not add benchmark-specific examples or titles.
Run three fresh production extractions before a debug run.
Do not edit the prompt between runs.
