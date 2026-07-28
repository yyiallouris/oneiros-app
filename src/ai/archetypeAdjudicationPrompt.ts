import {
  ARCHETYPE_BOUNDARY_CATALOG_VERSION,
  formatArchetypeBoundaryRecordsForPrompt,
} from './catalogs/archetypeBoundaryCatalog.v1.ts';
import { getArchetypeRecognitionRecord } from './catalogs/archetypeRecognitionCatalog.v2.ts';
import { buildDreamEvidenceSpanIndex } from './dreamEvidenceSpans.ts';
import {
  buildOutputLanguageLockBlock,
  resolveDreamOutputLanguage,
  type DreamOutputLanguage,
} from './dreamOutputLanguage.ts';
import {
  ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
  type ArchetypeAdjudicationResponse,
} from './schemas/archetypeAdjudicationSchema.ts';
import type { ArchetypeRecognitionResponse } from './schemas/archetypeRecognitionSchema.ts';

export const ARCHETYPE_ADJUDICATION_PROMPT_ID = 'dream-archetype-adjudication-v1.0.0' as const;
export const ARCHETYPE_ADJUDICATION_PROMPT_VERSION = '1.0.0' as const;
export const ARCHETYPE_ADJUDICATION_MODEL = 'gpt-5.4-mini-2026-03-17' as const;
export const ARCHETYPE_ADJUDICATION_TEMPERATURE = 0 as const;
export const ARCHETYPE_ADJUDICATION_TOKEN_LIMIT = 1200 as const;

const SYSTEM_CONTRACT = `ARCHETYPE CANDIDATE ADJUDICATION

The previous step intentionally proposed broad archetypal candidates.
Decide which of those candidates are genuinely enacted in the dream.

Do not discover or add new archetypes.

For each candidate, use its decisive question and boundaries to distinguish:
- the specific archetypal function
from
- an ordinary carrier, setting, mood, relationship, danger, or activity.

Accept a candidate only when raw-dream evidence establishes the distinctive
archetypal quality described by its boundary record.

Reject a candidate when the evidence supports only:
- a typical carrier
- generic warmth or companionship
- generic transit or a threshold setting
- generic danger, fear, darkness, or pursuit
- public visibility or ceremony
- surface resemblance to the archetype

Do not require drama or transformation when the candidate's distinctive
quality can be expressed quietly.

For every candidate:
1. answer the candidate's decisive question
2. identify the concrete distinguishing feature, if present
3. cite only raw-dream evidence IDs
4. accept or reject

Return at most two accepted archetypes.`;

function buildResponseContract(targetLanguage: DreamOutputLanguage): string {
  return `RETURN JSON ONLY with this exact shape:
{
  "decisions": [
    {
      "archetype_id": "closed enum id",
      "decision": "accept or reject",
      "decisive_feature": "short phrase in ${targetLanguage.name} or null",
      "reason": "one concise sentence in ${targetLanguage.name}",
      "evidence_ids": ["D1"]
    }
  ],
  "accepted_archetype_ids": ["closed enum id"]
}

Constraints:
- decisions max 2
- accepted_archetype_ids max 2
- archetype_id must match a discovery candidate exactly
- do not add new archetypes
- decisive_feature must be null for reject when no distinguishing feature is present
- reason must be one concise sentence
- evidence_ids must use only the numbered raw-dream IDs exactly as given`;
}

export function estimateArchetypeAdjudicationPromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4);
}

export function buildArchetypeAdjudicationSystemPrompt(
  targetLanguage: DreamOutputLanguage
): string {
  return [
    SYSTEM_CONTRACT,
    '',
    buildOutputLanguageLockBlock(targetLanguage),
    '',
    `TASK METADATA
- prompt_id: ${ARCHETYPE_ADJUDICATION_PROMPT_ID}
- prompt_version: ${ARCHETYPE_ADJUDICATION_PROMPT_VERSION}
- response_schema_version: ${ARCHETYPE_ADJUDICATION_SCHEMA_VERSION}
- boundary_catalog_version: ${ARCHETYPE_BOUNDARY_CATALOG_VERSION}`,
    '',
    buildResponseContract(targetLanguage),
  ].join('\n');
}

function formatDiscoveryCandidates(discoveryResponse: ArchetypeRecognitionResponse): string {
  if (discoveryResponse.archetypes.length === 0) return '[]';
  return discoveryResponse.archetypes
    .map((candidate) => {
      const record = getArchetypeRecognitionRecord(candidate.archetype_id);
      return [
        `id=${candidate.archetype_id} label:${record?.label ?? candidate.archetype_id}`,
        `  quality: ${candidate.quality}`,
        `  expression: ${candidate.expression}`,
        `  resonance: ${candidate.resonance}`,
        `  confidence: ${candidate.confidence}`,
        `  evidence_ids: ${candidate.evidence_ids.join(', ')}`,
      ].join('\n');
    })
    .join('\n');
}

export function buildArchetypeAdjudicationUserPrompt(params: {
  dreamText: string;
  discoveryResponse: ArchetypeRecognitionResponse;
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
  const candidateIds = params.discoveryResponse.archetypes.map((item) => item.archetype_id);
  const prompt = [
    `TARGET OUTPUT LANGUAGE: ${targetLanguage.name} (${targetLanguage.code})`,
    '',
    'Raw dream with numbered evidence spans:',
    evidenceIndex.formattedDream || '(empty dream)',
    '',
    'Discovery candidates:',
    formatDiscoveryCandidates(params.discoveryResponse),
    '',
    `Candidate-specific boundary records (${ARCHETYPE_BOUNDARY_CATALOG_VERSION}):`,
    formatArchetypeBoundaryRecordsForPrompt(candidateIds),
    '',
    'Return JSON only.',
  ].join('\n');
  return {
    prompt,
    targetLanguage,
    formattedDream: evidenceIndex.formattedDream,
  };
}

export function acceptedArchetypeIdsFromAdjudication(
  response: ArchetypeAdjudicationResponse
): string[] {
  return response.accepted_archetype_ids;
}
