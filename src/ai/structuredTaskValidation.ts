import { z } from 'zod';
import {
  MAX_LEGACY_ARCHETYPAL_ECHOES,
  normalizeArchetypalEchoes,
} from './archetypalEchoes.ts';
import { MAX_LEGACY_MYTHIC_ECHOES, normalizeAmplifications } from './mythicEchoes.ts';

export const STRUCTURED_AI_TASKS = [
  'dream_extraction',
  'conversation_element_update',
  'semantic_grouping',
] as const;

export type StructuredAiTask = (typeof STRUCTURED_AI_TASKS)[number];

export function isStructuredAiTask(task: string | null | undefined): task is StructuredAiTask {
  return typeof task === 'string' && (STRUCTURED_AI_TASKS as readonly string[]).includes(task);
}

const stringArray = z.array(z.string());

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

/** Extraction must return rich Archetypal Echo objects — bare tags are invalid. */
const extractionArchetypalEchoSchema = z
  .object({
    canonical_label: z.string().min(1),
    expression: z.string().min(1),
    resonance: z.string().min(12),
    evidence: z.array(z.string().min(1)).min(1).max(2),
  })
  .passthrough();

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
    })
    .passthrough(),
]);

/** Extraction Mythic Echo: named parallel from a real tradition. */
const extractionMythicEchoSchema = z
  .object({
    title: z.string().min(1),
    tradition: z.string().min(1),
    resonance: z.string().min(12),
    difference: z.string().min(8),
    evidence: z.array(z.string().min(1)).min(2).max(3),
  })
  .passthrough();

/** Conversation updates / legacy Mythic Echo shapes during transition. */
const amplificationSchema = z.union([
  z.string().min(1),
  z
    .object({
      title: z.string().optional(),
      tradition: z.string().optional(),
      resonance: z.string().optional(),
      difference: z.string().optional(),
      evidence: z.array(z.string()).optional(),
      // Legacy Mythic Echo fields
      echo_name: z.string().optional(),
      dream_image: z.string().optional(),
      echo: z.string().optional(),
    })
    .passthrough(),
]);

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
    amplifications: z.array(extractionMythicEchoSchema).default([]),
    symbol_stances: z.array(symbolStanceSchema).default([]),
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
      const canonical = echo.canonical_label.trim().replace(/^\s*The\s+/i, '');
      const expression = echo.expression.trim().replace(/^\s*The\s+/i, '');
      if (expression.toLowerCase() === canonical.toLowerCase()) {
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
  archetypes: z.array(legacyArchetypalEchoSchema).default([]),
  affects: stringArray.default([]),
  motifs: stringArray.default([]),
  relational_dynamics: stringArray.default([]),
  thresholds: stringArray.default([]),
  central_conflicts: stringArray.default([]),
  core_mode: coreModeSchema,
  amplifications: z.array(amplificationSchema).default([]),
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

function coerceAmplifications(value: unknown): unknown[] {
  return normalizeAmplifications(value, MAX_LEGACY_MYTHIC_ECHOES);
}

function coerceArchetypes(value: unknown): unknown[] {
  return normalizeArchetypalEchoes(value, MAX_LEGACY_ARCHETYPAL_ECHOES);
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
    const normalized = normalizeArchetypalEchoes([item], 1);
    return normalized[0] ?? item;
  });
}

function coerceDreamExtraction(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  return {
    ...o,
    symbols: asStringArray(o.symbols),
    archetypes: coerceExtractionArchetypes(o.archetypes),
    landscapes: asStringArray(o.landscapes),
    affects: asStringArray(o.affects),
    motifs: asStringArray(o.motifs),
    relational_dynamics: asStringArray(o.relational_dynamics),
    thresholds: asStringArray(o.thresholds),
    central_conflicts: asStringArray(o.central_conflicts),
    amplifications: coerceAmplifications(o.amplifications),
    symbol_stances: Array.isArray(o.symbol_stances) ? o.symbol_stances : [],
    core_mode: o.core_mode === undefined ? null : o.core_mode,
  };
}

function hasConversationElementFields(o: Record<string, unknown>): boolean {
  return (
    Array.isArray(o.archetypes) ||
    Array.isArray(o.affects) ||
    Array.isArray(o.motifs) ||
    Array.isArray(o.relational_dynamics) ||
    Array.isArray(o.thresholds) ||
    Array.isArray(o.central_conflicts) ||
    Array.isArray(o.amplifications) ||
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
      archetypes: coerceArchetypes(o.archetypes),
      affects: asStringArray(o.affects),
      motifs: asStringArray(o.motifs),
      relational_dynamics: asStringArray(o.relational_dynamics),
      thresholds: asStringArray(o.thresholds),
      central_conflicts: asStringArray(o.central_conflicts ?? o.centralConflicts),
      core_mode: o.core_mode === undefined ? null : o.core_mode,
      amplifications: coerceAmplifications(o.amplifications),
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

function schemaForTask(task: StructuredAiTask) {
  switch (task) {
    case 'dream_extraction':
      return dreamExtractionSchema;
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
      },
    };
  }

  return {
    ok: true,
    data: result.data,
    normalizedContent: JSON.stringify(result.data),
    log: {
      task,
      provider,
      validationStage: 'accepted',
      schemaErrors: null,
      repairAttempted,
      repairSucceeded: repairAttempted ? true : null,
    },
  };
}

export function buildStructuredRepairMessages(
  task: StructuredAiTask,
  originalMessages: Array<{ role: string; content: string }>,
  invalidContent: string,
  schemaErrors: string[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const schemaHint =
    task === 'dream_extraction'
      ? 'Return a JSON object with usable dream metadata arrays and/or display_distillation. Empty metadata-only objects are invalid. archetypes must be objects {canonical_label, expression, resonance, evidence[]} — never bare strings like ["Divine Child","Guide / Psychopomp"]. canonical_label must be a classical whitelist name; expression is the dream-specific form (not equal to canonical_label); resonance min ~12 chars; evidence 1–2 concrete dream elements. amplifications use 0–1 named mythic parallel {title, tradition, resonance, difference, evidence[]} (evidence 2–3); empty array when no strong parallel.'
      : task === 'conversation_element_update'
        ? 'Return either {"status":"no_change"} or {"status":"updated", "archetypes":[], "affects":[], "motifs":[], "relational_dynamics":[], "thresholds":[], "central_conflicts":[], "core_mode":null, "amplifications":[]}. Bare {} is invalid. When updating archetypes, prefer rich objects {canonical_label, expression, resonance, evidence[]}.'
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
