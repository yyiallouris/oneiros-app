import {
  ARCHETYPE_RECOGNITION_CATALOG_VERSION,
  formatArchetypeRecognitionCatalogForPromptV2,
} from './catalogs/archetypeRecognitionCatalog.v2.ts';
import { buildDreamEvidenceSpanIndex } from './dreamEvidenceSpans.ts';
import {
  buildOutputLanguageLockBlock,
  resolveDreamOutputLanguage,
  type DreamOutputLanguage,
} from './dreamOutputLanguage.ts';
import { ARCHETYPE_RECOGNITION_SCHEMA_VERSION } from './schemas/archetypeRecognitionSchema.ts';

export const ARCHETYPE_RECOGNITION_PROMPT_ID = 'dream-archetype-recognition-v1.0.0' as const;
export const ARCHETYPE_RECOGNITION_PROMPT_VERSION = '1.0.0' as const;
export const ARCHETYPE_RECOGNITION_MODEL = 'gpt-5.4-mini-2026-03-17' as const;
export const ARCHETYPE_RECOGNITION_TEMPERATURE = 0 as const;
export const ARCHETYPE_RECOGNITION_TOKEN_LIMIT = 1400 as const;

const SYSTEM_CONTRACT = `ARCHETYPE RECOGNITION

Identify 0–2 archetypes from the closed catalog whose archetypal
quality is genuinely active in the dream.

Begin with the dream as a whole. Ask which archetypal quality
organizes its emotional, relational, or imaginal field.

An archetype may be expressed through action, relationship,
atmosphere, stillness, conflict, containment, order, renewal,
desire, loss, protection, or transformation.

Do not require drama, crisis, intensity, transformation, or a
changed outcome.

A typical carrier is not enough by itself. A partner, parent,
child, elder, profession, animal, journey, threshold, duplicate,
or death image does not automatically establish an archetype.

At the same time, do not ignore a clear archetypal quality merely
because it appears quietly or without conflict.

Read relational meaning from the complete scene rather than from
one relationship word in isolation.

For every selected archetype:
- name the specific archetypal quality active here
- describe how that quality is expressed in concrete dream images
- explain briefly how it organizes the dream
- cite only raw-dream evidence IDs

Choose the most precise archetype rather than every plausible one.
Return a second archetype only when it contributes a clearly
different organizing quality.

Return [] when no catalog archetypal quality is clearly active.`;

function buildResponseContract(targetLanguage: DreamOutputLanguage): string {
  return `RETURN JSON ONLY with this exact shape:
{
  "archetypes": [
    {
      "archetype_id": "closed enum id",
      "quality": "short phrase in ${targetLanguage.name}",
      "expression": "concrete dream expression in ${targetLanguage.name}",
      "resonance": "one natural sentence in ${targetLanguage.name}",
      "confidence": "high or medium",
      "evidence_ids": ["D1"]
    }
  ]
}

Constraints:
- archetypes max 2
- archetype_id must come from the closed catalog below
- quality must stay short and specific
- expression must stay concrete and image-near
- resonance must be one natural sentence
- confidence must be "high" or "medium"
- evidence_ids must use only the numbered raw-dream IDs exactly as given`;
}

export function estimateArchetypeRecognitionPromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4);
}

export function buildArchetypeRecognitionSystemPrompt(
  targetLanguage: DreamOutputLanguage
): string {
  return [
    SYSTEM_CONTRACT,
    '',
    buildOutputLanguageLockBlock(targetLanguage),
    '',
    `TASK METADATA
- prompt_id: ${ARCHETYPE_RECOGNITION_PROMPT_ID}
- prompt_version: ${ARCHETYPE_RECOGNITION_PROMPT_VERSION}
- response_schema_version: ${ARCHETYPE_RECOGNITION_SCHEMA_VERSION}
- recognition_catalog_version: ${ARCHETYPE_RECOGNITION_CATALOG_VERSION}`,
    '',
    buildResponseContract(targetLanguage),
    '',
    `CLOSED ARCHETYPE RECOGNITION CATALOG (${ARCHETYPE_RECOGNITION_CATALOG_VERSION})`,
    formatArchetypeRecognitionCatalogForPromptV2(),
  ].join('\n');
}

export function buildArchetypeRecognitionUserPrompt(params: {
  dreamText: string;
  targetLanguageHint?: string | null;
}): {
  prompt: string;
  targetLanguage: DreamOutputLanguage;
  formattedDream: string;
} {
  const targetLanguage = resolveDreamOutputLanguage(
    params.dreamText,
    params.targetLanguageHint ?? null
  );
  const evidenceIndex = buildDreamEvidenceSpanIndex(params.dreamText);
  const prompt = [
    `TARGET OUTPUT LANGUAGE: ${targetLanguage.name} (${targetLanguage.code})`,
    '',
    'Raw dream with numbered evidence spans:',
    evidenceIndex.formattedDream || '(empty dream)',
    '',
    'Return JSON only.',
  ].join('\n');
  return {
    prompt,
    targetLanguage,
    formattedDream: evidenceIndex.formattedDream,
  };
}
