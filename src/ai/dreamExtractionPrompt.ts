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

Use the dream as ground truth. If a final interpretation is provided, treat it as supporting context only.
Do not invent symbolic material not present in the dream or interpretation.

Rules:
- Map only what is clearly present or strongly implied by concrete dream language.
- Be restrained and economical. Leave arrays empty when the dream does not clearly support a field.
- Return every field value in English only, regardless of the dream language.
- Prefer fewer high-confidence items over many weak ones.
- Prefer concrete dream language over abstract psychological labels.
- Do not infer archetypes unless strongly staged.
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
- essence_title should be 3–7 words.
- essence_line should be one sentence.
- movement_line should be one sentence or null.
- main_tension should be compact, like "contact vs protection", or null.

Fields:
- display_distillation: a minimal user-facing summary for the DreamDetail screen. It is not a metadata report.
- symbols: 1–5 concrete images, figures, animals, places, objects, or forces. Never emotions. Use canonical singular form with no article.
- symbol_stances: 1–5 items, only for genuinely charged symbols. Add one entry per charged key symbol, maximum 5. If no symbol carries clear charge, use []. Each item is { "symbol": "exact phrase from symbols", "stance": "2–8 words" }. Capture how the symbol is experienced in this dream: e.g. "playful", "blocking, alarming", "stressful attempt to prove", "warmly permitting closeness". Use specific lived tone, not generic positive/negative labels.
- archetypes: optional. Include only when clearly active. Use only: ${ARCHETYPE_WHITELIST.join(', ')}. Split combined labels into separate entries.
- landscapes: 1–3 main settings or places in canonical form.
- affects: 2–4 dominant felt tones or bodily energies, not diagnoses.
- motifs: 2–4 short symbolic forms or situations describing the dream's shape, not its interpretation.
- relational_dynamics: 1–3 short phrases about regulation of pace, permission, urgency, merging, or distance.
- thresholds: 0–3 moments of transition, departure, arrival, sleep, work, crossing, or change of ground.
- central_conflicts: 0–2 concrete conflicts or opposing pressures clearly staged by the dream.
  Use "X vs Y" only when both sides are supported by actual dream images, figures, actions, places, or bodily tones.
  Prefer image-near phrasing over abstract psychology.
  Good: "locked room vs open street", "wanting to enter vs being watched", "warm table vs silent exclusion", "sleeping body vs demand to perform".
  Avoid generic pairs like "fear vs desire", "control vs surrender", or "autonomy vs belonging" unless the dream concretely stages both sides.
  Use [] if none is clearly staged.
- core_mode: exactly one of "Core Tension", "Core State", "Core Shift", "Core Restoration", or null.
- amplifications: 0–2 brief items for symbols with unmistakable embodied or numinous charge. Do not use mythological amplification unless it directly clarifies the dream image.

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
  "archetypes": string[],
  "landscapes": string[],
  "affects": string[],
  "motifs": string[],
  "relational_dynamics": string[],
  "thresholds": string[],
  "central_conflicts": string[],
  "core_mode": "Core Tension" | "Core State" | "Core Shift" | "Core Restoration" | null,
  "amplifications": string[]
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
  "archetypes": [...],
  "landscapes": [...],
  "affects": [...],
  "motifs": [...],
  "relational_dynamics": [...],
  "thresholds": [...],
  "central_conflicts": [...],
  "core_mode": "Core Tension",
  "amplifications": [...]
}

If nothing fits an array field, use []. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.
`.trim();
}

export function buildDreamExtractionUserPrompt(params: {
  title?: string | null;
  date: string;
  content: string;
  finalInterpretation?: string | null;
}): string {
  const hasFinalInterpretation = Boolean(params.finalInterpretation?.trim());
  const interpretationContext = params.finalInterpretation?.trim() || '(none provided)';
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
Do not write a new interpretation. Do not make the display layer exhaustive. Catalog only what ${hasFinalInterpretation ? 'the dream text and final interpretation concretely support' : 'the dream text concretely supports'}.
If unsure for arrays, use []. For core_mode, choose the least distorted fit based on dominant final movement and affect, or null if no mode fits without distortion.`;
}

/** Shared sampling settings for dream_extraction across client and gateway. */
export const DREAM_EXTRACTION_TEMPERATURE = 0.25;
export const DREAM_EXTRACTION_TOKEN_LIMIT = 2600;
