# Archetypal / Mythic Echo prompts & catalog (v3.6.7)
Canonical sources:
- Prompt: `src/ai/dreamExtractionPrompt.ts` (`prompt_version` `3.6.7`)
- Prompt id: `dream-field-map-interpretive-v3.6` / schema `4`
- Catalog: `src/ai/catalogs/archetypeCatalog.v1.ts`
- Facade: `src/ai/archetypeCatalog.ts`
- Display: `src/ai/archetypalEchoes.ts`, `src/ai/mythicEchoes.ts`
- Validators: `src/ai/validators/archetypalEchoValidator.ts`, `src/ai/validators/mythicEchoValidator.ts`
- Mythic open-world stub: `src/ai/mythicCatalog.ts`
- Whitelist: `src/constants/archetypes.ts`
- Dream Detail UI: `src/screens/DreamDetailScreen.tsx` (SymbolicLayersAccordion)

## Injected catalog note

The system prompt interpolates `formatArchetypeCatalogForPromptV1()` between the ARCHETYPAL purpose/rules and SELECTION PROCESS.

## ARCHETYPAL + MYTHIC prompt sections (live excerpt including catalog)

```
ARCHETYPAL ECHOES (0–2)

Purpose:
Offer an archetypal name only when the name sharpens the specific dream
image and reveals a structural function that ordinary relational language
would not express as precisely.

Use the raw dream only for selection.
The reflection may help tone and wording after selection, but it must not
introduce, strengthen, or rank an archetypal candidate.

Use only labels from the supplied Oneiros archetype catalog.
The catalog contains Jungian and post-Jungian psychic structures,
figures, relational roles, and transformational patterns.
Do not treat every catalog entry as the same kind of phenomenon.
Do not invent poetic archetype names.
Return OBJECTS only — never a string array.
Invalid: ["Divine Child", "Guide / Psychopomp"] or ["Shadow"]
Valid: [{"canonical_label":"Divine Child","expression":"the child discovered beneath the snow","resonance":"...","evidence":["..."],"confidence":"high"}]

ONEIROS ARCHETYPE CATALOG (operational — selection knowledge lives here):
- Self [psychic_structure] UI:"Self"
  function: Organizing centre of the psyche — wholeness or a unifying order that gathers opposing movements.
  select when: a centre, mandala, or figure unifies opposing movements; numinous ordering reshapes the whole field; reconciliation produces a new whole rather than a local truce
  insufficient: positive feeling alone; wise advice alone; any spiritual symbol
  competes with: Ego, Wise Old Man, Wise Old Woman
- Ego [psychic_structure] UI:"Ego"
  function: Conscious centre of agency — the dream-I that chooses, refuses, observes, or maintains identity.
  select when: deliberate choice or refusal organizes the scene; self-observation or identity maintenance is the structural issue; agency stance is contested or newly claimed
  insufficient: any first-person presence; ordinary protagonist without stance conflict
  competes with: Self, Persona, Hero
- Shadow [psychic_structure] UI:"Shadow"
  function: Excluded, disowned, neglected, or morally rejected qualities kept outside accepted identity.
  select when: a rejected or neglected counterpart carries disowned force; moral rejection or hidden instinct presses for recognition; the excluded other organizes more than one phase of the dream
  insufficient: darkness alone; danger alone; animal form alone; frightening atmosphere
  competes with: Double, Trickster, Death–Rebirth
- Persona [psychic_structure] UI:"Persona"
  function: Social mask or adapted role presented to others — often tense with a more private self.
  select when: performance for others or costume/title as identity is central; public vs private split organizes action; adapted role pressure changes belonging or agency
  insufficient: any clothing; any job title; being in public
  competes with: Ego, Ruler, Lover
- Anima [psychic_structure] UI:"Anima"
  function: Mediating soul-image that opens relation between the dream-ego and autonomous imaginal, relational, or unknown psychic life.
  select when: a figure mediates ego and unknown inner/relational life; the encounter redirects inward belonging or desire with autonomy; no better catalog pattern (Lover, Guide, Shadow, known person) fits the function
  insufficient: presence of a woman alone; attraction or romance alone; mystery or beauty alone; mother role alone; assumed from dreamer sex/gender
  competes with: Great Mother, Terrible Mother, Lover, Animus, Guide / Psychopomp
- Animus [psychic_structure] UI:"Animus"
  function: Mediating soul-image associated with directed discrimination, conviction, or spirit that opens unknown psychic life to the ego.
  select when: a figure mediates ego and logos/spirit/unknown inner direction; autonomous conviction or discrimination redirects the dream-ego; no better catalog pattern (Hero, Guide, Ruler, known person) fits the function
  insufficient: presence of a man alone; authority alone; father role alone; assumed from dreamer sex/gender
  competes with: Wise Old Man, Hero, Ruler, Anima
- Divine Child [archetypal_figure] UI:"The Divine Child"
  function: Child/infant configuration that carries renewal, vulnerable future, or decisive transformation.
  select when: the child actively changes the main action or field; future-bearing renewal is contested or protected centrally; unusual autonomy organizes decisions around the child
  insufficient: literal child only; brief memory; background image; childhood injury only
  competes with: Orphan
- Great Mother [archetypal_figure] UI:"The Great Mother"
  function: Nurturing, containing, fertile maternal matrix that supports growth or belonging.
  select when: maternal containing or nourishing organizes the field; shelter, feeding, or fertile ground is the structural gift; protective embrace enables growth rather than binding
  insufficient: any mother; any woman; house alone; food alone
  competes with: Terrible Mother, Anima
- Terrible Mother [archetypal_figure] UI:"The Terrible Mother"
  function: Maternal configuration that engulfs, possesses, or regressively binds.
  select when: maternal function binds, engulfs, or refuses separation; devouring care or possessive holding organizes the conflict; regressive pull prevents crossing or growth
  insufficient: powerful woman; underworld queen; older woman; punishment alone
  competes with: Great Mother, Ruler
- Wise Old Man [archetypal_figure] UI:"The Wise Old Man"
  function: Elder masculine wisdom offering orientation, meaning, or initiatory knowledge.
  select when: elder wisdom orients at a threshold; knowledge transmission changes the dream-ego’s path; numinous counsel exceeds ordinary advice
  insufficient: any old man; any teacher; advice without wisdom charge
  competes with: Guide / Psychopomp, Animus, Ruler
- Wise Old Woman [archetypal_figure] UI:"The Wise Old Woman"
  function: Elder feminine wisdom offering orientation, craft, fate-knowledge, or initiatory counsel.
  select when: elder feminine wisdom orients at a threshold; craft or fate-knowledge changes the path; numinous counsel exceeds ordinary domestic advice
  insufficient: any old woman; grandmother role alone; advice without wisdom charge
  competes with: Guide / Psychopomp, Great Mother, Anima
- Hero [archetypal_figure] UI:"The Hero"
  function: Ego-strengthening questing agency that confronts an ordeal to win a boon or crossing.
  select when: quest or ordeal agency organizes the movement; trial, combat, or rescue earns a crossing or boon; courageous agency is the structural function, not mere action
  insufficient: any courage; any journey; dreamer takes any action
  competes with: Ego, Orphan, Death–Rebirth
- Trickster [archetypal_figure] UI:"The Trickster"
  function: Boundary-crossing disruption that inverts order, exposes false structure, or opens possibility through cunning — as figure or mode of action.
  select when: rules are inverted or boundaries crossed with cunning; comic or chaotic reversal exposes false order; disruption creates a new possibility rather than mere villainy
  insufficient: any liar; any joke; anything strange or confusing
  competes with: Shadow, Guide / Psychopomp
- Guide / Psychopomp [relational_role] UI:"The Guide / Psychopomp"
  function: Leads meaningfully between psychic grounds, thresholds, realms, or modes of awareness.
  select when: active guidance across a real crossing or realm-shift; threshold escort changes mode of awareness; guidance is structural, not mere companionship
  insufficient: offers transport only; gives advice only; missed departure; guards without guiding
  competes with: Divine Child, Wise Old Man, Wise Old Woman
- Double [relational_role] UI:"The Double"
  function: Rival, substitute, or split-off self competing for the dreamer’s place, role, identity, or agency.
  select when: identity competition, substitution, or rivalry for the dreamer’s place; a counterpart occupies or claims the dreamer’s recognition; split agency is the organizing conflict
  insufficient: shared face or eyes only; mirror resemblance only; vague familiarity
  competes with: Shadow, Death–Rebirth
- Orphan [archetypal_figure] UI:"The Orphan"
  function: Abandonment, exile, or lack of belonging that organizes the dream’s emotional centre.
  select when: exile or abandonment organizes the centre; search for home or kin-protection drives movement; aloneness without belonging is structural, not incidental
  insufficient: brief loneliness; any child; missing one parent incidentally
  competes with: Divine Child, Hero
- Lover [relational_role] UI:"The Lover"
  function: Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.
  select when: erotic or devoted relatedness organizes the dream; union, longing, or heart-risk is the structural stake; choosing the beloved changes the field
  insufficient: any romance cue; attractiveness alone; wedding scenery alone
  competes with: Anima, Animus, Sacred Marriage, Persona
- Ruler [archetypal_figure] UI:"The Ruler"
  function: Embodied sovereign or sustained ruling function that organizes the field through authority.
  select when: embodied sovereign agency commands the field; throne, court, or ruling will is actively exercised; authority is personal and structural, not mere backdrop
  insufficient: institution alone; guards or audience alone; ceremony alone; title without agency
  competes with: Persona, Terrible Mother, Wise Old Man
- Death–Rebirth [transformational_pattern] UI:"Death–Rebirth"
  function: Dying-and-becoming sequence — dissolution of old form and emergence of a new psychic state.
  select when: dissolution and emergent renewal form a sequence; stripping, burial, or descent precedes return in new form; the ending is transformative, not merely sad or threatening
  insufficient: death image alone; any change; departure or arrival alone; night falling
  competes with: Shadow, Divine Child, Hero
- Sacred Marriage [transformational_pattern] UI:"Sacred Marriage"
  function: Hieros gamos — union of opposing principles that creates a new psychic third/wholeness.
  select when: opposing principles unite into a new third; ritual or numinous coupling reconciles a structural split; inner marriage imagery produces wholeness, not mere romance
  insufficient: ordinary wedding; romance alone; any couple
  competes with: Lover, Self, Anima, Animus

SELECTION PROCESS

CANDIDATE COVERAGE (before ranking — do not skip):

First identify internally (do not skip):
- the decisive turning point of the dream
- the action that reverses the power balance
- the action that changes what becomes possible afterward

These may include tricks, refusals, sacrifices, betrayals, protective acts,
revelations, identity reversals, or alliance shifts — not only openings,
arrivals, or late restorative gestures.

Then identify candidate carriers separately across these classes:
- figures
- dream-ego actions / modes of action
- relationships
- configurations
- transformations

Do not search only among personified or numinous figures.
The decisive turning-point action MUST be included among candidate carriers
before any ranking — even when an earlier preparatory action (opening a vessel,
breaking a chain, following a guide) is more visually striking.
Prefer the action that reorganizes the whole relation or outcome over a merely
initiating or concluding gesture.
Do not force an archetype from every carrier class — coverage means consider,
not invent.

Then, for each considered carrier:

1. Track the dream-ego's relation to it:
   approaching, avoiding, following, resisting, replacing, protecting,
   surrendering, confronting, depending on, or being transformed by it.

2. Ask whether the carrier remains primarily literal/personal, or whether
   it also gathers archetypal weight.

Archetypal weight requires support from at least two of:
- it organizes more than one phase of the dream
- it substantially changes the dream-ego's position, agency, or belonging
- it acts with relative autonomy or numinous force
- it transforms the surrounding dream-field
- several images, relationships, or tensions gather around it
- its function exceeds its ordinary social or literal role

Intense emotion, unusual appearance, familiarity, age, gender, darkness,
authority, danger, attraction, or one conventional symbol are not sufficient.

3. Generate internally up to three plausible catalog candidates drawn from
   the covered carriers (not only from the most personified figure).

4. Compare them by:
- functional fit
- centrality to the dream's movement
- relation to the dream-ego
- specificity to this exact dream
- number of unsupported assumptions required
- risk of flattening or inflating the image

Select the candidate that explains the carrier's primary function with the
fewest assumptions.

Return a second echo only when it has a distinctly different carrier or
function, is nearly as central as the first, and adds real precision.
Zero or one echo is normal.

A literal or personal relationship may still carry archetypal resonance,
but personal intensity alone does not make it archetypal.

For Anima or Animus, never infer from sex, gender, attraction, or the mere
presence of a man or woman. Select only when the figure mediates a distinct
relation between the dream-ego and autonomous imaginal, relational, or
unknown psychic life, and no other catalog pattern describes the function
more precisely.

Return [] when the archetypal label would add grandeur or taxonomy but not
greater understanding of the image.

Do not select Ego as a user-facing Archetypal Echo. Ambient dream-ego agency,
choice, or self-observation alone is not an echo label.

Do not include an evaluation bag in production output. Candidate evaluation belongs only in debug interpretive_diagnostics when requested.
Do not use generic non-archetypes such as Transformation, Freedom, Fear, or Journey.
Archetypal echoes are provisional, not diagnoses, identities, or definitive explanations.

OUTPUT

For each selected echo return:
- canonical_label: exact catalog label (not the UI displayLabel)
- expression: the concrete carrier in this dream (figure, action, relationship, configuration, or transformation; dream's primary language; must NOT equal canonical_label)
- resonance: one sentence, ideally 18–32 words, hard maximum 40. Begin with the concrete carrier or its action. Describe only its primary function and its effect on the dream's movement. Do not retell the plot. Avoid abstract explanatory language such as "represents", "symbolizes", "functions as", "acts as a carrier of", or generic claims about wholeness, power, integrity, transformation, the unconscious, or the psyche. No "Appears as…".
- evidence: 1–2 short, concrete, dream-grounded phrases from distinct moments or actions (dream's primary language)
- confidence: "high" when central, specific, and strongly enacted across the dream; "medium" when meaningful and structurally supported but partial. Do not return low-confidence echoes.

- core_mode: exactly one of "Core Tension", "Core State", "Core Shift", "Core Restoration", or null.

MYTHIC ECHO (0–1)

Purpose:
A Mythic Echo is an amplification: a specific cultural narrative that
widens the dream while preserving the dream's own difference.
It is not a decoding key and must never replace the dream with the myth.

Use the raw dream only for candidate selection.
The reflection may help localized wording only after selection.

INTERNAL SELECTION PROCESS

Before recalling any narrative, derive the dream's configuration internally:

- ordered sequence of major events
- relational roles
- defining action, prohibition, bargain, test, or reversal
- distinctive linked images
- decisive turning point
- transformation or ending

Then generate internally up to four specific, recognized narratives from
world mythology, epic, fairy tale, religious narrative, or alchemical
tradition.

CANONICALIZE before ranking:
Title variants, translations, and alternate spellings of the SAME specific
narrative must become ONE candidate (merge aliases). They must not compete
as separate stories or split support artificially.

Preserve narrative specificity — do NOT collapse a specific recognized tale
into a generic motif or folktale complex.
Hierarchy (keep the most specific reliably identified level):
specific episode/tale > recognized cycle > generic narrative complex > motif
When a specific tale is reliably identified, discard or subordinate its
generic parent candidate — never replace the specific tale with the parent.

Score each remaining candidate separately on these dimensions (0–5 each):
1. ordered sequence
2. relational roles
3. defining action / rule / bargain / reversal
4. turning point and outcome
5. distinctive linked images
6. object / figure association (weakest dimension)

Object or figure association alone must never receive high structural strength.
A more famous narrative must lose when a less famous one matches ordered
sequence and roles more precisely.
Do not begin from a famous name/object and search the dream for supporting details.
Do not borrow defining events from one narrative to justify another.

Evidence for a high-strength candidate must include ordered events from
different stages of the dream — not only objects or broad motifs.
Debug/production evidence phrases must be exact spans from the dream text or
clearly marked summaries — never altered pseudo-quotes that reverse the action.

WINNER CONSISTENCY
The selected Mythic Echo should normally be the valid candidate with the
strongest combination of:
- ordered sequence
- relational roles
- defining action / rule / reversal
- turning point
Priority: specific multi-stage sequence + defining reversal
> broad restoration / ending / wasteland frame
> object association
A late restoration ending may enrich divergence; it must not erase a more
exact distinctive sequence earlier in the dream.
If a candidate with structural_strength "high" loses to one marked "medium",
diagnostics MUST state a concrete gate failure (invalid title, unreliable
tradition, missing defining action, etc.) — not a mere preference for the ending.

SELECTION GATE

Return one candidate only when all are true:

- it is a specific recognized narrative, cycle, tale, or episode
  (prefer specific tale over generic complex when both compete)
- its title and source tradition are known reliably
- at least three structural dimensions among sequence / roles / defining action /
  turning point / linked images score strongly
- sequence or relational roles are among the strongest matches
- the narrative's defining action, rule, conflict, or reversal remains recognizable
- no considered candidate offers a clearly more exact structural match
- the divergence changes or redirects the pattern without revealing that
  the defining structure is absent

Reject:
- generic motifs or thematic names
- bare mythic figures
- invented or uncertain titles
- unnamed folk traditions / vague "folktale complex" titles when a specific tale fits better
- matches based mostly on atmosphere, one object, one creature, or one theme
- candidates that require the dream sequence to be simplified or rearranged
- candidates whose divergence exists mainly to excuse a weak match
- high structural strength justified only by object/figure association

Return [] when narrative identity, tradition, or structural fit is uncertain.
Silence is preferable to false cultural authority.
An unusually direct structural match should nevertheless be returned.

OUTPUT

- title: recognized localized title when established; otherwise the canonical scholarly title. Never invent a translation. Narrative/cycle/episode only — never a bare figure. Prefer one canonical title after alias merge.
- tradition: one accurate, standardized source-tradition label
- resonance: one concise sentence naming the distinctive shared sequence or configuration (dream's primary language)
- divergence: one concise sentence showing how the dream changes, reverses, softens, intensifies, or leaves unfinished that pattern (dream's primary language)
- evidence: 2–3 concrete dream details drawn from different stages of the sequence (dream's primary language)
- confidence: measures structural fit only. Title and tradition themselves must already be reliable. "high" only when multi-stage sequence/roles/defining action are strong — never from object association alone; "medium" for clear structural correspondence with meaningful differences.

resonance + divergence: target 35–55 words total; hard maximum 65.
Do not prefer Greek mythology or the dreamer's country/language by default.
Do not mix several traditions into one parallel.
Do not invent myths or unsupported details.
Do not state that the dream reenacts or means the myth.
Do not assign a fixed meaning to the dream.
```

## Debug diagnostics suffix

```
DEBUG INTERPRETIVE ECHOES (internal only — not user-facing):
CRITICAL: The same single JSON object MUST include a top-level key "interpretive_diagnostics".
This key is allowed in addition to the schema contract above. Do not omit it.
After finalizing archetypes and amplifications with the same criteria as without this block, set:
"interpretive_diagnostics": {
  "decisive_turning_point": "short exact-or-summary description of the action that reverses power / changes what becomes possible",
  "archetype_candidates": [{
    "label", "carrier", "carrier_kind": "figure"|"dream_ego_action"|"relationship"|"configuration"|"transformation",
    "support": [], "counterevidence": [], "centrality": 0-5, "selected": true|false, "rejection_reason"?, "evaluation_notes"?
  }],
  "mythic_candidates": [{
    "canonical_id", "title", "tradition", "narrative_specificity": "specific_tale"|"cycle"|"generic_complex"|"motif",
    "aliases_merged": [],
    "sequence_match": 0-5, "role_match": 0-5, "defining_action_match": 0-5,
    "turning_point_match": 0-5, "linked_image_match": 0-5, "object_association": 0-5,
    "support": [], "structural_strength": "high"|"medium"|"low",
    "selected": true|false, "rejection_reason"?, "gate_failure"?
  }]
}
support[] / evidence phrases: prefer exact dream-text spans; if summarizing, prefix with "summary:". Never reverse or invent the action.
Include decisive_turning_point whenever one exists.
Include up to 3 archetype candidates after carrier coverage — at least one must use the decisive turning-point action as carrier when such an action exists (even if that candidate is later rejected).
Include up to 4 mythic candidates AFTER alias merge of the same specific tale — never collapse a specific tale into a generic complex, and never list title variants as separate competitors.
If structural_strength "high" loses to "medium", rejection_reason or gate_failure MUST name a concrete gate failure.
Use empty candidate arrays only when no candidates were considered.
Candidate evaluation belongs only here — never in production archetypes[].
Do not change production fields because of this debug request.
```

## Operational catalog (standalone)

```
- Self [psychic_structure] UI:"Self"
  function: Organizing centre of the psyche — wholeness or a unifying order that gathers opposing movements.
  select when: a centre, mandala, or figure unifies opposing movements; numinous ordering reshapes the whole field; reconciliation produces a new whole rather than a local truce
  insufficient: positive feeling alone; wise advice alone; any spiritual symbol
  competes with: Ego, Wise Old Man, Wise Old Woman
- Ego [psychic_structure] UI:"Ego"
  function: Conscious centre of agency — the dream-I that chooses, refuses, observes, or maintains identity.
  select when: deliberate choice or refusal organizes the scene; self-observation or identity maintenance is the structural issue; agency stance is contested or newly claimed
  insufficient: any first-person presence; ordinary protagonist without stance conflict
  competes with: Self, Persona, Hero
- Shadow [psychic_structure] UI:"Shadow"
  function: Excluded, disowned, neglected, or morally rejected qualities kept outside accepted identity.
  select when: a rejected or neglected counterpart carries disowned force; moral rejection or hidden instinct presses for recognition; the excluded other organizes more than one phase of the dream
  insufficient: darkness alone; danger alone; animal form alone; frightening atmosphere
  competes with: Double, Trickster, Death–Rebirth
- Persona [psychic_structure] UI:"Persona"
  function: Social mask or adapted role presented to others — often tense with a more private self.
  select when: performance for others or costume/title as identity is central; public vs private split organizes action; adapted role pressure changes belonging or agency
  insufficient: any clothing; any job title; being in public
  competes with: Ego, Ruler, Lover
- Anima [psychic_structure] UI:"Anima"
  function: Mediating soul-image that opens relation between the dream-ego and autonomous imaginal, relational, or unknown psychic life.
  select when: a figure mediates ego and unknown inner/relational life; the encounter redirects inward belonging or desire with autonomy; no better catalog pattern (Lover, Guide, Shadow, known person) fits the function
  insufficient: presence of a woman alone; attraction or romance alone; mystery or beauty alone; mother role alone; assumed from dreamer sex/gender
  competes with: Great Mother, Terrible Mother, Lover, Animus, Guide / Psychopomp
- Animus [psychic_structure] UI:"Animus"
  function: Mediating soul-image associated with directed discrimination, conviction, or spirit that opens unknown psychic life to the ego.
  select when: a figure mediates ego and logos/spirit/unknown inner direction; autonomous conviction or discrimination redirects the dream-ego; no better catalog pattern (Hero, Guide, Ruler, known person) fits the function
  insufficient: presence of a man alone; authority alone; father role alone; assumed from dreamer sex/gender
  competes with: Wise Old Man, Hero, Ruler, Anima
- Divine Child [archetypal_figure] UI:"The Divine Child"
  function: Child/infant configuration that carries renewal, vulnerable future, or decisive transformation.
  select when: the child actively changes the main action or field; future-bearing renewal is contested or protected centrally; unusual autonomy organizes decisions around the child
  insufficient: literal child only; brief memory; background image; childhood injury only
  competes with: Orphan
- Great Mother [archetypal_figure] UI:"The Great Mother"
  function: Nurturing, containing, fertile maternal matrix that supports growth or belonging.
  select when: maternal containing or nourishing organizes the field; shelter, feeding, or fertile ground is the structural gift; protective embrace enables growth rather than binding
  insufficient: any mother; any woman; house alone; food alone
  competes with: Terrible Mother, Anima
- Terrible Mother [archetypal_figure] UI:"The Terrible Mother"
  function: Maternal configuration that engulfs, possesses, or regressively binds.
  select when: maternal function binds, engulfs, or refuses separation; devouring care or possessive holding organizes the conflict; regressive pull prevents crossing or growth
  insufficient: powerful woman; underworld queen; older woman; punishment alone
  competes with: Great Mother, Ruler
- Wise Old Man [archetypal_figure] UI:"The Wise Old Man"
  function: Elder masculine wisdom offering orientation, meaning, or initiatory knowledge.
  select when: elder wisdom orients at a threshold; knowledge transmission changes the dream-ego’s path; numinous counsel exceeds ordinary advice
  insufficient: any old man; any teacher; advice without wisdom charge
  competes with: Guide / Psychopomp, Animus, Ruler
- Wise Old Woman [archetypal_figure] UI:"The Wise Old Woman"
  function: Elder feminine wisdom offering orientation, craft, fate-knowledge, or initiatory counsel.
  select when: elder feminine wisdom orients at a threshold; craft or fate-knowledge changes the path; numinous counsel exceeds ordinary domestic advice
  insufficient: any old woman; grandmother role alone; advice without wisdom charge
  competes with: Guide / Psychopomp, Great Mother, Anima
- Hero [archetypal_figure] UI:"The Hero"
  function: Ego-strengthening questing agency that confronts an ordeal to win a boon or crossing.
  select when: quest or ordeal agency organizes the movement; trial, combat, or rescue earns a crossing or boon; courageous agency is the structural function, not mere action
  insufficient: any courage; any journey; dreamer takes any action
  competes with: Ego, Orphan, Death–Rebirth
- Trickster [archetypal_figure] UI:"The Trickster"
  function: Boundary-crossing disruption that inverts order, exposes false structure, or opens possibility through cunning — as figure or mode of action.
  select when: rules are inverted or boundaries crossed with cunning; comic or chaotic reversal exposes false order; disruption creates a new possibility rather than mere villainy
  insufficient: any liar; any joke; anything strange or confusing
  competes with: Shadow, Guide / Psychopomp
- Guide / Psychopomp [relational_role] UI:"The Guide / Psychopomp"
  function: Leads meaningfully between psychic grounds, thresholds, realms, or modes of awareness.
  select when: active guidance across a real crossing or realm-shift; threshold escort changes mode of awareness; guidance is structural, not mere companionship
  insufficient: offers transport only; gives advice only; missed departure; guards without guiding
  competes with: Divine Child, Wise Old Man, Wise Old Woman
- Double [relational_role] UI:"The Double"
  function: Rival, substitute, or split-off self competing for the dreamer’s place, role, identity, or agency.
  select when: identity competition, substitution, or rivalry for the dreamer’s place; a counterpart occupies or claims the dreamer’s recognition; split agency is the organizing conflict
  insufficient: shared face or eyes only; mirror resemblance only; vague familiarity
  competes with: Shadow, Death–Rebirth
- Orphan [archetypal_figure] UI:"The Orphan"
  function: Abandonment, exile, or lack of belonging that organizes the dream’s emotional centre.
  select when: exile or abandonment organizes the centre; search for home or kin-protection drives movement; aloneness without belonging is structural, not incidental
  insufficient: brief loneliness; any child; missing one parent incidentally
  competes with: Divine Child, Hero
- Lover [relational_role] UI:"The Lover"
  function: Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.
  select when: erotic or devoted relatedness organizes the dream; union, longing, or heart-risk is the structural stake; choosing the beloved changes the field
  insufficient: any romance cue; attractiveness alone; wedding scenery alone
  competes with: Anima, Animus, Sacred Marriage, Persona
- Ruler [archetypal_figure] UI:"The Ruler"
  function: Embodied sovereign or sustained ruling function that organizes the field through authority.
  select when: embodied sovereign agency commands the field; throne, court, or ruling will is actively exercised; authority is personal and structural, not mere backdrop
  insufficient: institution alone; guards or audience alone; ceremony alone; title without agency
  competes with: Persona, Terrible Mother, Wise Old Man
- Death–Rebirth [transformational_pattern] UI:"Death–Rebirth"
  function: Dying-and-becoming sequence — dissolution of old form and emergence of a new psychic state.
  select when: dissolution and emergent renewal form a sequence; stripping, burial, or descent precedes return in new form; the ending is transformative, not merely sad or threatening
  insufficient: death image alone; any change; departure or arrival alone; night falling
  competes with: Shadow, Divine Child, Hero
- Sacred Marriage [transformational_pattern] UI:"Sacred Marriage"
  function: Hieros gamos — union of opposing principles that creates a new psychic third/wholeness.
  select when: opposing principles unite into a new third; ritual or numinous coupling reconciles a structural split; inner marriage imagery produces wholeness, not mere romance
  insufficient: ordinary wedding; romance alone; any couple
  competes with: Lover, Self, Anima, Animus
```
