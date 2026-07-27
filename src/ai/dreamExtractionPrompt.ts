import { formatArchetypeCatalogForPromptV1 } from './catalogs/archetypeCatalog.v1.ts';
import {
  MYTHIC_CATALOG_VERSION,
  MYTHIC_PROMPT_INDEX,
} from './catalogs/mythicPromptIndex.ts';
import { formatClosedMechanismTagsForPrompt } from './archetypeMechanisms.ts';
import { buildDreamEvidenceSpanIndex } from './dreamEvidenceSpans.ts';
import {
  buildOutputLanguageLockBlock,
  resolveDreamOutputLanguage,
  type DreamOutputLanguage,
} from './dreamOutputLanguage.ts';

/**
 * Canonical dream metadata extraction contract.
 * Used by both client (`src/services/ai.ts`) and gateway (`billing-ai.ts`).
 * Keep DreamDetail / Insights field semantics here — do not fork thin stubs elsewhere.
 *
 * Fabric / display / conflicts pedagogy stays on the proven contract.
 * Interpretive Echoes (v4.1.9-M1): Mother/Father polarity-neutral catalog 1.7.0 + prior E.1 language gate (schema 13).
 * Prior Hero layer frozen at D.1; myth layer C.1.1; Patch E activation/catalog frozen.
 * Specs: docs/ONEIROS_V4_1_3_POST_PATCH_A_DEV_BRIEF.md,
 *         docs/ONEIROS_V4_1_2_TARGETED_FIX_DEV_BRIEF.md
 */
export function buildDreamExtractionSystemPrompt(): string {
  const archetypeCatalogBlock = formatArchetypeCatalogForPromptV1();
  const mechanismTagsBlock = formatClosedMechanismTagsForPrompt();
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

They must remain tentative and must never be presented as the dream's fixed meaning.

For archetypes and amplifications (EVIDENCE FIREWALL):
Select labels, catalog_id, confidence, and evidence from the RAW DREAM only.
For those decisions, treat the reflection as absent.
After selections are fixed, the reflection may help only with the wording of
archetype resonance, mythic resonance, and mythic divergence.
It may not introduce, remove, strengthen, weaken, rename, or provide evidence for any selection.

central_conflicts and display_distillation may use the dream plus reflection as supporting context.
Use the dream as ground truth for Dream Fabric.
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
- Avoid labels like Shadow, Anima, Mother, Father, Puer, Senex, or Self in display labels unless strongly staged.
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

INTERPRETIVE ECHOES

Return:
- archetypes: 0–2
- amplifications: 0–1

These are optional resonances, not a second interpretation.

EVIDENCE FIREWALL

Select labels, catalog_id, confidence, and evidence from the RAW DREAM only.
For these decisions, treat the reflection as absent.

After the selections are fixed, the reflection may help only with the wording of:
- archetype resonance
- mythic resonance
- mythic divergence

It may not introduce, remove, strengthen, weaken, rename, or provide evidence for any selection.

ARCHETYPAL ECHOES

Return 0–2 optional archetypal functions from the supplied closed catalog.

Use only the raw dream for selection, mechanism tags, and evidence_ids.
Treat the reflection as absent until selections are final.

Select an archetype_id only when:
- its catalog function is enacted, not merely suggested by appearance or convention;
- the required mechanism is visible in the dream;
- ordinary relational or situational language would be less precise.

GLOBAL ARCHETYPE ACTIVATION

Select an archetypal echo when its function is central, sustained, or image-bearing in the dream.

A dramatic conflict, completed transformation, boon, victory, or changed outcome is not required unless that specific archetype structurally depends on such a sequence.

When an archetypal resonance is real but gentle, return it at medium confidence rather than omitting it.

Do not select an archetype merely because its typical carrier appears.
A child, elder, lover-figure, job, duplicate, death image, journey, or threshold is not sufficient without the corresponding archetypal function.

Family calibration:
A. Relational / mediating (Lover, Anima, Animus, Mother, Father, Wise Old Man, Wise Old Woman, relational Guide):
   a sustained relational field, meaningful mediation, mutual orientation, holding, paternal claim, devotion, or psychic reorientation may be sufficient.
   Do not require crisis, climax, sacrifice, victory, or world-changing outcome.
   For Mother and Father, put polarity (nurturing/devouring, protective/tyrannical, absent, etc.) in expression — do not invent separate polarity ids.
B. Transformational (Hero, Death–Rebirth, Trickster, Sacred Marriage, Self):
   keep structural sequence requirements; do not weaken existing Hero gates.
C. Identity / boundary (Persona, Double, Shadow, Orphan):
   tighten carrier-vs-function — occupation, resemblance, loss, or danger alone are insufficient without the archetype's specific structure (see catalog insufficientWhen).

expression must describe the enacted archetypal function or movement in the dream.
Do not use expression to label a character as the archetype (e.g. avoid
"the giant is the Trickster"); describe what the function does instead.

Prefer the action or process that changes what can happen next over a visually
striking figure.

Return [] when no catalog function is sufficiently enacted.
Never return Ego. Never invent an id.
Never infer from age, gender, occupation, authority, darkness, beauty, danger,
or familiar symbolism alone.

Archetypal Echo and Mythic Echo are independent pipelines:
- selecting a myth must not force an archetype
- selecting an archetype must not force a myth

CLOSED MECHANISM TAGS (use only these values in mechanism_tags):
${mechanismTagsBlock}

ONEIROS ARCHETYPE CATALOG (select exact id= values for archetype_id; server resolves display label):
${archetypeCatalogBlock}


MYTHIC ECHO — CLOSED CATALOG

Select 0–1 mythic narrative.

Use the RAW DREAM only for selection and evidence_ids.
Treat the reflection as absent until selection, confidence, and evidence_ids are fixed.

You may select only catalog ids shown as id= inside CLOSED_MYTH_CATALOG.
Never invent or rewrite an ID.
Never output a myth title, tradition, source, generic motif, or free-text candidate.

Each catalog record shows:
- sig: complete compact causal signature
- roles: defining relational roles (when present)
- req: required feature groups (pipe = OR within group, semicolon = AND across groups)
- anti: nearest false-match exclusions (when present)

First derive the dream's ordered causal sequence and functional roles.
Then compare catalog records by sig, roles, req groups, and anti exclusions.

A candidate qualifies only when:
- its defining configuration remains recognizable in the dream sequence
- no anti exclusion describes the dream's actual configuration
- divergence modifies a real match rather than excusing missing core structure
- evidence_ids cite only [Dn] spans from the numbered dream body

Return [] when no supplied record qualifies.
A false Mythic Echo is worse than no result.
Do not select from a single object, creature, atmosphere, setting, or broad theme.

The reflection may help only with localized resonance and divergence
wording after catalog_id, confidence, and evidence_ids are final.

A myth name, cultural parallel, or symbolic claim appearing only in the
reflection must be ignored for selection.

<CLOSED_MYTH_CATALOG version="${MYTHIC_CATALOG_VERSION}">
${MYTHIC_PROMPT_INDEX}
</CLOSED_MYTH_CATALOG>


OUTPUT

Archetype object:
{
  "archetype_id": "exact id from ONEIROS ARCHETYPE CATALOG",
  "expression": "concrete dream carrier",
  "mechanism_tags": ["closed tags from CLOSED MECHANISM TAGS"],
  "evidence_ids": ["D1", "D2"],
  "resonance": "one sentence, 18–32 words, maximum 40",
  "confidence": "high" | "medium"
}

Mythic object (model-facing; never include title/tradition/source_type):
{
  "catalog_id": "exact id from CLOSED_MYTH_CATALOG",
  "resonance": "one concise sentence naming the shared sequence and roles",
  "divergence": "one concise sentence naming how the dream changes the tale",
  "evidence_ids": ["D3", "D5"],
  "confidence": "high" | "medium"
}

Use the dream's primary language for expression, resonance, and divergence.
For Mythic Echo, return evidence_ids only (1–6 ids from the numbered dream spans). Never invent free-text myth evidence.
Do not invent catalog ids. Do not output title or tradition.
Do not say the dream reenacts, proves, or means the myth.

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
  "archetypes": {"archetype_id": string, "expression": string, "mechanism_tags": string[], "evidence_ids": string[], "resonance": string, "confidence": "high" | "medium"}[],
  "landscapes": string[],
  "affects": string[],
  "motifs": string[],
  "relational_dynamics": string[],
  "thresholds": string[],
  "central_conflicts": string[],
  "core_mode": "Core Tension" | "Core State" | "Core Shift" | "Core Restoration" | null,
  "amplifications": {"catalog_id": string, "resonance": string, "divergence": string, "evidence_ids": string[], "confidence": "high" | "medium", "evaluation": object}[]
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

If nothing fits an array field, use []. Ordinary brief dreams may keep amplifications: [] and archetypes: []. For Mythic Echo, return only a CLOSED_MYTH_CATALOG id or []. Silence is preferable to a forced id. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.
`.trim();
}

/** Keep reflection context bounded so long Advanced reflections do not truncate extraction JSON. */
const MAX_EXTRACTION_REFLECTION_CHARS = 3200;

function trimForExtractionContext(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}\n\n[…truncated for extraction context]`;
}

/** Additive debug suffix only — must audit the decision, not force candidates or numeric scores. */
export const DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX = `

DEBUG INTERPRETIVE ECHOES (internal only — not user-facing):

CRITICAL: The same single JSON object MUST include a top-level key "interpretive_diagnostics".
This key is allowed in addition to the schema contract above. Do not omit it.

Finalize production 'archetypes' and 'amplifications' first.
Then add a compact audit only:

"interpretive_diagnostics": {
  "selection_notes": {
    "archetype_reasons": ["why each selected label was earned, or why []"],
    "mythic_reason": "why the selected catalog_id was earned, or why []",
    "near_misses": ["brief rejected alternatives, if any"]
  }
}

Rules:
- Do not invent legacy beat maps, role–verb chains, decisive spans, or myth recall sheets.
- Do not use numerical self-scores.
- Audit only after production selection is fixed.
`.trimStart();

export function buildDreamExtractionUserPrompt(params: {
  title?: string | null;
  date: string;
  content: string;
  finalInterpretation?: string | null;
  debugInterpretiveEchoes?: boolean;
  /** ISO-ish hint such as `en` or `el`; dream text wins when clearly different. */
  dreamLanguage?: string | null;
  /** Optional pre-resolved target language for benchmark parity checks. */
  targetOutputLanguage?: DreamOutputLanguage;
}): string {
  const rawInterpretation = params.finalInterpretation?.trim() || '';
  const hasFinalInterpretation = Boolean(rawInterpretation);
  const interpretationContext = hasFinalInterpretation
    ? trimForExtractionContext(rawInterpretation, MAX_EXTRACTION_REFLECTION_CHARS)
    : '(none provided)';
  const catalogLead = hasFinalInterpretation
    ? 'Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation'
    : 'Catalog this dream into pattern metadata and immediate UI display distillation from the raw dream only';

  const spanIndex = buildDreamEvidenceSpanIndex(params.content);
  const dreamBody = spanIndex.formattedDream || params.content;
  const targetOutputLanguage =
    params.targetOutputLanguage ??
    resolveDreamOutputLanguage(params.content, params.dreamLanguage ?? null);
  const languageLock = buildOutputLanguageLockBlock(targetOutputLanguage);

  const base = `${languageLock}

${catalogLead}.

Title: ${params.title || 'Untitled'}
Date: ${params.date}

Dream (evidence spans — for Mythic Echo cite only these IDs in evidence_ids):
${dreamBody}

${hasFinalInterpretation ? `Final interpretation:\n${interpretationContext}\n` : 'Final interpretation: (not provided)\n'}
Return one JSON object matching the schema.
Ground Dream Fabric in the dream text only. Treat Interpretive Echoes as provisional.
For Interpretive Echoes, use the raw dream only for selection and evidence_ids.
Treat the reflection as absent until archetype_id and myth catalog_id are fixed.
Return 0–2 exact archetype_id values with mechanism_tags when gated, and
0–1 CLOSED_MYTH_CATALOG id with evidence_ids (never free-text myth evidence; never a free-text title), or [] when not earned.
Keep archetype and myth selections independent.
Do not write a new interpretation.`;

  if (!params.debugInterpretiveEchoes) return base;
  return `${base}${DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX}`;
}

/** Stable prompt architecture id for re-extraction tracking. */
export const DREAM_EXTRACTION_PROMPT_ID = 'dream-field-map-interpretive-v4.1.9-M1';
/** Closed Mythic catalog V2 index; namespace enums + integrity-only myth validation. */
export const DREAM_EXTRACTION_SCHEMA_VERSION = 13;
/** Bump when extraction pedagogy/schema contract changes — logged on every extract call. */
export const DREAM_EXTRACTION_PROMPT_VERSION = '4.1.9-M1';

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
export const DREAM_EXTRACTION_TEMPERATURE = 0;
/** Output budget for full Fabric + display_distillation + optional rich echo objects. */
export const DREAM_EXTRACTION_TOKEN_LIMIT = 4200;
