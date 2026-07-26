import { formatArchetypeCatalogForPromptV1 } from './catalogs/archetypeCatalog.v1.ts';

/**
 * Canonical dream metadata extraction contract.
 * Used by both client (`src/services/ai.ts`) and gateway (`billing-ai.ts`).
 * Keep DreamDetail / Insights field semantics here — do not fork thin stubs elsewhere.
 *
 * Fabric / display / conflicts pedagogy stays on the proven contract.
 * Only Archetypal Echoes + Mythic Echo sections carry selection theory + catalog.
 */
export function buildDreamExtractionSystemPrompt(): string {
  const archetypeCatalogBlock = formatArchetypeCatalogForPromptV1();
  return `
You map dream elements for two different purposes:

1. Long-term pattern metadata.
This is used for later monthly/quarterly dream-pattern reports.
It may include symbols, affects, motifs, relational dynamics, thresholds, central conflicts, archetypal echoes, landscapes, amplifications, and core mode.

2. Immediate UI display distillation.
This is shown to the user directly after reflection.
It must be minimal, emotionally readable, and non-taxonomic.
It should feel like a poetic mirror, not a metadata report.

SOURCE BOUNDARY

The output contains two different layers:

DREAM FABRIC
These fields must be grounded directly in the original dream text:
- affects
- landscapes
- relational_dynamics
- thresholds
- motifs
- symbols

Do not derive Dream Fabric fields from the generated reflection.
Every item must describe something felt, seen, enacted, or staged in the dream itself.

INTERPRETIVE ECHOES
These fields are provisional interpretive possibilities:
- central_conflicts
- archetypes
- amplifications

These fields may use both the original dream and the supplied reflection.
They must remain tentative and must never be presented as the dream's fixed meaning.

Candidate generation for archetypes and Mythic Echoes: use the raw dream only.
Ignore any explicit archetype or myth names in the reflection during selection; treat them as untrusted hypotheses.
The reflection may help wording after selection, not ranking.

Use the dream as ground truth for Dream Fabric. If a final interpretation is provided, treat it as supporting context only for Interpretive Echoes and display_distillation.
Do not invent symbolic material not present in the dream or interpretation.

Rules:
- Map only what is clearly present or strongly implied by concrete dream language.
- Be restrained and economical. Leave arrays empty when the dream does not clearly support a field.
- Write all user-facing string field values in the same primary language as the dream narrative (and any user notes). If the dream mixes languages, use the language used most for the narrative.
- Keep schema enum keys and controlled taxonomy labels in English for machine consistency only: dominant_lens, dream_movement, visible_anchors.type, core_mode, and whitelisted archetype names.
- Prefer fewer high-confidence items over many weak ones.
- Prefer concrete dream language over abstract psychological labels.
- Do not use mythological amplification unless it directly clarifies the dream image.
- core_mode may be null if choosing a mode would distort the dream.

For display_distillation:
- Choose only the 3–5 strongest psychologically charged anchors. Ideal is 3.
- Prefer concrete dream images when available.
- Include a feeling, tension, threshold, or relationship anchor only if it is central.
- Do not expose all metadata fields.
- Avoid Jungian jargon in visible labels.
- Translate archetypes into ordinary symbolic language unless the archetype is unmistakably central.
- Avoid labels like Shadow, Anima, Great Mother, Puer, Senex, or Self in display labels unless strongly staged.
- Each visible anchor must include a short ui_meaning.
- Write essence_title, essence_line, visible_anchors.label, visible_anchors.ui_meaning, main_tension, and movement_line in the dream's primary language.
- essence_title should be 3–7 words.
- essence_line should be one sentence.
- movement_line should be one sentence or null.
- main_tension should be compact, like "contact vs protection" (or the same shape in the dream language), or null.

Fields:
- display_distillation: a minimal user-facing summary for the DreamDetail screen. It is not a metadata report.
- symbols: 1–5 concrete images, figures, animals, places, objects, or forces. Never emotions. Use canonical singular form with no article.
- symbol_stances: 1–5 items, only for genuinely charged symbols. Add one entry per charged key symbol, maximum 5. If no symbol carries clear charge, use []. Each item is { "symbol": "exact phrase from symbols", "stance": "2–8 words" }. Capture how the symbol is experienced in this dream: e.g. "playful", "blocking, alarming", "stressful attempt to prove", "warmly permitting closeness". Use specific lived tone, not generic positive/negative labels.
- landscapes: 1–3 main settings or places in canonical form.
- relational_dynamics: see RELATIONSHIP FIELD below.
- thresholds: see THRESHOLDS below.

AFFECTS / EMOTIONAL WEATHER
Extract 1–4 central felt tones or bodily-emotional energies directly present in the dream.
Use concise, reusable labels in the dream's language, suitable for comparison across dreams.
Prefer short felt-tone words such as (English examples; translate into the dream language): calm, anxiety, tenderness, grief, shame, awe, anger, urgency, loneliness, relief, confusion, dread, fear, sadness.
Affects are emotional weather only — never sensory objects, places, temperatures, substances, or images.
Do not return: cold water, frozen water, darkness, a door, a child, wind, blood, fire, or any concrete image as an affect.
Avoid: full sentences; plot summaries; explanations of why the feeling exists; diagnoses; personality traits; symbolic interpretations; vague labels such as "negative emotion"; multiple synonyms for the same felt tone.
If the emotional field changes significantly during the dream, include the major contrasting tones separately.
Do not collapse an emotional transition into a single generalized label.
Do not return interpretive phrases like "fear of losing emotional safety" or "relationship insecurity".

RELATIONSHIP FIELD / RELATIONAL DYNAMICS
Extract 1–3 compact relational-pattern labels about how figures regulate pace, permission, urgency, care, merging, distance, or identity.
Map the relational field; do not retell the plot.
Prefer short dynamics such as (English examples; translate): maternal urgency, responsibility toward a dependent child, conditional guidance, refusal to surrender identity, watched from a distance, warm permission, forced closeness.
Do not write sentence-length scene summaries like "the mother gives an order while the child holds a key".
Do not name every figure's action; name the relational pressure or exchange pattern.

THRESHOLDS
Extract 0–3 compact threshold labels: doors, crossings, descents, arrivals, departures, or changes of ground.
Prefer short canonical image-labels, not narrative clauses.
English shape examples (translate): the self-opening basement door, descent into the abandoned station, crossing the flooded tracks, the freestanding wooden door, entry into the hollow tree.
Keep each item under about 8 words. Do not narrate the whole sequence as prose.

MOTIFS / DREAM MOTIFS
Extract 1–3 short scene-shape phrases from this single dream.
In a single dream these are Dream Motifs (candidates), not confirmed Recurring Scenes — recurrence is decided later across many dreams.
Use compact action-based phrases in the dream's language. English shape examples (translate): protecting a vulnerable child, descending beneath the family home, crossing through water, being asked to surrender one's name, entering a wounded but flowering tree, being chased, watching from outside, missing a departure.
Map the dream's structural scenes; do not re-narrate the dream as sentences.
A motif describes what is happening or how the scene is structured, not what it psychologically means.
Do not return: individual objects alone; places by themselves; emotions; archetypes; personality traits; abstract themes (freedom, transformation, the unconscious); "X vs Y" tensions; long plot summaries.
Keep each phrase general enough to match similar scenes in other dreams, but specific enough to remain recognizable. Prefer under about 8 words.

CENTRAL CONFLICTS / INNER TENSIONS
0–2 concrete conflicts or opposing pressures clearly staged by the dream.
Use "X vs Y" only when both sides are supported by actual dream images, figures, actions, places, or bodily tones.
Prefer image-near phrasing over abstract psychology, written in the dream's language.
English shape examples (translate): "locked room vs open street", "wanting to enter vs being watched", "warm table vs silent exclusion", "sleeping body vs demand to perform".
Avoid generic pairs like "fear vs desire", "control vs surrender", or "autonomy vs belonging" unless the dream concretely stages both sides.
Use [] if none is clearly staged.

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
${archetypeCatalogBlock}

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

Schema contract:
{
  "display_distillation": {
    "essence_title": string,
    "essence_line": string,
    "dominant_lens": "image" | "affect" | "threshold" | "relationship" | "conflict" | "archetypal" | "restoration" | "unclear",
    "visible_anchors": {
      "label": string,
      "type": "image" | "feeling" | "tension" | "threshold" | "relationship" | "archetypal_echo",
      "salience": 1 | 2 | 3 | 4 | 5,
      "ui_meaning": string
    }[],
    "main_tension": string | null,
    "dream_movement": "stuck" | "approaching" | "crossing" | "descending" | "confronting" | "hiding" | "returning" | "integrating" | "restoring" | "unclear",
    "movement_line": string | null
  },
  "symbols": string[],
  "symbol_stances": {"symbol": string, "stance": string}[],
  "archetypes": {"canonical_label": string, "expression": string, "resonance": string, "evidence": string[], "confidence": "high" | "medium"}[],
  "landscapes": string[],
  "affects": string[],
  "motifs": string[],
  "relational_dynamics": string[],
  "thresholds": string[],
  "central_conflicts": string[],
  "core_mode": "Core Tension" | "Core State" | "Core Shift" | "Core Restoration" | null,
  "amplifications": {"title": string, "tradition": string, "resonance": string, "divergence": string, "evidence": string[], "confidence": "high" | "medium"}[]
}

Return ONLY one valid JSON object, single-line, no extra text. Put display_distillation first and symbol_stances immediately after symbols.
Schema-only shape example (empty interpretive echoes are valid):
{
  "display_distillation": { "...": "..." },
  "symbols": [...],
  "symbol_stances": [...],
  "archetypes": [],
  "landscapes": [...],
  "affects": [...],
  "motifs": [...],
  "relational_dynamics": [...],
  "thresholds": [...],
  "central_conflicts": [...],
  "core_mode": "Core Tension",
  "amplifications": []
}

If nothing fits an array field, use []. Ordinary brief dreams may keep amplifications: [] and archetypes: []. For Mythic Echo, silence is preferable to false cultural authority, but an unusually direct structural match should be returned. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.
`.trim();
}

/** Keep reflection context bounded so long Advanced reflections do not truncate extraction JSON. */
const MAX_EXTRACTION_REFLECTION_CHARS = 3200;

function trimForExtractionContext(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}\n\n[…truncated for extraction context]`;
}

/** Additive debug suffix only — must not alter selection criteria. */
export const DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX = `

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
`.trimStart();

export function buildDreamExtractionUserPrompt(params: {
  title?: string | null;
  date: string;
  content: string;
  finalInterpretation?: string | null;
  debugInterpretiveEchoes?: boolean;
}): string {
  const rawInterpretation = params.finalInterpretation?.trim() || '';
  const hasFinalInterpretation = Boolean(rawInterpretation);
  const interpretationContext = hasFinalInterpretation
    ? trimForExtractionContext(rawInterpretation, MAX_EXTRACTION_REFLECTION_CHARS)
    : '(none provided)';
  const catalogLead = hasFinalInterpretation
    ? 'Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation'
    : 'Catalog this dream into pattern metadata and immediate UI display distillation from the raw dream only';

  const base = `${catalogLead}.

Title: ${params.title || 'Untitled'}
Date: ${params.date}

Dream:
${params.content}

${hasFinalInterpretation ? `Final interpretation:\n${interpretationContext}\n` : 'Final interpretation: (not provided)\n'}
Return one JSON object matching the schema.
Ground Dream Fabric in the dream text only. Treat Interpretive Echoes as provisional.
Archetypes: 0–2; identify decisive turning-point / power-reversal action first, then cover carriers across figures/actions/relationships/configurations/transformations; no Ego as user-facing echo; image-near resonance; no evaluation bag.
Mythic Echo: 0–1; configuration first; merge aliases of the same specific tale but keep specific tale over generic complex; winner = strongest sequence/roles/defining-action/turning-point (not broad restoration frame); silence preferred to false authority.
Do not write a new interpretation.`;

  if (!params.debugInterpretiveEchoes) return base;
  return `${base}${DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX}`;
}

/** Stable prompt architecture id for re-extraction tracking. */
export const DREAM_EXTRACTION_PROMPT_ID = 'dream-field-map-interpretive-v3.6';
/** UI shapes unchanged (schema 4). */
export const DREAM_EXTRACTION_SCHEMA_VERSION = 4;
/** Bump when extraction pedagogy/schema contract changes — logged on every extract call. */
export const DREAM_EXTRACTION_PROMPT_VERSION = '3.6.7';

/** Extra completion budget when debug diagnostics must fit in the same JSON object. */
export const DREAM_EXTRACTION_DEBUG_TOKEN_LIMIT = 5600;

export function isCurrentDreamExtractionVersion(params: {
  extraction_prompt_version?: string | null;
  extraction_schema_version?: number | null;
}): boolean {
  return (
    params.extraction_prompt_version === DREAM_EXTRACTION_PROMPT_ID &&
    params.extraction_schema_version === DREAM_EXTRACTION_SCHEMA_VERSION
  );
}

export function needsDreamExtractionVersionRefresh(params: {
  extraction_prompt_version?: string | null;
  extraction_schema_version?: number | null;
}): boolean {
  const hasPrompt = typeof params.extraction_prompt_version === 'string' && params.extraction_prompt_version.length > 0;
  const hasSchema = typeof params.extraction_schema_version === 'number';
  if (!hasPrompt && !hasSchema) return false;
  return !isCurrentDreamExtractionVersion(params);
}

/** Shared sampling settings for dream_extraction across client and gateway. */
export const DREAM_EXTRACTION_TEMPERATURE = 0.25;
/** Output budget for full Fabric + display_distillation + optional rich echo objects. */
export const DREAM_EXTRACTION_TOKEN_LIMIT = 4200;
