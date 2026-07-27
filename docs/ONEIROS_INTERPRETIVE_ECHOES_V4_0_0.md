# Oneiros Interpretive Echoes v4.0.0 — minimal contrastive single-call prompt

## Runtime settings

For `dream_metadata_extract`:

```ts
temperature: 0
```

Keep the same single AI call, model, schema, Dream Fabric, persistence, validators, and UI.

Do not append this to v3.9.0. Replace only the current Interpretive Echoes instructions with the block below.

---

## Production prompt block

```text
INTERPRETIVE ECHOES

Return:
- archetypes: 0–2
- amplifications: 0–1

These are optional resonances, not a second interpretation.

EVIDENCE FIREWALL

Select labels, titles, traditions, confidence, and evidence from the RAW DREAM only.
For these decisions, treat the reflection as absent.

After the selections are fixed, the reflection may help only with the wording of:
- archetype resonance
- mythic resonance
- mythic divergence

It may not introduce, remove, strengthen, weaken, rename, or provide evidence for any selection.

ARCHETYPAL ECHOES

Use only exact selectable labels from the Oneiros archetype catalog.
Never return Ego. Never invent a label.

Read the dream in causal order and ask:

1. What exact action most changed what could happen next?
2. What figure, relationship, or pattern actively changed the dream across more than one moment?
3. Which catalog function is enacted by those carriers?

Consider the decisive action before visually striking figures.

Select an archetype only when:
- the catalog function is plainly enacted by what the carrier does
- the carrier is central or causally important
- the label is more precise than an ordinary description of the person,
  feeling, relationship, or action

One continuous multi-step action may count as sufficient evidence.
Otherwise require support from two distinct dream moments.

Do not infer an archetype from age, gender, appearance, darkness, beauty,
authority, occupation, advice, courage, danger, attraction, or conventional
symbolism alone.

Prefer one exact echo to two weaker echoes.
Return [] when ordinary relational language is more accurate.

MYTHIC ECHO

Return one myth only when a SPECIFIC recognized narrative matches the dream's:
- defining causal sequence
- functional roles
- decisive reversal, rule, bargain, prohibition, test, recognition, or sacrifice

Match sequence and roles before objects, creatures, settings, endings, or themes.

Before selecting a title, recall that story's actual plot independently of the dream.
The selected title must be the exact tale or episode whose plot was recalled.
A motif, generic story family, anthology, corpus, or bare figure is not a valid title.

Use the anthology or corpus only as `tradition`.

Reject a candidate when:
- it shares mainly an object, magical being, wasteland, descent, treasure,
  restoration, atmosphere, or broad theme
- its defining sequence is absent
- the title or tradition is uncertain
- another specific tale matches the sequence more exactly

Return [] when no specific narrative clearly matches.
A false Mythic Echo is worse than silence.

CONTRASTIVE EXAMPLES

Example A — decisive cunning and exact tale

Dream pattern:
A weaker person releases a powerful being from a sealed vessel.
The being threatens the liberator.
The person feigns disbelief, challenges it to prove it can fit inside,
then closes the vessel and turns threat into negotiation.
A separate animal later guides the person through a real descent.

Correct:
- Trickster: the dream-ego's cunning reversal
- Guide / Psychopomp: the animal's active threshold guidance
- Mythic Echo: The Fisherman and the Jinni
- tradition: One Thousand and One Nights

Incorrect:
- Hero merely because the dreamer acts bravely
- Wise Old Woman merely because an older woman warned once
- Aladdin because a magical being or vessel appears
- Fisher King because a wasteland is later restored
- The Ring of Gyges because power or invisibility is broadly relevant
- Jinn in the Bottle as a generic motif title

Example B — personal conflict without earned echo

Dream pattern:
A father shouts privately, then acts sweetly in front of relatives.
The dreamer feels anger but cannot express it.

Correct:
- archetypes: []
- amplifications: []

Do not force Shadow, Persona, Ruler, or a myth merely because the conflict is intense.

Example C — appearance is not function

Dream pattern:
An old man gives an incorrect timetable and leaves.
No real crossing occurs and his advice changes nothing.

Correct:
- archetypes: []
- amplifications: []

Do not select Wise Old Man or Guide / Psychopomp from age or advice alone.

OUTPUT

Archetype object:
{
  "canonical_label": "exact selectable catalog label",
  "expression": "concrete dream carrier",
  "resonance": "one sentence, 18–32 words, maximum 40",
  "evidence": ["1–2 faithful raw-dream details"],
  "confidence": "high" | "medium"
}

Mythic object:
{
  "title": "exact recognized tale or episode",
  "tradition": "one accurate tradition or source corpus",
  "resonance": "one concise sentence naming the shared sequence and roles",
  "divergence": "one concise sentence naming how the dream changes the tale",
  "evidence": ["2–3 faithful raw-dream details from different stages"],
  "confidence": "high" | "medium"
}

Use the dream's primary language for expression, resonance, divergence, and evidence.
Use an established title; do not invent or freely translate one.
Do not say the dream reenacts, proves, or means the myth.
```

---

## Catalog injection

Keep the catalog compact:

```text
- <canonical label>
  function: <one sentence>
  select when: <compact positive criteria>
  not enough: <compact exclusions>
```

Exclude:
- Ego
- UI/display labels
- kind metadata
- competitor lists

---

## User-prompt line

```text
For Interpretive Echoes, use the raw dream only for selection and evidence.
Treat the reflection as absent until labels and myth title/tradition are fixed.
Apply the contrastive examples and return 0–2 exact catalog archetypes and
0–1 exact recognized narrative, or [] when not earned.
```

---

## Test protocol

1. Deploy as `prompt_version: 4.0.0`.
2. `temperature: 0`.
3. Debug suffix OFF.
4. Run 10 fresh uncached production extractions:
   - 5 target-dream runs
   - 5 different holdout dreams
5. Do not edit the prompt between runs.
6. Log only raw and post-validation `archetypes` and `amplifications`.

Target-dream acceptance:
- Trickster selected in at least 4/5 runs
- Guide / Psychopomp acceptable as second echo
- Wise Old Woman selected in no more than 1/5
- The Fisherman and the Jinni selected in at least 4/5
- Aladdin, Fisher King, Gyges, and generic motif titles selected 0/5

Do not tune again on a single isolated run.
