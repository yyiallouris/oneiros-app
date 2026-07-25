import { ARCHETYPE_WHITELIST } from '../constants/archetypes.ts';

/**
 * Canonical dream metadata extraction contract.
 * Used by both client (`src/services/ai.ts`) and gateway (`billing-ai.ts`).
 * Keep DreamDetail / Insights field semantics here — do not fork thin stubs elsewhere.
 */
export function buildDreamExtractionSystemPrompt(): string {
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

ARCHETYPAL ECHOES
Return 0–2 classical archetypal patterns from the allowed catalog as OBJECTS only. Never return a string array.
Invalid: ["Divine Child", "Guide / Psychopomp"] or ["Shadow"]
Valid: [{"canonical_label":"Divine Child","expression":"the child discovered beneath the snow","resonance":"...","evidence":["..."]}]

Use the canonical archetypal name as the primary label.
Do not invent poetic archetype names.
The dream-specific expression must remain secondary to the canonical label.

Example:
canonical_label: "Divine Child"
expression: "the child discovered beneath the snow"

Allowed canonical_label values only: ${ARCHETYPE_WHITELIST.join(', ')}

For each archetypal echo provide ALL of:
- canonical_label: one allowed classical name from the catalog above
- expression: the concrete figure or configuration through which it appears in this dream (dream's primary language; must NOT equal canonical_label)
- resonance: a concise explanation of the role it plays in the dream (dream's primary language)
- evidence: 1–2 supporting dream elements (dream's primary language)

Do not force an archetype when the evidence is weak. However, when multiple dream elements converge around a recognizable archetypal pattern and that pattern plays a structural role in the dream, return the strongest supported echo rather than defaulting automatically to an empty array.
A literal figure may carry an archetypal quality when its actions, position, and relationship to the dream's movement support it — not merely because the figure exists.
Include support from at least two distinct dream elements (actions, positions, relationships, or movements), not a single conventional symbol.
Do not classify a figure solely by age, gender, appearance or one conventional symbol.
An archetype must be supported by the figure's role in the dream's movement.
When one figure carries several overlapping qualities, prefer one coherent canonical pattern rather than several disconnected tags.
Do not use generic non-archetypes such as Transformation, Freedom, Fear, or Journey.
Do not infer:
- Shadow merely from darkness, danger, aggression, or an unknown figure
- Anima or Animus merely from the presence of a woman or man
- Self merely from a circle, centre, mandala, or sacred-looking image
- Death–Rebirth merely from an ending, beginning, departure, or arrival
- Hero merely because the dreamer takes action
- Trickster merely because something confusing or strange occurs
- Divine Child merely because a child is present without structural role
- Guide / Psychopomp merely because an older person speaks
Archetypal echoes are provisional, not diagnoses, identities, or definitive explanations.
When evidence is truly weak, return an empty array.

- core_mode: exactly one of "Core Tension", "Core State", "Core Shift", "Core Restoration", or null.

AMPLIFICATIONS / MYTHIC ECHOES
Amplifications are not Dream Fabric extraction. They are optional generated interpretive possibilities — provisional mythic/folkloric/cultural echoes, not facts present in the dream like a house or a felt tone.
Return 0–1 named parallel from world mythology, folklore, fairy tale, religious narrative or alchemical tradition.

Prefer a recognized mythic narrative or figure rather than inventing a generic mythic-sounding title.

For each echo provide ALL of:
- title: the established name of the myth, narrative or figure
- tradition: its cultural or historical tradition (one tradition only)
- resonance: the specific configuration shared with the dream (dream's primary language)
- difference: an important way the dream diverges from the traditional story (dream's primary language)
- evidence: 2–3 concrete dream elements (dream's primary language)

A mythic echo requires structural convergence across several elements.
A shared object alone is not enough.
Most ordinary dreams should return []. Do not mythology-roulette among famous myths.
When a strong named parallel exists, return the most illuminating single echo rather than defaulting to an empty array.

Do not:
- mix several traditions into one parallel
- treat cultures as interchangeable
- invent myths or unsupported details
- state that the dream reenacts or means the myth
- use a famous myth merely because one symbol is present
- assign a fixed meaning to the dream
- replace the dreamer's personal associations
- claim a completed return, integration, rebirth, or transformation unless the dream actually stages one
- declare what the dream means for the dreamer's life

Prefer "the arrangement recalls…" / "the sequence resembles…" over conclusions about the dreamer.
Avoid generic invented titles such as:
- a journey of transformation
- descent and return
- death and rebirth
- a heroic trial
- ceremony of second birth
Do not automatically associate from a lone symbol:
- the sea with Poseidon or the unconscious
- descent with Persephone or the underworld
- a snake with transformation or rebirth
- darkness with Shadow
- a forest with initiation
- a journey with the Hero
- death with renewal
Personal and dream-specific meaning takes priority over collective symbolism.
An amplification must remain secondary to: the exact dream image; the dreamer's felt response; the image's action and context; the dreamer's personal associations, when available.
When no strong named parallel exists, return an empty array.

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
  "archetypes": {"canonical_label": string, "expression": string, "resonance": string, "evidence": string[]}[],
  "landscapes": string[],
  "affects": string[],
  "motifs": string[],
  "relational_dynamics": string[],
  "thresholds": string[],
  "central_conflicts": string[],
  "core_mode": "Core Tension" | "Core State" | "Core Shift" | "Core Restoration" | null,
  "amplifications": {"title": string, "tradition": string, "resonance": string, "difference": string, "evidence": string[]}[]
}

Return ONLY one valid JSON object, single-line, no extra text. Put display_distillation first and symbol_stances immediately after symbols:
{
  "display_distillation": {
    "essence_title": "guarded threshold",
    "essence_line": "The dream circles a wish to move toward contact while protecting something vulnerable.",
    "dominant_lens": "threshold",
    "visible_anchors": [{"label": "closed door", "type": "threshold", "salience": 5, "ui_meaning": "a protected edge between safety and contact"}],
    "main_tension": "contact vs protection",
    "dream_movement": "approaching",
    "movement_line": "Something moves toward contact without fully crossing."
  },
  "symbols": [...],
  "symbol_stances": [{"symbol": "mirror", "stance": "stressful attempt to prove"}],
  "archetypes": [{
    "canonical_label": "Shadow",
    "expression": "the watching figure outside the locked house",
    "resonance": "An unseen presence holds the edge between approach and entry without becoming an identity.",
    "evidence": ["someone watches from outside the locked house"]
  }],
  "landscapes": [...],
  "affects": [...],
  "motifs": [...],
  "relational_dynamics": [...],
  "thresholds": [...],
  "central_conflicts": [...],
  "core_mode": "Core Tension",
  "amplifications": [{
    "title": "Ariadne and the Labyrinth",
    "tradition": "Greek",
    "resonance": "The thread, the descent into branching corridors and the encounter with a waiting figure recall the Cretan labyrinth cycle.",
    "difference": "Here the waiting figure is fed and left waiting rather than defeated; no completed return is staged.",
    "evidence": ["descent through branching corridors", "thread-like guidance", "leaving milk for a waiting figure"]
  }]
}

If nothing fits an array field, use []. Ordinary brief dreams may keep amplifications: [] and archetypes: []. When converging structural evidence supports 1–2 archetypal echoes or one mythic configuration, return them — do not withhold them out of excessive caution. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.
`.trim();
}

/** Keep reflection context bounded so long Advanced reflections do not truncate extraction JSON. */
const MAX_EXTRACTION_REFLECTION_CHARS = 3200;

function trimForExtractionContext(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}\n\n[…truncated for extraction context]`;
}

export function buildDreamExtractionUserPrompt(params: {
  title?: string | null;
  date: string;
  content: string;
  finalInterpretation?: string | null;
}): string {
  const rawInterpretation = params.finalInterpretation?.trim() || '';
  const hasFinalInterpretation = Boolean(rawInterpretation);
  const interpretationContext = hasFinalInterpretation
    ? trimForExtractionContext(rawInterpretation, MAX_EXTRACTION_REFLECTION_CHARS)
    : '(none provided)';
  const catalogLead = hasFinalInterpretation
    ? 'Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation has been written'
    : 'Pre-catalog this dream into pattern metadata and immediate UI display distillation from the raw dream only';

  return `${catalogLead}: display_distillation, symbols, symbol_stances, archetypes, landscapes, affects, motifs, relational_dynamics, thresholds, central_conflicts, core_mode, and amplifications.

Title: ${params.title || 'Untitled'}
Date: ${params.date}

Dream:
${params.content}

${hasFinalInterpretation ? `Final interpretation:
${interpretationContext}
` : 'Final interpretation: (not provided; use raw dream only)\n'}
Return one JSON object matching the schema exactly. Put symbol_stances immediately after symbols.
display_distillation.visible_anchors must contain maximum 5 anchors, ideal 3.
symbol_stances must contain one entry per genuinely charged key symbol, maximum 5. Use [] if no symbol has clear charge.
Write user-facing string values (symbols, stances, landscapes, affects, motifs, relational_dynamics, thresholds, conflicts, archetype expression/resonance/evidence, amplification title/tradition/resonance/difference/evidence, display_distillation text) in the same primary language as the dream.
Keep enum keys, whitelisted archetype canonical_label values, mythic title, and tradition in English (or the established scholarly name of the myth).
Ground Dream Fabric fields (symbols, affects, landscapes, motifs, relational_dynamics, thresholds) in the dream text only.
Map Fabric fields compactly — do not re-narrate the dream. Affects are felt tones only (never images/sensory objects). Relational dynamics are pattern labels, not plot sentences. Thresholds and motifs stay short canonical phrases.
Treat Interpretive Echoes (central_conflicts, archetypes, amplifications/Mythic Echoes) as provisional.
For archetypes: return 0–2 objects {canonical_label, expression, resonance, evidence} when converging structural evidence supports them; otherwise []. Never return bare string tags. canonical_label must be classical whitelist; expression is dream-specific and secondary.
For amplifications: return 0–1 named mythic parallel {title, tradition, resonance, difference, evidence} when structural correspondence is strong; otherwise []. One tradition only; do not invent myths; empty array when unsure.
Do not withhold a clearly supported echo merely out of excessive caution.
Do not write a new interpretation. Do not make the display layer exhaustive. Catalog only what ${hasFinalInterpretation ? 'the dream text and final interpretation concretely support' : 'the dream text concretely supports'}.
If unsure for Fabric arrays, use []. For core_mode, choose the least distorted fit based on dominant final movement and affect, or null if no mode fits without distortion.`;
}

/** Bump when extraction pedagogy/schema contract changes — logged on every extract call. */
export const DREAM_EXTRACTION_PROMPT_VERSION = '2.6.0';

/** Shared sampling settings for dream_extraction across client and gateway. */
export const DREAM_EXTRACTION_TEMPERATURE = 0.25;
/** Output budget for full Fabric + display_distillation + optional rich echo objects. */
export const DREAM_EXTRACTION_TOKEN_LIMIT = 4200;
