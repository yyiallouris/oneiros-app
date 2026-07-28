import type { ArchetypalEcho } from './archetypalEchoes.ts';
import { getArchetypeRecognitionRecord } from './catalogs/archetypeRecognitionCatalog.v2.ts';
import {
  ARCHETYPE_RECOGNITION_CATALOG_VERSION,
  type ArchetypeRecognitionId,
} from './catalogs/archetypeRecognitionCatalog.v2.ts';
import type { ArchetypeRecognitionResponse } from './schemas/archetypeRecognitionSchema.ts';
import { resolveDreamEvidenceIds } from './dreamEvidenceSpans.ts';

export type ArchetypeRecognitionAuditRow = {
  archetype_id: ArchetypeRecognitionId;
  canonical_label: string;
  quality: string;
  expression: string;
  resonance: string;
  confidence: 'high' | 'medium';
  evidence_ids: string[];
  evidence: string[];
};

export function mapArchetypeRecognitionToArchetypalEchoes(
  response: ArchetypeRecognitionResponse,
  params: {
    dreamText: string;
    archetypeCatalogVersion?: string;
  }
): ArchetypalEcho[] {
  const version = params.archetypeCatalogVersion ?? ARCHETYPE_RECOGNITION_CATALOG_VERSION;
  const out: ArchetypalEcho[] = [];

  for (const item of response.archetypes) {
    const record = getArchetypeRecognitionRecord(item.archetype_id);
    if (!record) continue;
    const evidence = resolveDreamEvidenceIds(item.evidence_ids, params.dreamText, {
      minCount: 1,
      maxCount: 6,
    });
    if (!evidence.ok) continue;
    out.push({
      archetype_id: item.archetype_id,
      archetype_catalog_version: version,
      canonical_label: record.label,
      expression: item.expression.trim(),
      resonance: item.resonance.trim(),
      confidence: item.confidence,
      evidence: evidence.evidence,
      evidence_ids: evidence.evidence_ids,
    });
  }

  return out;
}

export function buildArchetypeRecognitionAuditRows(
  response: ArchetypeRecognitionResponse,
  params: { dreamText: string }
): ArchetypeRecognitionAuditRow[] {
  return response.archetypes.flatMap((item) => {
    const record = getArchetypeRecognitionRecord(item.archetype_id);
    if (!record) return [];
    const evidence = resolveDreamEvidenceIds(item.evidence_ids, params.dreamText, {
      minCount: 1,
      maxCount: 6,
    });
    if (!evidence.ok) return [];
    return [
      {
        archetype_id: item.archetype_id,
        canonical_label: record.label,
        quality: item.quality.trim(),
        expression: item.expression.trim(),
        resonance: item.resonance.trim(),
        confidence: item.confidence,
        evidence_ids: evidence.evidence_ids,
        evidence: evidence.evidence,
      },
    ];
  });
}
