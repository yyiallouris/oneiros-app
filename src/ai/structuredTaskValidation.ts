import { z } from 'zod';
import {
  MAX_LEGACY_ARCHETYPAL_ECHOES,
  normalizeArchetypalEchoes,
} from './archetypalEchoes.ts';
import {
  getArchetypeDefinitionById,
  getArchetypeDefinitionV1,
} from './catalogs/archetypeCatalog.v1.ts';
import {
  MYTH_CATALOG_IDS,
  SELECTABLE_ARCHETYPE_IDS,
} from './catalogs/generated/catalogIdEnums.v1.ts';
import {
  archetypeAdjudicationSchema,
  coerceArchetypeAdjudicationResponse,
} from './schemas/archetypeAdjudicationSchema.ts';
import {
  archetypeRecognitionSchema,
  coerceArchetypeRecognitionResponse,
} from './schemas/archetypeRecognitionSchema.ts';
import { normalizeDreamEvidenceIdList } from './dreamEvidenceSpans.ts';
import { MAX_LEGACY_MYTHIC_ECHOES, normalizeAmplifications } from './mythicEchoes.ts';

export { archetypeAdjudicationSchema } from './schemas/archetypeAdjudicationSchema.ts';

export const STRUCTURED_AI_TASKS = [
  'dream_extraction',
  'dream_archetype_recognition',
  'dream_archetype_adjudication',
  'conversation_element_update',
  'semantic_grouping',
] as const;

export type StructuredAiTask = (typeof STRUCTURED_AI_TASKS)[number];

export function isStructuredAiTask(task: string | null | undefined): task is StructuredAiTask {
  return typeof task === 'string' && (STRUCTURED_AI_TASKS as readonly string[]).includes(task);
}

const stringArray = z.array(z.string());
const dreamEvidenceIdSchema = z.string().regex(/^D\d+$/, 'must be a numbered dream evidence id like D1');

const coreModeSchema = z
  .union([
    z.enum(['Core Tension', 'Core State', 'Core Shift', 'Core Restoration']),
    z.null(),
  ])
  .optional();

const visibleAnchorSchema = z.object({
  label: z.string().min(1),
  type: z.string().optional(),
  salience: z.union([z.number(), z.string()]).optional(),
  ui_meaning: z.string().optional(),
});

const displayDistillationSchema = z
  .object({
    essence_title: z.string().optional(),
    essence_line: z.string().optional(),
    dominant_lens: z.string().optional(),
    visible_anchors: z.array(visibleAnchorSchema).optional(),
    main_tension: z.union([z.string(), z.null()]).optional(),
    dream_movement: z.string().optional(),
    movement_line: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();

const symbolStanceSchema = z.object({
  symbol: z.string().min(1),
  stance: z.string().optional(),
});

/**
 * Soft defaults for dream_extraction so common model omissions do not 502 the
 * whole metadata pass. Keep in sync with coerce helpers + contract tests.
 * See docs: Locked contract — metadata extraction resilience.
 */
export const DREAM_EXTRACTION_SOFT_DEFAULTS = {
  missingEchoConfidence: 'medium' as const,
};

export function normalizeMainTensionAgainstCentralConflicts(
  rawMainTension: unknown,
  centralConflicts: string[]
): string | null {
  const cleanedConflicts = centralConflicts
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  if (cleanedConflicts.length === 0) return null;

  const firstConflict = cleanedConflicts[0];
  const mainTension =
    typeof rawMainTension === 'string' && rawMainTension.trim().length > 0
      ? rawMainTension.trim()
      : null;

  return mainTension ? firstConflict : firstConflict;
}

function withSoftEchoConfidence(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  const conf = typeof o.confidence === 'string' ? o.confidence.trim().toLowerCase() : '';
  if (conf === 'high' || conf === 'medium') return o;
  // Omit / unknown → medium. Explicit "low" stays and fails the enum (we never store low).
  if (conf === 'low') return o;
  return { ...o, confidence: DREAM_EXTRACTION_SOFT_DEFAULTS.missingEchoConfidence };
}

function normalizeNamespaceCatalogId(value: unknown): string {
  if (typeof value !== 'string') return '';
  let s = value.trim();
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1).trim();
  return s;
}

const selectableArchetypeIdSchema = z.enum(
  SELECTABLE_ARCHETYPE_IDS as unknown as [string, ...string[]]
);
const mythCatalogIdSchema = z.enum(MYTH_CATALOG_IDS as unknown as [string, ...string[]]);
const selectableArchetypeIdSet = new Set<string>(SELECTABLE_ARCHETYPE_IDS);
const mythCatalogIdSet = new Set<string>(MYTH_CATALOG_IDS);

const archetypeEvaluationSchema = z
  .object({
    centrality: z.number().min(0).max(5),
    activeInMainAction: z.boolean().optional(),
    carrierType: z.enum(['figure', 'relationship', 'field', 'process']).optional(),
    agency: z.number().optional(),
    identityCompetition: z.boolean().optional(),
    actualCrossing: z.boolean().optional(),
    maternalFunction: z.boolean().optional(),
    fieldTransformation: z.boolean().optional(),
    futureBearing: z.boolean().optional(),
    excludedOrDisownedRole: z.boolean().optional(),
    engulfingOrPossessiveDynamic: z.boolean().optional(),
    embodiedSovereign: z.boolean().optional(),
  })
  .passthrough();

const archetypeMechanismTagSchema = z.enum([
  'active_threshold_guidance',
  'crossing_between_domains',
  'deception_or_feigned_belief',
  'inversion_or_rule_bending',
  'power_asymmetry_reversed',
  'public_role_or_social_mask',
  'private_self_conflict',
  'devotion_or_longing',
  'union_separation_or_loss',
  'bond_organizes_dream',
  'dissolution_or_symbolic_death',
  'revival_or_return',
  'identity_or_status_transformed',
  'engulfing_or_devouring',
  'possessive_anti_separation',
  'consequential_wisdom_or_warning',
  'guidance_changes_action_or_outcome',
  'ordeal_or_confrontation',
  'purposeful_quest_movement',
  'boon_or_changed_outcome',
]);

/** Extraction must return rich Archetypal Echo objects — bare tags are invalid. */
const extractionArchetypalEchoSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  let next: Record<string, unknown> = { ...o };
  if (
    (typeof next.expression !== 'string' || !String(next.expression).trim()) &&
    typeof next.carrier === 'string' &&
    next.carrier.trim()
  ) {
    next = { ...next, expression: next.carrier };
  }
  if (
    (typeof next.expression !== 'string' || !String(next.expression).trim()) &&
    typeof next.display_label === 'string' &&
    next.display_label.trim()
  ) {
    next = { ...next, expression: next.display_label };
  }
  if (typeof next.archetype_id !== 'string' || !String(next.archetype_id).trim()) {
    if (typeof next.canonical_label === 'string' && next.canonical_label.trim()) {
      const def = getArchetypeDefinitionV1(next.canonical_label);
      if (def) next = { ...next, archetype_id: def.id };
    }
  } else {
    next = { ...next, archetype_id: normalizeNamespaceCatalogId(next.archetype_id) };
  }
  if (Array.isArray(next.evidence_ids)) {
    next = { ...next, evidence_ids: normalizeDreamEvidenceIdList(next.evidence_ids, 6) };
  }
  const { evaluation: _evaluation, ...withoutEvaluation } = next;
  next = withoutEvaluation;
  return withSoftEchoConfidence(next);
}, z
  .object({
    archetype_id: selectableArchetypeIdSchema,
    expression: z.string().min(1),
    resonance: z.string().min(12),
    confidence: z.enum(['high', 'medium']),
    mechanism_tags: z.array(archetypeMechanismTagSchema).min(1).max(6),
    evidence_ids: z.array(dreamEvidenceIdSchema).min(1).max(10),
    /** Legacy optional bag — mechanism_tags are authoritative for hard gates. */
    evaluation: archetypeEvaluationSchema.optional(),
  })
  .passthrough()
);

/** Conversation updates / legacy may still carry bare strings; readers normalize. */
const legacyArchetypalEchoSchema = z.union([
  z.string().min(1),
  z
    .object({
      canonical_label: z.string().optional(),
      expression: z.string().optional(),
      display_label: z.string().optional(),
      resonance: z.string().optional(),
      evidence: z.array(z.string()).optional(),
      confidence: z.enum(['high', 'medium']).optional(),
    })
    .passthrough(),
]);

const mythicMatchDimensionSchema = z.enum([
  'distinctive_cluster',
  'narrative_sequence',
  'relational_roles',
  'central_conflict',
  'transformation_or_ending',
  'general_theme',
]);

const mythicDivergenceTypeSchema = z.enum([
  'outcome_changed',
  'emphasis_changed',
  'pattern_interrupted',
  'pattern_unfinished',
  'core_structure_absent',
]);

/**
 * Closed-catalog Mythic Echo (model-facing).
 * Model may not author title/tradition/source_type — server resolves those.
 */
const extractionMythicEchoSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  const {
    title: _title,
    tradition: _tradition,
    source_type: _sourceType,
    source_refs: _sourceRefs,
    matched_feature_ids: _matchedFeatureIds,
    divergence_type: _divergenceType,
    evaluation: _evaluation,
    difference,
    ...rest
  } = o;
  let next: Record<string, unknown> = { ...rest };
  if (
    (typeof next.divergence !== 'string' || !String(next.divergence).trim()) &&
    typeof difference === 'string' &&
    difference.trim()
  ) {
    next = { ...next, divergence: difference };
  }
  if (!Array.isArray(next.evidence_ids)) {
    next = { ...next, evidence_ids: [] };
  } else {
    next = { ...next, evidence_ids: normalizeDreamEvidenceIdList(next.evidence_ids, 6) };
  }
  if (!Array.isArray(next.evidence)) {
    next = { ...next, evidence: [] };
  }
  if (typeof next.catalog_id === 'string' && next.catalog_id.trim()) {
    next = { ...next, catalog_id: normalizeNamespaceCatalogId(next.catalog_id) };
  }
  return withSoftEchoConfidence(next);
}, z.object({
  catalog_id: mythCatalogIdSchema,
  resonance: z.string().min(12),
  divergence: z.string().min(8),
  /** Model-facing: cite [Dn] spans. Transport accepts up to 10; server clamps to 6. */
  evidence_ids: z.array(dreamEvidenceIdSchema).max(10).default([]),
  /**
   * App-facing resolved spans. Soft-default [] at Zod stage;
   * mythic validator fills from evidence_ids (or accepts legacy text temporarily).
   */
  evidence: z.array(z.string().min(1)).max(3).default([]),
  confidence: z.enum(['high', 'medium']),
}));

/** Conversation updates / legacy Mythic Echo shapes during transition. */
const amplificationSchema = z.union([
  z.string().min(1),
  z
    .object({
      title: z.string().optional(),
      tradition: z.string().optional(),
      resonance: z.string().optional(),
      divergence: z.string().optional(),
      // Legacy key — readers normalize to divergence.
      difference: z.string().optional(),
      evidence: z.array(z.string()).optional(),
      confidence: z.enum(['high', 'medium']).optional(),
      // Legacy Mythic Echo fields
      echo_name: z.string().optional(),
      dream_image: z.string().optional(),
      echo: z.string().optional(),
    })
    .passthrough(),
]);

/** Dev/debug only — never persisted to interpretation rows. Kept loose so audit fields survive. */
const interpretiveDiagnosticsSchema = z
  .object({
    dream_map: z.record(z.string(), z.unknown()).optional(),
    structural_spine: z.record(z.string(), z.unknown()).optional(),
    archetype_audit: z.array(z.record(z.string(), z.unknown())).optional(),
    mythic_audit: z.array(z.record(z.string(), z.unknown())).optional(),
    // Legacy keys (still accepted during transition).
    archetype_candidates: z.array(z.record(z.string(), z.unknown())).optional(),
    mythic_candidates: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough()
  .optional();

export const dreamExtractionSchema = z
  .object({
    display_distillation: displayDistillationSchema.optional(),
    symbols: stringArray.default([]),
    archetypes: z.array(extractionArchetypalEchoSchema).default([]),
    landscapes: stringArray.default([]),
    affects: stringArray.default([]),
    motifs: stringArray.default([]),
    relational_dynamics: stringArray.default([]),
    thresholds: stringArray.default([]),
    central_conflicts: stringArray.default([]),
    core_mode: coreModeSchema,
    // Direct 0–1 closed-catalog Mythic Echo from the same extraction call.
    amplifications: z.array(extractionMythicEchoSchema).max(1).default([]),
    symbol_stances: z.array(symbolStanceSchema).default([]),
    // Optional debug bag — first-class so openai-proxy normalization cannot drop it.
    interpretive_diagnostics: interpretiveDiagnosticsSchema,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const dd = value.display_distillation;
    const hasDisplay = Boolean(
      dd &&
        ((dd.essence_title && dd.essence_title.trim()) ||
          (dd.essence_line && dd.essence_line.trim()) ||
          (dd.visible_anchors && dd.visible_anchors.length > 0) ||
          (dd.main_tension && String(dd.main_tension).trim()) ||
          (dd.movement_line && String(dd.movement_line).trim()))
    );
    const hasLists =
      value.symbols.length > 0 ||
      value.archetypes.length > 0 ||
      value.landscapes.length > 0 ||
      value.affects.length > 0 ||
      value.motifs.length > 0 ||
      value.relational_dynamics.length > 0 ||
      value.thresholds.length > 0 ||
      value.central_conflicts.length > 0 ||
      value.amplifications.length > 0 ||
      value.symbol_stances.length > 0 ||
      value.core_mode != null;
    if (!hasDisplay && !hasLists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dream_extraction must include usable metadata or display_distillation',
      });
    }

    value.archetypes.forEach((echo, index) => {
      const def = getArchetypeDefinitionById(echo.archetype_id);
      const canonical = def?.canonicalLabel.trim().replace(/^\s*The\s+/i, '') ?? '';
      const expression = echo.expression.trim().replace(/^\s*The\s+/i, '');
      if (canonical && expression.toLowerCase() === canonical.toLowerCase()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['archetypes', index, 'expression'],
          message:
            'expression must be the dream-specific form, not the bare canonical label (e.g. "the child beneath the snow", not "Divine Child")',
        });
      }
    });
  });

const conversationElementFieldsSchema = z.object({
  affects: stringArray.default([]),
  motifs: stringArray.default([]),
  relational_dynamics: stringArray.default([]),
  thresholds: stringArray.default([]),
  central_conflicts: stringArray.default([]),
  core_mode: coreModeSchema,
});

export const conversationElementUpdateSchema = z.union([
  z
    .object({
      status: z.literal('no_change'),
    })
    .passthrough(),
  z
    .object({
      status: z.literal('updated'),
    })
    .merge(conversationElementFieldsSchema)
    .passthrough(),
]);

const groupingGroupSchema = z.object({
  canonical: z.string().min(1),
  members: z.array(z.string()).min(2),
});

export const semanticGroupingSchema = z
  .object({
    symbol_groups: z.array(groupingGroupSchema).default([]),
    landscape_groups: z.array(groupingGroupSchema).default([]),
  })
  .passthrough();

export type StructuredValidationLog = {
  task: StructuredAiTask;
  provider: string | null;
  validationStage: 'parse' | 'schema' | 'repair_parse' | 'repair_schema' | 'accepted' | 'rejected';
  schemaErrors: string[] | null;
  repairAttempted: boolean;
  repairSucceeded: boolean | null;
  salvageAttempted?: boolean;
  salvageSucceeded?: boolean;
  salvagedWithoutRepair?: boolean;
  salvagedArchetypesDropped?: number;
  salvagedAmplificationsDropped?: number;
  salvageDropCategories?: string[] | null;
};

export type StructuredValidationResult =
  | {
      ok: true;
      data: unknown;
      normalizedContent: string;
      log: StructuredValidationLog;
    }
  | {
      ok: false;
      schemaErrors: string[];
      log: StructuredValidationLog;
    };

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
}

/** Parse model text into a JSON object; applies trailing-comma repair once. */
export function parseStructuredJsonObject(content: string): { ok: true; value: unknown } | { ok: false; error: string } {
  let jsonStr = content.trim().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  if (!jsonStr.startsWith('{')) {
    const extracted = extractFirstJsonObject(jsonStr);
    if (!extracted) return { ok: false, error: 'No JSON object found' };
    jsonStr = extracted.trim();
  }

  try {
    return { ok: true, value: JSON.parse(jsonStr) };
  } catch {
    const repaired = jsonStr.replace(/,\s*([}\]])/g, '$1');
    try {
      return { ok: true, value: JSON.parse(repaired) };
    } catch {
      return { ok: false, error: 'JSON parse failed' };
    }
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
}

function coerceAmplifications(value: unknown) {
  return normalizeAmplifications(value, MAX_LEGACY_MYTHIC_ECHOES);
}

function coerceArchetypes(value: unknown): unknown[] {
  return normalizeArchetypalEchoes(value, MAX_LEGACY_ARCHETYPAL_ECHOES);
}

/** Model often omits confidence; if the echo is otherwise kept, treat as medium. */
function withDefaultMediumConfidence<T extends { confidence?: string }>(echo: T): T {
  if (echo.confidence === 'high' || echo.confidence === 'medium') return echo;
  return { ...echo, confidence: DREAM_EXTRACTION_SOFT_DEFAULTS.missingEchoConfidence };
}

/**
 * For dream_extraction, do NOT upgrade bare strings into fake-complete objects.
 * Bare tags must fail schema so repair can request expression + resonance + evidence.
 * Object items are normalized (whitelist canonical_label) before Zod checks richness.
 */
function coerceExtractionArchetypes(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item.trim();
    if (!item || typeof item !== 'object') return item;
    const o = item as Record<string, unknown>;
    let archetypeId = typeof o.archetype_id === 'string' ? o.archetype_id.trim() : '';
    if (!archetypeId && typeof o.canonical_label === 'string' && o.canonical_label.trim()) {
      const def = getArchetypeDefinitionV1(o.canonical_label);
      if (def) archetypeId = def.id;
    }
    const expression =
      typeof o.expression === 'string' && o.expression.trim()
        ? o.expression.trim()
        : typeof o.carrier === 'string' && o.carrier.trim()
          ? o.carrier.trim()
          : typeof o.display_label === 'string' && o.display_label.trim()
            ? o.display_label.trim()
            : '';
    const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
    return withDefaultMediumConfidence({
      archetype_id: archetypeId,
      expression,
      resonance,
      ...(Array.isArray(o.mechanism_tags) ? { mechanism_tags: o.mechanism_tags } : {}),
      ...(Array.isArray(o.evidence_ids)
        ? { evidence_ids: normalizeDreamEvidenceIdList(o.evidence_ids, 6) }
        : {}),
      ...(typeof o.confidence === 'string' ? { confidence: o.confidence } : {}),
    });
  });
}

function coerceExtractionAmplifications(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  const out: unknown[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const {
      title: _title,
      tradition: _tradition,
      source_type: _sourceType,
      source_refs: _sourceRefs,
      difference,
      ...rest
    } = o;
    let next: Record<string, unknown> = { ...rest };
    if (
      (typeof next.divergence !== 'string' || !String(next.divergence).trim()) &&
      typeof difference === 'string' &&
      difference.trim()
    ) {
      next = { ...next, divergence: difference };
    }
    if (typeof next.catalog_id !== 'string' || !next.catalog_id.trim()) {
      // Open-world / title-only objects are dropped → amplifications:[] (no schema 502).
      continue;
    }
    out.push(withDefaultMediumConfidence(next as { confidence?: string }));
  }
  return out;
}

function coerceDreamExtraction(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  const displayDistillation =
    o.display_distillation !== undefined ? o.display_distillation : o.displayDistillation;
  const symbolStances =
    o.symbol_stances !== undefined ? o.symbol_stances : o.symbolStances;
  const centralConflicts =
    o.central_conflicts !== undefined ? o.central_conflicts : o.centralConflicts;
  const normalizedCentralConflicts = asStringArray(centralConflicts);
  const normalizedDisplayDistillation =
    displayDistillation && typeof displayDistillation === 'object'
      ? {
          ...(displayDistillation as Record<string, unknown>),
          main_tension: normalizeMainTensionAgainstCentralConflicts(
            (displayDistillation as Record<string, unknown>).main_tension,
            normalizedCentralConflicts
          ),
        }
      : displayDistillation;
  return {
    ...o,
    ...(normalizedDisplayDistillation !== undefined
      ? { display_distillation: normalizedDisplayDistillation }
      : {}),
    symbols: asStringArray(o.symbols),
    archetypes: coerceExtractionArchetypes(o.archetypes),
    landscapes: asStringArray(o.landscapes),
    affects: asStringArray(o.affects),
    motifs: asStringArray(o.motifs),
    relational_dynamics: asStringArray(o.relational_dynamics),
    thresholds: asStringArray(o.thresholds),
    central_conflicts: normalizedCentralConflicts,
    amplifications: coerceExtractionAmplifications(o.amplifications),
    symbol_stances: Array.isArray(symbolStances) ? symbolStances : [],
    core_mode: o.core_mode === undefined ? null : o.core_mode,
  };
}

function hasConversationElementFields(o: Record<string, unknown>): boolean {
  return (
    Array.isArray(o.affects) ||
    Array.isArray(o.motifs) ||
    Array.isArray(o.relational_dynamics) ||
    Array.isArray(o.thresholds) ||
    Array.isArray(o.central_conflicts) ||
    o.core_mode !== undefined
  );
}

function coerceConversationElementUpdate(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if (o.status === 'no_change') return { status: 'no_change' };
  if (o.status === 'updated' || hasConversationElementFields(o)) {
    return {
      status: 'updated',
      affects: asStringArray(o.affects),
      motifs: asStringArray(o.motifs),
      relational_dynamics: asStringArray(o.relational_dynamics),
      thresholds: asStringArray(o.thresholds),
      central_conflicts: asStringArray(o.central_conflicts ?? o.centralConflicts),
      core_mode: o.core_mode === undefined ? null : o.core_mode,
    };
  }
  // Bare {} / nullish field bags are invalid — require explicit no_change via repair.
  return o;
}

function coerceSemanticGrouping(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  return {
    symbol_groups: Array.isArray(o.symbol_groups) ? o.symbol_groups : [],
    landscape_groups: Array.isArray(o.landscape_groups) ? o.landscape_groups : [],
  };
}

function coerceDreamArchetypeRecognition(raw: unknown): unknown {
  return coerceArchetypeRecognitionResponse(raw);
}

function coerceDreamArchetypeAdjudication(raw: unknown): unknown {
  return coerceArchetypeAdjudicationResponse(raw);
}

function schemaForTask(task: StructuredAiTask) {
  switch (task) {
    case 'dream_extraction':
      return dreamExtractionSchema;
    case 'dream_archetype_recognition':
      return archetypeRecognitionSchema;
    case 'dream_archetype_adjudication':
      return archetypeAdjudicationSchema;
    case 'conversation_element_update':
      return conversationElementUpdateSchema;
    case 'semantic_grouping':
      return semanticGroupingSchema;
  }
}

function coerceForTask(task: StructuredAiTask, raw: unknown): unknown {
  switch (task) {
    case 'dream_extraction':
      return coerceDreamExtraction(raw);
    case 'dream_archetype_recognition':
      return coerceDreamArchetypeRecognition(raw);
    case 'dream_archetype_adjudication':
      return coerceDreamArchetypeAdjudication(raw);
    case 'conversation_element_update':
      return coerceConversationElementUpdate(raw);
    case 'semantic_grouping':
      return coerceSemanticGrouping(raw);
  }
}

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

type DreamExtractionSalvageSummary = {
  archetypesDropped: number;
  amplificationsDropped: number;
  dropCategories: string[];
};

function classifyArchetypeEchoDrop(item: unknown, errors: string[]): string {
  const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
  const archetypeId = normalizeNamespaceCatalogId(row?.archetype_id);
  if (archetypeId && mythCatalogIdSet.has(archetypeId)) return 'dream_extraction_echo_namespace_crossover';
  if (archetypeId && !selectableArchetypeIdSet.has(archetypeId)) return 'dream_extraction_invalid_archetype_dropped';
  if (errors.some((error) => error.includes('mechanism_tags'))) {
    return 'dream_extraction_invalid_archetype_dropped';
  }
  if (errors.some((error) => error.includes('evidence_ids'))) {
    return 'dream_extraction_invalid_archetype_dropped';
  }
  return 'dream_extraction_invalid_archetype_dropped';
}

function classifyMythicEchoDrop(item: unknown, errors: string[]): string {
  const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : null;
  const catalogId = normalizeNamespaceCatalogId(row?.catalog_id);
  if (catalogId && selectableArchetypeIdSet.has(catalogId)) return 'dream_extraction_echo_namespace_crossover';
  if (catalogId && !mythCatalogIdSet.has(catalogId)) return 'dream_extraction_invalid_myth_dropped';
  if (errors.some((error) => error.includes('evidence_ids'))) {
    return 'dream_extraction_invalid_myth_dropped';
  }
  return 'dream_extraction_invalid_myth_dropped';
}

function attemptDreamExtractionOptionalEchoSalvage(
  coerced: unknown
): { data: unknown; summary: DreamExtractionSalvageSummary } | null {
  if (!coerced || typeof coerced !== 'object') return null;
  const candidate = coerced as Record<string, unknown>;
  const baseResult = dreamExtractionSchema.safeParse({
    ...candidate,
    archetypes: [],
    amplifications: [],
  });
  if (!baseResult.success) return null;

  const salvagedArchetypes: unknown[] = [];
  const salvagedAmplifications: unknown[] = [];
  const dropCategories: string[] = [];
  const rawArchetypes = Array.isArray(candidate.archetypes) ? candidate.archetypes : [];
  const rawAmplifications = Array.isArray(candidate.amplifications) ? candidate.amplifications : [];

  for (const item of rawArchetypes) {
    const parsed = extractionArchetypalEchoSchema.safeParse(item);
    if (parsed.success) {
      salvagedArchetypes.push(parsed.data);
      continue;
    }
    dropCategories.push(classifyArchetypeEchoDrop(item, formatZodErrors(parsed.error)));
  }

  for (const item of rawAmplifications) {
    const parsed = extractionMythicEchoSchema.safeParse(item);
    if (!parsed.success) {
      dropCategories.push(classifyMythicEchoDrop(item, formatZodErrors(parsed.error)));
      continue;
    }
    if (salvagedAmplifications.length >= 1) {
      dropCategories.push('dream_extraction_invalid_myth_dropped');
      continue;
    }
    salvagedAmplifications.push(parsed.data);
  }

  const archetypesDropped = rawArchetypes.length - salvagedArchetypes.length;
  const amplificationsDropped = rawAmplifications.length - salvagedAmplifications.length;
  if (archetypesDropped === 0 && amplificationsDropped === 0) return null;

  const finalResult = dreamExtractionSchema.safeParse({
    ...baseResult.data,
    archetypes: salvagedArchetypes,
    amplifications: salvagedAmplifications,
  });
  if (!finalResult.success) return null;

  return {
    data: finalResult.data,
    summary: {
      archetypesDropped,
      amplificationsDropped,
      dropCategories: [...new Set(dropCategories)],
    },
  };
}

/**
 * parse → coerce → Zod validate.
 * Does not call a model; callers own the optional repair attempt.
 */
export function validateStructuredTaskContent(
  task: StructuredAiTask,
  content: string,
  options: {
    provider?: string | null;
    repairAttempted?: boolean;
    stage?: 'schema' | 'repair_schema';
  } = {}
): StructuredValidationResult {
  const provider = options.provider ?? null;
  const repairAttempted = Boolean(options.repairAttempted);
  const stage = options.stage ?? (repairAttempted ? 'repair_schema' : 'schema');

  const parsed = parseStructuredJsonObject(content);
  if (!parsed.ok) {
    return {
      ok: false,
      schemaErrors: [parsed.error],
      log: {
        task,
        provider,
        validationStage: repairAttempted ? 'repair_parse' : 'parse',
        schemaErrors: [parsed.error],
        repairAttempted,
        repairSucceeded: repairAttempted ? false : null,
      },
    };
  }

  const coerced = coerceForTask(task, parsed.value);
  const result = schemaForTask(task).safeParse(coerced);
  if (!result.success) {
    if (task === 'dream_extraction') {
      const salvaged = attemptDreamExtractionOptionalEchoSalvage(coerced);
      if (salvaged) {
        const data = mergeDreamExtractionDiagnostics(salvaged.data, parsed.value);
        return {
          ok: true,
          data,
          normalizedContent: JSON.stringify(data),
          log: {
            task,
            provider,
            validationStage: 'accepted',
            schemaErrors: null,
            repairAttempted,
            repairSucceeded: repairAttempted ? true : null,
            salvageAttempted: true,
            salvageSucceeded: true,
            salvagedWithoutRepair: !repairAttempted,
            salvagedArchetypesDropped: salvaged.summary.archetypesDropped,
            salvagedAmplificationsDropped: salvaged.summary.amplificationsDropped,
            salvageDropCategories: salvaged.summary.dropCategories,
          },
        };
      }
    }
    const schemaErrors = formatZodErrors(result.error);
    return {
      ok: false,
      schemaErrors,
      log: {
        task,
        provider,
        validationStage: stage,
        schemaErrors,
        repairAttempted,
        repairSucceeded: repairAttempted ? false : null,
        salvageAttempted: task === 'dream_extraction',
        salvageSucceeded: false,
        salvagedWithoutRepair: false,
        salvagedArchetypesDropped: 0,
        salvagedAmplificationsDropped: 0,
        salvageDropCategories: null,
      },
    };
  }

  // Preserve debug diagnostics from the raw model JSON even if Zod/coerce thinned them.
  const data =
    task === 'dream_extraction'
      ? mergeDreamExtractionDiagnostics(result.data, parsed.value)
      : result.data;

  return {
    ok: true,
    data,
    normalizedContent: JSON.stringify(data),
    log: {
      task,
      provider,
      validationStage: 'accepted',
      schemaErrors: null,
      repairAttempted,
      repairSucceeded: repairAttempted ? true : null,
      salvageAttempted: task === 'dream_extraction',
      salvageSucceeded: false,
      salvagedWithoutRepair: false,
      salvagedArchetypesDropped: 0,
      salvagedAmplificationsDropped: 0,
      salvageDropCategories: null,
    },
  };
}

function mergeDreamExtractionDiagnostics(validated: unknown, raw: unknown): unknown {
  if (!validated || typeof validated !== 'object') return validated;
  if (!raw || typeof raw !== 'object') return validated;
  const v = validated as Record<string, unknown>;
  const r = raw as Record<string, unknown>;
  if (r.interpretive_diagnostics == null) return validated;
  if (v.interpretive_diagnostics != null) return validated;
  return { ...v, interpretive_diagnostics: r.interpretive_diagnostics };
}

export function buildStructuredRepairMessages(
  task: StructuredAiTask,
  originalMessages: Array<{ role: string; content: string }>,
  invalidContent: string,
  schemaErrors: string[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const schemaHint =
    task === 'dream_extraction'
      ? 'Return a JSON object with usable dream metadata arrays and/or display_distillation. Empty metadata-only objects are invalid. archetypes must be objects {archetype_id (exact enum from ONEIROS ARCHETYPE CATALOG), expression, mechanism_tags[>=1], evidence_ids[>=1], resonance, confidence:"high"|"medium"} — never bare strings; never use myth catalog_id values in archetype_id. Do not output canonical_label, carrier_kind, mechanism_actor, carrier_evidence_ids, mechanism_evidence_ids, or free-text evidence. Include confidence on every selected echo. amplifications is 0–1 closed-catalog Mythic Echo {catalog_id (exact enum from CLOSED_MYTH_CATALOG), resonance, divergence, evidence_ids, confidence} or []. Never include title/tradition/source_type or free-text myth evidence. Prefer amplifications:[] when no catalog id is earned. If interpretive_diagnostics was present, preserve it unchanged.'
      : task === 'dream_archetype_recognition'
      ? 'Return {"archetypes":[{"archetype_id":"closed enum id","quality":"short phrase","expression":"concrete image-near phrase","resonance":"one natural sentence","confidence":"high|medium","evidence_ids":["D1"]}]} with max 2 unique archetypes. Never return mechanism_tags, canonical_label, myth fields, or free-text evidence.'
      : task === 'dream_archetype_adjudication'
        ? 'Return {"decisions":[{"archetype_id":"closed enum id","decision":"accept|reject","decisive_feature":"short distinguishing feature or null","reason":"one concise sentence","evidence_ids":["D1"]}],"accepted_archetype_ids":["closed enum id"]}. accepted_archetype_ids must match accept decisions exactly. Never add new archetypes, mechanism_tags, myth fields, or regenerated quality/expression/resonance.'
      : task === 'conversation_element_update'
        ? 'Return either {"status":"no_change"} or {"status":"updated", "affects":[], "motifs":[], "relational_dynamics":[], "thresholds":[], "central_conflicts":[], "core_mode":null}. Bare {} is invalid. Follow-up chat must never return or revise archetypes or amplifications; both remain frozen from raw-dream extraction.'
        : 'Return {"symbol_groups":[{"canonical":"...","members":["...","..."]}],"landscape_groups":[...]} with members length >= 2 when present. Empty arrays are allowed.';

  const system = `You repair invalid JSON for the Oneiros task "${task}". Return ONLY valid JSON. No markdown. ${schemaHint}`;
  const priorUser = originalMessages.find((m) => m.role === 'user')?.content ?? '';
  const user = `Previous assistant JSON was invalid for domain schema.

Schema errors:
${schemaErrors.slice(0, 12).join('\n')}

Invalid assistant output:
${invalidContent.slice(0, 4000)}

Original user request (truncated):
${priorUser.slice(0, 4000)}

Return corrected JSON only.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export function safeStructuredValidationLog(
  log: StructuredValidationLog
): Record<string, unknown> {
  return {
    task: log.task,
    provider: log.provider,
    validationStage: log.validationStage,
    schemaErrors: log.schemaErrors,
    repairAttempted: log.repairAttempted,
    repairSucceeded: log.repairSucceeded,
    salvageAttempted: log.salvageAttempted ?? false,
    salvageSucceeded: log.salvageSucceeded ?? false,
    salvagedWithoutRepair: log.salvagedWithoutRepair ?? false,
    salvagedArchetypesDropped: log.salvagedArchetypesDropped ?? 0,
    salvagedAmplificationsDropped: log.salvagedAmplificationsDropped ?? 0,
    salvageDropCategories: log.salvageDropCategories ?? null,
  };
}

/** Safe shape diagnostics for assistant JSON — never includes content text. */
export function safeAssistantJsonDiagnostics(content: string): {
  contentLength: number;
  startsWithJson: boolean;
  endsWithJsonCloser: boolean;
  looksTruncated: boolean;
  openBraceDelta: number;
} {
  const trimmed = content.trim();
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (const ch of trimmed) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
  }
  const startsWithJson = trimmed.startsWith('{');
  const endsWithJsonCloser = /[}\]]$/.test(trimmed);
  const looksTruncated =
    trimmed.length > 0 && (inString || depth > 0 || (startsWithJson && !endsWithJsonCloser));
  return {
    contentLength: trimmed.length,
    startsWithJson,
    endsWithJsonCloser,
    looksTruncated,
    openBraceDelta: depth,
  };
}
