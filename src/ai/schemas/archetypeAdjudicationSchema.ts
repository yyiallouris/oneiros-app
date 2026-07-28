import { z } from 'zod';
import {
  getArchetypeRecognitionCatalogIds,
  isArchetypeRecognitionId,
  type ArchetypeRecognitionId,
} from '../catalogs/archetypeRecognitionCatalog.v2.ts';
import { normalizeDreamEvidenceIdList, resolveDreamEvidenceIds } from '../dreamEvidenceSpans.ts';
import { resolveDreamOutputLanguage, type DreamOutputLanguage } from '../dreamOutputLanguage.ts';

export const ARCHETYPE_ADJUDICATION_SCHEMA_VERSION = '1' as const;

export type ArchetypeAdjudicationDecisionValue = 'accept' | 'reject';

export type ArchetypeAdjudicationDecision = {
  archetype_id: ArchetypeRecognitionId;
  decision: ArchetypeAdjudicationDecisionValue;
  decisive_feature: string | null;
  reason: string;
  evidence_ids: string[];
};

export type ArchetypeAdjudicationResponse = {
  decisions: ArchetypeAdjudicationDecision[];
  accepted_archetype_ids: ArchetypeRecognitionId[];
};

const archetypeRecognitionIdSchema = z.custom<ArchetypeRecognitionId>(
  (value) => isArchetypeRecognitionId(value),
  'must be a valid archetype recognition id'
);

const adjudicationDecisionSchema = z.object({
  archetype_id: archetypeRecognitionIdSchema,
  decision: z.enum(['accept', 'reject']),
  decisive_feature: z.union([z.string().min(1), z.null()]),
  reason: z.string().min(1),
  evidence_ids: z.array(z.string().regex(/^D\d+$/)).min(1).max(6),
});

const adjudicationDecisionsSchema = z
  .array(adjudicationDecisionSchema)
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

const acceptedArchetypeIdsSchema = z
  .array(archetypeRecognitionIdSchema)
  .max(2)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (!seen.has(item)) {
        seen.add(item);
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index],
        message: `duplicate accepted_archetype_id: ${item}`,
      });
    });
  });

export const archetypeAdjudicationSchema = z
  .object({
    decisions: adjudicationDecisionsSchema,
    accepted_archetype_ids: acceptedArchetypeIdsSchema,
  })
  .superRefine((value, ctx) => {
    const acceptedIds = new Set(value.accepted_archetype_ids);
    for (const [index, item] of value.decisions.entries()) {
      if (item.decision === 'accept' && !item.decisive_feature) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['decisions', index, 'decisive_feature'],
          message: 'accepted decisions require decisive_feature',
        });
      }
      if (item.decision === 'accept' && !acceptedIds.has(item.archetype_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accepted_archetype_ids'],
          message: `accepted_archetype_ids missing accepted decision: ${item.archetype_id}`,
        });
      }
      if (item.decision === 'reject' && acceptedIds.has(item.archetype_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accepted_archetype_ids'],
          message: `accepted_archetype_ids includes rejected id: ${item.archetype_id}`,
        });
      }
    }
    const decisionIds = new Set(value.decisions.map((item) => item.archetype_id));
    for (const archetypeId of acceptedIds) {
      if (!decisionIds.has(archetypeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accepted_archetype_ids'],
          message: `accepted_archetype_ids includes undecided id: ${archetypeId}`,
        });
      }
    }
  });

export type ArchetypeAdjudicationValidationIssue =
  | 'invalid_json'
  | 'schema_invalid'
  | 'duplicate_archetype_id'
  | 'invalid_evidence_ids'
  | 'language_validation_failed'
  | 'accepted_ids_mismatch';

export type ArchetypeAdjudicationValidationResult =
  | {
      ok: true;
      data: ArchetypeAdjudicationResponse;
      normalizedContent: string;
      targetLanguage: DreamOutputLanguage;
      checkedFieldCount: number;
    }
  | {
      ok: false;
      issues: ArchetypeAdjudicationValidationIssue[];
      errors: string[];
      targetLanguage: DreamOutputLanguage;
      checkedFieldCount: number;
    };

export type ArchetypeAdjudicationResponseFormat = {
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

function collectAdjudicationTextFields(parsed: ArchetypeAdjudicationResponse): string[] {
  return parsed.decisions.flatMap((item) =>
    item.decisive_feature ? [item.decisive_feature, item.reason] : [item.reason]
  );
}

function coerceAdjudicationDecision(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const row = raw as Record<string, unknown>;
  const decisiveFeature = normalizeString(row.decisive_feature);
  const decision =
    typeof row.decision === 'string' ? row.decision.trim().toLowerCase() : row.decision;
  return {
    archetype_id:
      typeof row.archetype_id === 'string'
        ? row.archetype_id.trim()
        : typeof row.id === 'string'
          ? row.id.trim()
          : row.archetype_id,
    decision,
    decisive_feature: decisiveFeature.length > 0 ? decisiveFeature : decision === 'reject' ? null : '',
    reason: normalizeString(row.reason),
    evidence_ids: normalizeDreamEvidenceIdList(row.evidence_ids, 6),
  };
}

export function coerceArchetypeAdjudicationResponse(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const row = raw as Record<string, unknown>;
  return {
    decisions: Array.isArray(row.decisions) ? row.decisions.map(coerceAdjudicationDecision) : [],
    accepted_archetype_ids: Array.isArray(row.accepted_archetype_ids)
      ? row.accepted_archetype_ids
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
      : [],
  };
}

export function buildArchetypeAdjudicationJsonSchemaObject(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      decisions: {
        type: 'array',
        maxItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            archetype_id: { type: 'string', enum: getArchetypeRecognitionCatalogIds() },
            decision: { type: 'string', enum: ['accept', 'reject'] },
            decisive_feature: { type: ['string', 'null'] },
            reason: { type: 'string' },
            evidence_ids: {
              type: 'array',
              minItems: 1,
              maxItems: 6,
              items: { type: 'string', pattern: '^D\\d+$' },
            },
          },
          required: ['archetype_id', 'decision', 'decisive_feature', 'reason', 'evidence_ids'],
        },
      },
      accepted_archetype_ids: {
        type: 'array',
        maxItems: 2,
        items: { type: 'string', enum: getArchetypeRecognitionCatalogIds() },
      },
    },
    required: ['decisions', 'accepted_archetype_ids'],
  };
}

export function buildArchetypeAdjudicationResponseFormat(): ArchetypeAdjudicationResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'dream_archetype_adjudication_v1',
      strict: false,
      schema: buildArchetypeAdjudicationJsonSchemaObject(),
    },
  };
}

export function parseArchetypeAdjudicationJson(content: string):
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

export function validateArchetypeAdjudicationResponse(
  content: string,
  params: {
    dreamText?: string;
    targetLanguageHint?: string | null;
    enforceLanguage?: boolean;
  } = {}
): ArchetypeAdjudicationValidationResult {
  const targetLanguage = resolveDreamOutputLanguage(
    params.dreamText ?? '',
    params.targetLanguageHint ?? null
  );
  const parsed = parseArchetypeAdjudicationJson(content);
  if (!parsed.ok) {
    return {
      ok: false,
      issues: ['invalid_json'],
      errors: [parsed.error],
      targetLanguage,
      checkedFieldCount: 0,
    };
  }

  const coerced = coerceArchetypeAdjudicationResponse(parsed.value);
  const result = archetypeAdjudicationSchema.safeParse(coerced);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${path}: ${issue.message}`;
    });
    const duplicateIssue = errors.some(
      (error) =>
        error.includes('duplicate archetype_id') || error.includes('duplicate accepted_archetype_id')
    );
    const acceptedMismatch = errors.some((error) =>
      error.includes('accepted_archetype_ids')
    );
    return {
      ok: false,
      issues: [
        'schema_invalid',
        ...(duplicateIssue ? (['duplicate_archetype_id'] as const) : []),
        ...(acceptedMismatch ? (['accepted_ids_mismatch'] as const) : []),
      ],
      errors,
      targetLanguage,
      checkedFieldCount: 0,
    };
  }

  if (params.dreamText) {
    for (const item of result.data.decisions) {
      const evidence = resolveDreamEvidenceIds(item.evidence_ids, params.dreamText, {
        minCount: 1,
        maxCount: 6,
      });
      if (!evidence.ok) {
        return {
          ok: false,
          issues: ['invalid_evidence_ids'],
          errors: [`${item.archetype_id}.evidence_ids: ${evidence.reason}`],
          targetLanguage,
          checkedFieldCount: 0,
        };
      }
    }
  }

  const enforceLanguage = params.enforceLanguage ?? true;
  const textFields = collectAdjudicationTextFields(result.data);
  if (enforceLanguage) {
    const firstMismatch = textFields.find((field) => !looksLikeTargetLanguage(field, targetLanguage));
    if (firstMismatch) {
      return {
        ok: false,
        issues: ['language_validation_failed'],
        errors: [`language mismatch for target ${targetLanguage.code}: ${firstMismatch}`],
        targetLanguage,
        checkedFieldCount: textFields.length,
      };
    }
  }

  return {
    ok: true,
    data: result.data,
    normalizedContent: JSON.stringify(result.data),
    targetLanguage,
    checkedFieldCount: textFields.length,
  };
}
