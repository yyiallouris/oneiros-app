import { z } from 'zod';
import {
  getArchetypeRecognitionCatalogIds,
  getArchetypeRecognitionRecord,
  isArchetypeRecognitionId,
  type ArchetypeRecognitionId,
} from '../catalogs/archetypeRecognitionCatalog.v2.ts';
import {
  buildDreamEvidenceSpanIndex,
  normalizeDreamEvidenceIdList,
  resolveDreamEvidenceIds,
} from '../dreamEvidenceSpans.ts';
import { resolveDreamOutputLanguage, type DreamOutputLanguage } from '../dreamOutputLanguage.ts';

export const ARCHETYPE_RECOGNITION_SCHEMA_VERSION = '1' as const;

export type ArchetypeRecognitionConfidence = 'high' | 'medium';

export type ArchetypeRecognitionItem = {
  archetype_id: ArchetypeRecognitionId;
  quality: string;
  expression: string;
  resonance: string;
  confidence: ArchetypeRecognitionConfidence;
  evidence_ids: string[];
};

export type ArchetypeRecognitionResponse = {
  archetypes: ArchetypeRecognitionItem[];
};

const archetypeRecognitionIdSchema = z.custom<ArchetypeRecognitionId>(
  (value) => isArchetypeRecognitionId(value),
  'must be a valid archetype recognition id'
);

const archetypeRecognitionItemSchema = z.object({
  archetype_id: archetypeRecognitionIdSchema,
  quality: z.string().min(1),
  expression: z.string().min(1),
  resonance: z.string().min(1),
  confidence: z.enum(['high', 'medium']),
  evidence_ids: z.array(z.string().regex(/^D\d+$/)).min(1).max(6),
});

const archetypeRecognitionArraySchema = z
  .array(archetypeRecognitionItemSchema)
  .max(2)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (!seen.has(item.archetype_id)) {
        seen.add(item.archetype_id);
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'archetype_id'],
        message: `duplicate archetype_id: ${item.archetype_id}`,
      });
    });
  });

export const archetypeRecognitionSchema = z.object({
  archetypes: archetypeRecognitionArraySchema,
});

export type ArchetypeRecognitionValidationIssue =
  | 'invalid_json'
  | 'schema_invalid'
  | 'duplicate_archetype_id'
  | 'invalid_evidence_ids'
  | 'language_validation_failed';

export type ArchetypeRecognitionValidationResult =
  | {
      ok: true;
      data: ArchetypeRecognitionResponse;
      normalizedContent: string;
      targetLanguage: DreamOutputLanguage;
      checkedFieldCount: number;
    }
  | {
      ok: false;
      issues: ArchetypeRecognitionValidationIssue[];
      errors: string[];
      targetLanguage: DreamOutputLanguage;
      checkedFieldCount: number;
    };

export type ArchetypeRecognitionResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function containsGreekLetters(text: string): boolean {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/u.test(text);
}

function containsLatinLetters(text: string): boolean {
  return /[A-Za-z]/.test(text);
}

function looksLikeTargetLanguage(text: string, target: DreamOutputLanguage): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (target.code === 'el') {
    if (trimmed.length <= 8) return containsGreekLetters(trimmed) || !containsLatinLetters(trimmed);
    return containsGreekLetters(trimmed);
  }
  if (!containsGreekLetters(trimmed)) return true;
  return !containsLatinLetters(trimmed) ? false : false;
}

function collectRecognitionTextFields(parsed: ArchetypeRecognitionResponse): string[] {
  return parsed.archetypes.flatMap((item) => [item.quality, item.expression, item.resonance]);
}

function coerceRecognitionItem(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const row = raw as Record<string, unknown>;
  return {
    archetype_id:
      typeof row.archetype_id === 'string'
        ? row.archetype_id.trim()
        : typeof row.id === 'string'
          ? row.id.trim()
          : row.archetype_id,
    quality: normalizeString(row.quality),
    expression: normalizeString(row.expression),
    resonance: normalizeString(row.resonance),
    confidence:
      typeof row.confidence === 'string' ? row.confidence.trim().toLowerCase() : row.confidence,
    evidence_ids: normalizeDreamEvidenceIdList(row.evidence_ids, 6),
  };
}

export function coerceArchetypeRecognitionResponse(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const row = raw as Record<string, unknown>;
  return {
    archetypes: Array.isArray(row.archetypes) ? row.archetypes.map(coerceRecognitionItem) : [],
  };
}

export function buildArchetypeRecognitionJsonSchemaObject(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      archetypes: {
        type: 'array',
        maxItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            archetype_id: { type: 'string', enum: getArchetypeRecognitionCatalogIds() },
            quality: { type: 'string' },
            expression: { type: 'string' },
            resonance: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium'] },
            evidence_ids: {
              type: 'array',
              minItems: 1,
              maxItems: 6,
              items: { type: 'string', pattern: '^D\\d+$' },
            },
          },
          required: [
            'archetype_id',
            'quality',
            'expression',
            'resonance',
            'confidence',
            'evidence_ids',
          ],
        },
      },
    },
    required: ['archetypes'],
  };
}

export function buildArchetypeRecognitionResponseFormat(): ArchetypeRecognitionResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'dream_archetype_recognition_v1',
      strict: false,
      schema: buildArchetypeRecognitionJsonSchemaObject(),
    },
  };
}

export function parseArchetypeRecognitionJson(content: string):
  | { ok: true; value: unknown }
  | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(content) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'invalid_json',
    };
  }
}

export function validateArchetypeRecognitionResponse(
  content: string,
  params: {
    dreamText?: string;
    targetLanguageHint?: string | null;
    enforceLanguage?: boolean;
  } = {}
): ArchetypeRecognitionValidationResult {
  const targetLanguage = resolveDreamOutputLanguage(
    params.dreamText ?? '',
    params.targetLanguageHint ?? null
  );
  const parsed = parseArchetypeRecognitionJson(content);
  if (!parsed.ok) {
    return {
      ok: false,
      issues: ['invalid_json'],
      errors: [parsed.error],
      targetLanguage,
      checkedFieldCount: 0,
    };
  }

  const coerced = coerceArchetypeRecognitionResponse(parsed.value);
  const result = archetypeRecognitionSchema.safeParse(coerced);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    });
    const duplicateIssue = errors.some((error) => error.includes('duplicate archetype_id'));
    return {
      ok: false,
      issues: duplicateIssue ? ['schema_invalid', 'duplicate_archetype_id'] : ['schema_invalid'],
      errors,
      targetLanguage,
      checkedFieldCount: 0,
    };
  }

  if (params.dreamText) {
    for (const item of result.data.archetypes) {
      const evidence = resolveDreamEvidenceIds(item.evidence_ids, params.dreamText, {
        minCount: 1,
        maxCount: 6,
      });
      if (!evidence.ok) {
        return {
          ok: false,
          issues: ['invalid_evidence_ids'],
          errors: [`${item.archetype_id}: ${evidence.reason}`],
          targetLanguage,
          checkedFieldCount: 0,
        };
      }
    }
  }

  const checkedFields = collectRecognitionTextFields(result.data);
  if (params.enforceLanguage !== false) {
    const languageMismatch = checkedFields.find(
      (value) => !looksLikeTargetLanguage(value, targetLanguage)
    );
    if (languageMismatch) {
      return {
        ok: false,
        issues: ['language_validation_failed'],
        errors: [`field does not match target language ${targetLanguage.code}: ${languageMismatch}`],
        targetLanguage,
        checkedFieldCount: checkedFields.length,
      };
    }
  }

  return {
    ok: true,
    data: result.data,
    normalizedContent: JSON.stringify(result.data),
    targetLanguage,
    checkedFieldCount: checkedFields.length,
  };
}

export function buildRecognitionEvidencePreview(dreamText: string): string[] {
  return buildDreamEvidenceSpanIndex(dreamText).spans.map((span) => `[${span.id}] ${span.text}`);
}

export function getRecognitionCanonicalLabel(archetypeId: ArchetypeRecognitionId): string {
  return getArchetypeRecognitionRecord(archetypeId)?.label ?? archetypeId;
}
