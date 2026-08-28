import type { DisplayDistillation } from '../../../src/types/dream.ts';
import type { GatewayAction } from '../../../src/billing/types.ts';
import {
  estimateAiCallCost,
  type AiCallCost,
} from '../../../src/billing/aiPricing.ts';
import {
  buildCurrentMonthMonthlyScope,
  buildCurrentMonthScope,
  getRecentSequenceScopeKey,
} from '../../../src/billing/policy.ts';
import { buildDreamExtractionResponseFormat } from '../../../src/ai/dreamExtractionResponseFormat.ts';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
  DREAM_EXTRACTION_DEBUG_TOKEN_LIMIT,
  DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX,
} from '../../../src/ai/dreamExtractionPrompt.ts';
import {
  buildChatFollowupRequest,
  buildInitialReflectionRequest,
  END_MARKER_DREAM_READING,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../../../src/ai/dreamReflectionPrompt.ts';
import {
  extractSameCallReflectiveQuestions,
} from '../../../src/ai/reflectiveQuestionExtract.ts';
import {
  type ReflectiveQuestionArtifact,
} from '../../../src/ai/reflectiveQuestionPrompt.ts';
import {
  visibleEditorialArcReading,
} from '../../../src/ai/reflectionEditorialArc.ts';
import {
  buildEssayCompressionRetryPrompt,
  buildPeriodReflectionSystemPrompt,
  buildPeriodReflectionUserPrompt,
  buildRecentDreamFieldUserPrompt,
  countRenderedEssayWords,
  END_MARKER_DREAM_ESSAY,
  essayExceedsHardMaximum,
  essayExceedsRetryTolerance,
  ESSAY_COMPRESSION_RETRY_TEMPERATURE,
  getPeriodEssayLengthPolicy,
  PERIOD_REFLECTION_TEMPERATURE,
  RECENT_DREAM_FIELD_LENGTH_POLICY,
  RECENT_DREAM_FIELD_SYSTEM_PROMPT,
  RECENT_DREAM_FIELD_TEMPERATURE,
  type EssayLengthPolicy,
  type PeriodEssayScope,
} from '../../../src/ai/reflectiveEssayPrompt.ts';
import { buildMetadataFirstEssayContext } from '../../../src/ai/reflectiveEssayContext.ts';
import {
  auditDreamExtractionOutputLanguage,
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
  validateLanguageRepairFieldMap,
  type OutputLanguageCommitTelemetry,
} from '../../../src/ai/dreamOutputLanguage.ts';
import {
  ARCHETYPE_ADJUDICATION_PROMPT_ID,
  ARCHETYPE_ADJUDICATION_PROMPT_VERSION,
  ARCHETYPE_ADJUDICATION_TEMPERATURE,
  ARCHETYPE_ADJUDICATION_TOKEN_LIMIT,
  buildArchetypeAdjudicationSystemPrompt,
  buildArchetypeAdjudicationUserPrompt,
} from '../../../src/ai/archetypeAdjudicationPrompt.ts';
import {
  formatArchetypesForEssay,
  MAX_ARCHETYPAL_ECHOES,
  normalizeArchetypalEchoes,
  type ArchetypalEcho,
} from '../../../src/ai/archetypalEchoes.ts';
import {
  applyArchetypeAdjudicationToRecognition,
  mapAdjudicatedRecognitionToArchetypalEchoes,
} from '../../../src/ai/archetypeRecognitionPipeline.ts';
import {
  ARCHETYPE_RECOGNITION_PROMPT_ID,
  ARCHETYPE_RECOGNITION_PROMPT_VERSION,
  ARCHETYPE_RECOGNITION_TEMPERATURE,
  ARCHETYPE_RECOGNITION_TOKEN_LIMIT,
  buildArchetypeRecognitionSystemPrompt,
  buildArchetypeRecognitionUserPrompt,
} from '../../../src/ai/archetypeRecognitionPrompt.ts';
import { ARCHETYPE_BOUNDARY_CATALOG_VERSION } from '../../../src/ai/catalogs/archetypeBoundaryCatalog.v1.ts';
import { ARCHETYPE_RECOGNITION_CATALOG_VERSION } from '../../../src/ai/catalogs/archetypeRecognitionCatalog.v2.ts';
import {
  formatAmplificationsForEssay,
  MAX_MYTHIC_ECHOES,
  normalizeAmplifications,
  type MythicEcho,
} from '../../../src/ai/mythicEchoes.ts';
import {
  parseInterpretiveEchoDiagnostics,
  safeInterpretiveDiagnosticsLog,
  type InterpretiveEchoDiagnostics,
} from '../../../src/ai/interpretiveEchoDiagnostics.ts';
import {
  asArchetypeEvaluation,
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../../../src/ai/validators/archetypalEchoValidator.ts';
import { summarizeHeroArchetypeTelemetry } from '../../../src/ai/archetypeEchoTelemetry.ts';
import {
  closedMythicValidationForDebug,
  toPersistedClosedMythicEcho,
  validateClosedCatalogMythicEchoes,
} from '../../../src/ai/validators/mythicCatalogValidator.ts';
import {
  applyMythicAuditProductionInvariant,
  buildMythicEchoPipelineDebugPacket,
  type MythicEchoPipelineDebugPacket,
} from '../../../src/ai/mythicEchoPipelineDebug.ts';
import {
  ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
  buildArchetypeAdjudicationResponseFormat,
  validateArchetypeAdjudicationResponse,
} from '../../../src/ai/schemas/archetypeAdjudicationSchema.ts';
import {
  ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
  buildArchetypeRecognitionResponseFormat,
  validateArchetypeRecognitionResponse,
} from '../../../src/ai/schemas/archetypeRecognitionSchema.ts';
import type { PatternEntry } from './billing-db.ts';
import { HttpError } from './http.ts';
import { getFunctionsBaseUrl, getSupabaseAnonKey } from './supabase.ts';
import {
  normalizeMainTensionAgainstCentralConflicts,
  safeAssistantJsonDiagnostics,
  safeStructuredValidationLog,
  validateStructuredTaskContent,
} from './structuredTaskValidation.ts';

function tryParseRawModelObject(content: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(content) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reflectiveQuestion?: ReflectiveQuestionArtifact;
  reflectiveQuestions?: string[];
};

type DreamRecord = {
  id: string;
  title: string | null;
  date: string;
  content: string;
};

type ExtractionResult = {
  display_distillation?: DisplayDistillation;
  symbols: string[];
  archetypes: ArchetypalEcho[];
  landscapes: string[];
  affects: string[];
  motifs: string[];
  relational_dynamics: string[];
  thresholds: string[];
  central_conflicts: string[];
  core_mode: string | null;
  amplifications: MythicEcho[];
  symbol_stances: Array<{ symbol: string; stance: string }>;
};

type DedicatedArchetypePipelineStatus = 'ready' | 'empty';

type DedicatedArchetypePipelineResult = {
  archetypes: ArchetypalEcho[];
  cost: AiCallCost | null;
  status: DedicatedArchetypePipelineStatus;
  attempts: number;
  discoveryCount: number;
  acceptedCount: number;
};

export type { AiCallCost };

type ReflectionProgressCallback = (progress: {
  text: string;
  cost: AiCallCost | null;
  done: boolean;
}) => Promise<void> | void;

const DEFAULT_AI_PROXY_TIMEOUT_MS = 60000;
const AI_COST_FIELD = '__oneiros_ai_cost';
const DEDICATED_ARCHETYPE_PIPELINE_MAX_ATTEMPTS = 2;

function requestId(): string {
  return crypto.randomUUID();
}

function attachAiCallCost(payload: Record<string, unknown>, cost: AiCallCost): void {
  Object.defineProperty(payload, AI_COST_FIELD, {
    value: cost,
    enumerable: false,
  });
}

function aiCallCostFromPayload(payload: Record<string, unknown>): AiCallCost | null {
  const cost = (payload as Record<string, unknown>)[AI_COST_FIELD];
  return cost && typeof cost === 'object' ? cost as AiCallCost : null;
}

async function invokeOpenAiProxy(params: {
  authHeader: string;
  task: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  tokenLimit: number;
  responseFormat?:
    | ReturnType<typeof buildDreamExtractionResponseFormat>
    | ReflectiveQuestionResponseFormat
    | ReflectiveDialogueResponseFormat
    | ReturnType<typeof buildQuestionIntegrityGateResponseFormat>
    | ReturnType<typeof buildQuestionRepairResponseFormat>
    | ReturnType<typeof buildQuestionPremiseCheckResponseFormat>
    | { type: 'json_object' };
  timeoutMs?: number;
  skipStructuredValidation?: boolean;
}): Promise<Record<string, unknown>> {
  // openai-proxy requires a real user JWT (requireUser). Forward the caller's
  // Authorization; do not use the service-role key as Bearer.
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs ?? DEFAULT_AI_PROXY_TIMEOUT_MS);
  let response: Response;
  console.log('[billing-ai] openai-proxy request start', {
    task: params.task,
    tokenLimit: params.tokenLimit,
    timeoutMs: params.timeoutMs ?? DEFAULT_AI_PROXY_TIMEOUT_MS,
    responseFormat: params.responseFormat?.type === 'json_schema' ? 'json_schema' : params.responseFormat?.type ?? 'text',
    skipStructuredValidation: Boolean(params.skipStructuredValidation),
  });

  try {
    response = await fetch(`${getFunctionsBaseUrl()}/openai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: getSupabaseAnonKey(),
        Authorization: params.authHeader,
        'X-Request-Id': requestId(),
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        task: params.task,
        messages: params.messages,
        temperature: params.temperature,
        max_completion_tokens: params.tokenLimit,
        max_tokens: params.tokenLimit,
        response_format: params.responseFormat,
        ...(params.skipStructuredValidation ? { skip_structured_validation: true } : {}),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[billing-ai] openai-proxy request timeout', {
        task: params.task,
        timeoutMs: params.timeoutMs ?? DEFAULT_AI_PROXY_TIMEOUT_MS,
        durationMs: Date.now() - startedAt,
      });
      throw new HttpError(504, 'AI proxy request timed out');
    }
    console.error('[billing-ai] openai-proxy request failed before response', {
      task: params.task,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Unknown fetch error',
    });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const provider = response.headers.get('X-AI-Provider')?.trim() || null;
  const data = await response.json();
  if (!response.ok) {
    const proxyError = data && typeof data === 'object' ? (data as { error?: unknown; message?: unknown }).error : null;
    const proxyMessage =
      typeof proxyError === 'string'
        ? proxyError
        : proxyError && typeof proxyError === 'object' && typeof (proxyError as { message?: unknown }).message === 'string'
          ? (proxyError as { message: string }).message
          : data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string'
            ? (data as { message: string }).message
            : null;
    const nestedDetails =
      proxyError && typeof proxyError === 'object' && typeof (proxyError as { details?: unknown }).details === 'object'
        ? ((proxyError as { details: Record<string, unknown> }).details ?? null)
        : data && typeof data === 'object' && typeof (data as { details?: unknown }).details === 'object'
          ? ((data as { details: Record<string, unknown> }).details ?? null)
          : null;
    const failureCode =
      nestedDetails && typeof nestedDetails.failureCode === 'string'
        ? nestedDetails.failureCode
        : proxyError && typeof proxyError === 'object' && typeof (proxyError as { code?: unknown }).code === 'string'
          ? (proxyError as { code: string }).code
          : null;
    console.error('[billing-ai] openai-proxy request failed', {
      task: params.task,
      status: response.status,
      durationMs: Date.now() - startedAt,
      proxyMessage,
      failureCode,
      provider,
      model: response.headers.get('X-AI-Model')?.trim() || null,
      looksTruncated: nestedDetails?.looksTruncated ?? null,
      contentLength: nestedDetails?.contentLength ?? null,
      finishReason: nestedDetails?.finishReason ?? null,
      schemaErrorCount: nestedDetails?.schemaErrorCount ?? null,
      schemaErrors: Array.isArray(nestedDetails?.schemaErrors)
        ? nestedDetails.schemaErrors.slice(0, 8)
        : null,
    });
    throw new HttpError(response.status, proxyMessage || 'AI proxy request failed', {
      failureCode,
      upstreamStatus: response.status,
      provider,
      model: response.headers.get('X-AI-Model')?.trim() || null,
      ...(nestedDetails ?? {}),
    });
  }

  const cost = estimateAiCallCost(data as Record<string, unknown>, provider);
  attachAiCallCost(data as Record<string, unknown>, cost);
  console.log('[billing-ai] openai-proxy request done', {
    task: params.task,
    status: response.status,
    durationMs: Date.now() - startedAt,
    provider: cost.provider,
    model: cost.model,
    pricingModel: cost.pricingModel,
    pricingSource: cost.pricingSource,
    inputTokens: cost.inputTokens,
    cachedInputTokens: cost.cachedInputTokens,
    billableInputTokens: cost.billableInputTokens,
    outputTokens: cost.outputTokens,
    totalTokens: cost.totalTokens,
    estimatedUsd: cost.estimatedUsd,
  });

  return data as Record<string, unknown>;
}

async function invokeOpenAiProxyStream(params: {
  authHeader: string;
  task: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  tokenLimit: number;
  timeoutMs?: number;
  onProgress?: ReflectionProgressCallback;
}): Promise<{ content: string; cost: AiCallCost | null }> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs ?? DEFAULT_AI_PROXY_TIMEOUT_MS);
  let response: Response;
  console.log('[billing-ai] openai-proxy stream request start', {
    task: params.task,
    tokenLimit: params.tokenLimit,
    timeoutMs: params.timeoutMs ?? DEFAULT_AI_PROXY_TIMEOUT_MS,
  });

  try {
    response = await fetch(`${getFunctionsBaseUrl()}/openai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: getSupabaseAnonKey(),
        Authorization: params.authHeader,
        'X-Request-Id': requestId(),
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        task: params.task,
        messages: params.messages,
        temperature: params.temperature,
        max_completion_tokens: params.tokenLimit,
        max_tokens: params.tokenLimit,
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[billing-ai] openai-proxy stream request timeout', {
        task: params.task,
        timeoutMs: params.timeoutMs ?? DEFAULT_AI_PROXY_TIMEOUT_MS,
        durationMs: Date.now() - startedAt,
      });
      throw new HttpError(504, 'AI proxy request timed out');
    }
    console.error('[billing-ai] openai-proxy stream request failed before response', {
      task: params.task,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Unknown fetch error',
    });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const provider = response.headers.get('X-AI-Provider')?.trim() || null;
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.clone().json();
    } catch {
      try {
        details = await response.clone().text();
      } catch {
        details = null;
      }
    }
    const proxyError =
      details && typeof details === 'object'
        ? (details as { error?: unknown; message?: unknown }).error
        : null;
    const proxyMessage =
      typeof proxyError === 'string'
        ? proxyError
        : proxyError && typeof proxyError === 'object' && typeof (proxyError as { message?: unknown }).message === 'string'
          ? (proxyError as { message: string }).message
          : details && typeof details === 'object' && typeof (details as { message?: unknown }).message === 'string'
            ? (details as { message: string }).message
            : null;
    console.error('[billing-ai] openai-proxy stream request failed', {
      task: params.task,
      status: response.status,
      durationMs: Date.now() - startedAt,
      proxyMessage,
      provider: response.headers.get('X-AI-Provider')?.trim() || null,
      model: response.headers.get('X-AI-Model')?.trim() || null,
      usedFallback: response.headers.get('X-AI-Fallback') === '1',
    });
    throw new HttpError(response.status, proxyMessage || 'AI proxy request failed', details);
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (!response.body || !contentType.includes('text/event-stream')) {
    const data = await response.json();
    const cost = estimateAiCallCost(data as Record<string, unknown>, provider);
    const content = extractContent(data as Record<string, unknown>);
    const visible = visibleEditorialArcReading(content, END_MARKER_DREAM_READING);
    await params.onProgress?.({ text: visible, cost, done: true });
    return { content, cost };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let usage: unknown = null;
  let lastProgressAt = 0;
  let lastProgressLength = 0;

  const emitProgress = async (done: boolean) => {
    const now = Date.now();
    if (!done && now - lastProgressAt < 900 && text.length - lastProgressLength < 280) return;
    lastProgressAt = now;
    lastProgressLength = text.length;
    const cost = usage && typeof usage === 'object'
      ? estimateAiCallCost({ model: response.headers.get('X-AI-Model') ?? null, usage } as Record<string, unknown>, provider)
      : null;
    await params.onProgress?.({
      text: visibleEditorialArcReading(text, END_MARKER_DREAM_READING),
      cost,
      done,
    });
  };

  const processEventLine = async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const raw = trimmed.slice(5).trim();
    if (!raw || raw === '[DONE]') return;

    let chunk: Record<string, unknown>;
    try {
      chunk = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    if (chunk.usage && typeof chunk.usage === 'object') {
      usage = chunk.usage;
    }

    const choices = Array.isArray(chunk.choices) ? chunk.choices as Array<Record<string, unknown>> : [];
    const first = choices[0] ?? {};
    const delta = (first.delta ?? {}) as Record<string, unknown>;
    if (typeof delta.content === 'string' && delta.content.length > 0) {
      text += delta.content;
      await emitProgress(false);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      await processEventLine(line);
    }
  }

  if (buffer.trim()) {
    await processEventLine(buffer);
  }

  const finalCost = usage && typeof usage === 'object'
    ? estimateAiCallCost({ model: response.headers.get('X-AI-Model') ?? null, usage } as Record<string, unknown>, provider)
    : null;
  const finalText = visibleEditorialArcReading(text, END_MARKER_DREAM_READING);
  if (!finalText.trim()) {
    throw new HttpError(502, 'AI proxy returned empty content');
  }
  await params.onProgress?.({ text: finalText, cost: finalCost, done: true });
  console.log('[billing-ai] openai-proxy stream request done', {
    task: params.task,
    status: response.status,
    durationMs: Date.now() - startedAt,
    provider,
    model: response.headers.get('X-AI-Model') ?? null,
    pricingModel: finalCost?.pricingModel ?? null,
    pricingSource: finalCost?.pricingSource ?? 'unknown_provider_or_model',
    inputTokens: finalCost?.inputTokens,
    cachedInputTokens: finalCost?.cachedInputTokens,
    billableInputTokens: finalCost?.billableInputTokens,
    outputTokens: finalCost?.outputTokens,
    totalTokens: finalCost?.totalTokens,
    estimatedUsd: finalCost?.estimatedUsd,
  });
  return { content: text, cost: finalCost };
}

function extractContent(payload: Record<string, unknown>): string {
  const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : [];
  const first = choices[0] ?? {};
  const message = (first.message ?? {}) as Record<string, unknown>;
  const content = message.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new HttpError(502, 'AI proxy returned empty content');
  }
  return content.trim();
}

function stripEndMarker(text: string, marker: string): string {
  return text.replace(marker, '').trim();
}

function buildEssayLanguageInstruction(language: string): string {
  const languageNames: Record<string, string> = {
    el: 'Greek (Ελληνικά)',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    nl: 'Dutch',
    pl: 'Polish',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese',
  };
  if (language === 'en') return '';
  return `

IMPORTANT LANGUAGE RULE:
Keep all markdown section headings exactly as specified in English for UI consistency.
Write all paragraph text, bullets, and reflective questions in ${languageNames[language] ?? `the language with ISO 639-1 code "${language}"`}.
Do not translate section headings.
Preserve extracted symbols in English only if needed, but explain them in the requested language.`;
}

function buildReflectionMessages(
  dream: DreamRecord,
  depth: 'quick' | 'standard' | 'advanced'
) {
  const request = buildInitialReflectionRequest(dream, depth);
  return {
    ...request,
    timeoutMs: DEFAULT_AI_PROXY_TIMEOUT_MS,
  };
}

/* ============================
   DREAM EXTRACTION
   Keep this metadata extraction contract in parity with src/services/ai.ts
   via the shared canonical module src/ai/dreamExtractionPrompt.ts.
   ============================ */

function buildExtractionMessages(
  dream: DreamRecord,
  interpretation: string,
  options: { debugInterpretiveEchoes?: boolean } = {}
) {
  const debugInterpretiveEchoes = Boolean(options.debugInterpretiveEchoes);
  const system = buildDreamExtractionSystemPrompt();
  const targetOutputLanguage = resolveDreamOutputLanguage(
    typeof dream.content === 'string' ? dream.content : ''
  );
  const user = buildDreamExtractionUserPrompt({
    title: dream.title,
    date: dream.date,
    content: dream.content,
    finalInterpretation: interpretation,
    debugInterpretiveEchoes,
    targetOutputLanguage,
  });
  const tokenLimit = debugInterpretiveEchoes
    ? DREAM_EXTRACTION_DEBUG_TOKEN_LIMIT
    : DREAM_EXTRACTION_TOKEN_LIMIT;
  const suffixAppended = user.includes('DEBUG INTERPRETIVE ECHOES');
  console.log('[echo-debug-flow]', {
    stage: 'prompt_prepared',
    debugRequested: debugInterpretiveEchoes,
    suffixAppended,
    suffixConstantPresent: DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX.includes('interpretive_diagnostics'),
    userPromptLength: user.length,
    tokenLimit,
    promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
  });
  console.log('[billing-ai] dream_extraction prompt prepared', {
    promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
    promptId: DREAM_EXTRACTION_PROMPT_ID,
    schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
    debugInterpretiveEchoes,
    dreamLength: dream.content?.length ?? 0,
    reflectionLength: interpretation?.length ?? 0,
    systemPromptLength: system.length,
    userPromptLength: user.length,
    tokenLimit,
    temperature: DREAM_EXTRACTION_TEMPERATURE,
  });
  return {
    task: 'dream_extraction',
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    temperature: DREAM_EXTRACTION_TEMPERATURE,
    tokenLimit,
    responseFormat: buildDreamExtractionResponseFormat(),
    timeoutMs: 60000,
  };
}

function buildFollowupMessages(dream: DreamRecord, conversation: ChatMessage[], userMessage: string, isFinalResponse: boolean) {
  return buildChatFollowupRequest({
    dream,
    conversation,
    userMessage,
    isFinalResponse,
  });
}

function buildEssayContext(entries: PatternEntry[], surface: 'period' | 'recent'): string {
  return buildMetadataFirstEssayContext(
    entries.map((entry) => ({
      date: entry.date,
      coreMode: entry.extracted.core_mode ?? '',
      affects: entry.extracted.affects,
      symbols: entry.extracted.symbols,
      symbolStances: entry.extracted.symbol_stances.map(
        (stance) => `${stance.symbol}: ${stance.stance}`
      ),
      landscapes: entry.extracted.landscapes,
      motifs: entry.extracted.motifs,
      relationalDynamics: entry.extracted.relational_dynamics,
      thresholds: entry.extracted.thresholds,
      centralConflicts: entry.extracted.central_conflicts,
      archetypalEchoes: formatArchetypesForEssay(entry.extracted.archetypes),
      mythicEchoes: formatAmplificationsForEssay(entry.extracted.amplifications),
      interpretation: entry.interpretation,
    })),
    surface
  );
}

function buildRecentEssayMessages(entries: PatternEntry[], language: string) {
  const context = buildEssayContext(entries, 'recent');

  const languageInstruction = buildEssayLanguageInstruction(language);
  const userPrompt = buildRecentDreamFieldUserPrompt({
    dreamCount: entries.length,
    context,
    languageInstruction,
  });

  return {
    task: 'pattern_insights',
    messages: [
      {
        role: 'system' as const,
        content: RECENT_DREAM_FIELD_SYSTEM_PROMPT,
      },
      {
        role: 'user' as const,
        content: userPrompt,
      },
    ],
    temperature: RECENT_DREAM_FIELD_TEMPERATURE,
    tokenLimit: 1400,
  };
}

export type PeriodReflectionPromptScope = {
  kind: PeriodEssayScope;
  scopeKey: string;
  startDate: string;
  endDate: string;
};

function buildPeriodEssayMessages(
  entries: PatternEntry[],
  scope: PeriodReflectionPromptScope,
  language: string
) {
  const context = buildEssayContext(entries, 'period');

  const languageInstruction = buildEssayLanguageInstruction(language);
  const userPrompt = buildPeriodReflectionUserPrompt({
    scope: scope.kind,
    scopeKey: scope.scopeKey,
    startDate: scope.startDate,
    endDate: scope.endDate,
    dreamCount: entries.length,
    context,
    languageInstruction,
  });

  return {
    task: 'pattern_insights',
    messages: [
      {
        role: 'system' as const,
        content: buildPeriodReflectionSystemPrompt(scope.kind, entries.length),
      },
      {
        role: 'user' as const,
        content: userPrompt,
      },
    ],
    temperature: PERIOD_REFLECTION_TEMPERATURE,
    tokenLimit: entries.length >= 5 ? 2200 : 1700,
  };
}

export function emptyExtraction(): ExtractionResult {
  return {
    display_distillation: undefined,
    symbols: [],
    archetypes: [],
    landscapes: [],
    affects: [],
    motifs: [],
    relational_dynamics: [],
    thresholds: [],
    central_conflicts: [],
    core_mode: null,
    amplifications: [],
    symbol_stances: [],
  };
}

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
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
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
}

function parseJsonObjectLoose(content: string): Record<string, unknown> | null {
  let jsonStr = content.trim().replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  if (!jsonStr.startsWith('{')) {
    const extracted = extractFirstJsonObject(jsonStr);
    if (!extracted) return null;
    jsonStr = extracted.trim();
  }

  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    // Common model damage: trailing commas before } or ]
    const repaired = jsonStr.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function normalizeDisplayDistillation(
  value: unknown,
  centralConflicts: string[] = []
): DisplayDistillation | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const visible_anchors = Array.isArray(raw.visible_anchors)
    ? raw.visible_anchors
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const anchor = item as Record<string, unknown>;
          const label = typeof anchor.label === 'string' ? anchor.label.trim() : '';
          if (!label) return null;
          const salienceRaw = Number(anchor.salience);
          const salience = (
            salienceRaw >= 5 ? 5 : salienceRaw >= 4 ? 4 : salienceRaw >= 3 ? 3 : salienceRaw >= 2 ? 2 : 1
          ) as 1 | 2 | 3 | 4 | 5;
          return {
            label,
            type: (typeof anchor.type === 'string' ? anchor.type : 'image') as DisplayDistillation['visible_anchors'][number]['type'],
            salience,
            ui_meaning: typeof anchor.ui_meaning === 'string' ? anchor.ui_meaning : '',
          };
        })
        .filter((anchor): anchor is DisplayDistillation['visible_anchors'][number] => anchor !== null)
        .slice(0, 5)
    : [];

  const essence_title = typeof raw.essence_title === 'string' ? raw.essence_title.trim() : '';
  const essence_line = typeof raw.essence_line === 'string' ? raw.essence_line.trim() : '';
  const main_tension = typeof raw.main_tension === 'string' ? raw.main_tension.trim() : null;
  const movement_line = typeof raw.movement_line === 'string' ? raw.movement_line.trim() : null;
  const hasContent =
    essence_title.length > 0 ||
    essence_line.length > 0 ||
    visible_anchors.length > 0 ||
    Boolean(main_tension) ||
    Boolean(movement_line);
  if (!hasContent) return undefined;

  return {
    essence_title,
    essence_line,
    dominant_lens: (typeof raw.dominant_lens === 'string' ? raw.dominant_lens : 'unclear') as DisplayDistillation['dominant_lens'],
    visible_anchors,
    main_tension: normalizeMainTensionAgainstCentralConflicts(main_tension, centralConflicts),
    dream_movement: (typeof raw.dream_movement === 'string' ? raw.dream_movement : 'unclear') as DisplayDistillation['dream_movement'],
    movement_line,
  };
}

function hasExtractionContent(extraction: ExtractionResult): boolean {
  return Boolean(extraction.display_distillation) ||
    extraction.symbols.length > 0 ||
    extraction.archetypes.length > 0 ||
    extraction.landscapes.length > 0 ||
    extraction.affects.length > 0 ||
    extraction.motifs.length > 0 ||
    extraction.relational_dynamics.length > 0 ||
    extraction.thresholds.length > 0 ||
    extraction.central_conflicts.length > 0 ||
    Boolean(extraction.core_mode) ||
    extraction.amplifications.length > 0 ||
    extraction.symbol_stances.length > 0;
}

function archetypesWithEvaluation(raw: unknown): Array<ArchetypalEcho & { evaluation?: unknown }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<ArchetypalEcho & { evaluation?: unknown }> = [];
  for (const row of raw) {
    const normalized = normalizeArchetypalEchoes([row], 1)[0];
    if (!normalized) continue;
    if (!row || typeof row !== 'object') {
      out.push(normalized);
    } else {
      const o = row as Record<string, unknown>;
      const evaluation = asArchetypeEvaluation(o.evaluation);
      out.push({
        ...normalized,
        ...(evaluation ? { evaluation } : {}),
        ...(o.mechanism_tags !== undefined ? { mechanism_tags: o.mechanism_tags } : {}),
        ...(o.carrier_kind !== undefined ? { carrier_kind: o.carrier_kind } : {}),
      } as ArchetypalEcho & { evaluation?: unknown });
    }
    if (out.length >= MAX_ARCHETYPAL_ECHOES) break;
  }
  return out;
}

function parseExtraction(
  content: string,
  options: { failOnInvalidOrEmpty?: boolean; captureDiagnostics?: boolean } = {}
): {
  extraction: ExtractionResult;
  diagnostics: InterpretiveEchoDiagnostics | null;
  /** Zod-validated amplifications before normalizeAmplifications (debug pipeline stage 2). */
  parsedAmplificationsBeforeNormalize: unknown;
} {
  const rawHasDiagnostics = content.includes('"interpretive_diagnostics"');
  const validated = validateStructuredTaskContent('dream_extraction', content, {
    provider: 'openai-or-fallback',
  });
  if (!validated.ok) {
    const shape = safeAssistantJsonDiagnostics(content);
    console.error('[billing-ai] Extraction schema validation failed', {
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      promptId: DREAM_EXTRACTION_PROMPT_ID,
      schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
      failOnInvalidOrEmpty: Boolean(options.failOnInvalidOrEmpty),
      schemaErrors: validated.schemaErrors.slice(0, 12),
      schemaErrorCount: validated.schemaErrors.length,
      repairAttempted: validated.log.repairAttempted,
      repairSucceeded: validated.log.repairSucceeded,
      ...shape,
    });
    console.log('[echo-debug-flow]', {
      stage: 'parse_failed',
      captureDiagnostics: Boolean(options.captureDiagnostics),
      rawHasDiagnostics,
      schemaErrorCount: validated.schemaErrors.length,
    });
    if (options.failOnInvalidOrEmpty) {
      throw new HttpError(502, 'AI extraction returned invalid JSON', {
        failureCode: 'structured_schema_invalid',
        promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
        promptId: DREAM_EXTRACTION_PROMPT_ID,
        schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
        schemaErrors: validated.schemaErrors.slice(0, 12),
        ...shape,
      });
    }
    return {
      extraction: emptyExtraction(),
      diagnostics: null,
      parsedAmplificationsBeforeNormalize: null,
    };
  }

  const parsed = validated.data as Record<string, unknown>;
  const parsedAmplificationsBeforeNormalize = parsed.amplifications ?? null;
  const parsedHasDiagnostics = parsed.interpretive_diagnostics != null;
  const diagnostics = options.captureDiagnostics
    ? parseInterpretiveEchoDiagnostics(parsed.interpretive_diagnostics)
    : null;
  console.log('[echo-debug-flow]', {
    stage: 'parse_ok',
    captureDiagnostics: Boolean(options.captureDiagnostics),
    rawHasDiagnostics,
    parsedHasDiagnostics,
    validatedHasDiagnostics: Boolean(diagnostics),
    archetypeAuditCount: diagnostics?.archetype_audit.length ?? 0,
    mythicAuditCount: diagnostics?.mythic_audit.length ?? 0,
  });

  const central_conflicts = asStringArray(parsed.central_conflicts);
  const extraction = {
    display_distillation: normalizeDisplayDistillation(
      parsed.display_distillation,
      central_conflicts
    ),
    symbols: asStringArray(parsed.symbols),
    // Keep evaluation attached until after validators (indices stay aligned).
    archetypes: archetypesWithEvaluation(parsed.archetypes) as ArchetypalEcho[],
    landscapes: asStringArray(parsed.landscapes),
    affects: asStringArray(parsed.affects),
    motifs: asStringArray(parsed.motifs),
    relational_dynamics: asStringArray(parsed.relational_dynamics),
    thresholds: asStringArray(parsed.thresholds),
    central_conflicts,
    core_mode: (typeof parsed.core_mode === 'string' ? parsed.core_mode : null) as ExtractionResult['core_mode'],
    amplifications: normalizeAmplifications(parsedAmplificationsBeforeNormalize, MAX_MYTHIC_ECHOES),
    symbol_stances: Array.isArray(parsed.symbol_stances)
      ? parsed.symbol_stances
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const stance = item as Record<string, unknown>;
            const symbol = typeof stance.symbol === 'string' ? stance.symbol.trim() : '';
            if (!symbol) return null;
            return {
              symbol,
              stance: typeof stance.stance === 'string' ? stance.stance : '',
            };
          })
          .filter((item): item is { symbol: string; stance: string } => item !== null)
      : [],
  };

  console.log('[billing-ai] dream_extraction normalized', {
    promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
    promptId: DREAM_EXTRACTION_PROMPT_ID,
    schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
    symbolsCount: extraction.symbols.length,
    archetypesCount: extraction.archetypes.length,
    // Safe shape counts only — never echo labels/resonance text.
    archetypeWithResonanceCount: extraction.archetypes.filter((echo) => echo.resonance.trim().length >= 12).length,
    archetypeWithExpressionCount: extraction.archetypes.filter(
      (echo) =>
        echo.expression.trim().length > 0 &&
        echo.expression.trim().toLowerCase() !== echo.canonical_label.trim().toLowerCase()
    ).length,
    landscapesCount: extraction.landscapes.length,
    affectsCount: extraction.affects.length,
    motifsCount: extraction.motifs.length,
    relationalDynamicsCount: extraction.relational_dynamics.length,
    thresholdsCount: extraction.thresholds.length,
    centralConflictsCount: extraction.central_conflicts.length,
    amplificationsCount: extraction.amplifications.length,
    symbolStancesCount: extraction.symbol_stances.length,
    hasDisplayDistillation: Boolean(extraction.display_distillation),
    coreMode: extraction.core_mode,
    ...safeInterpretiveDiagnosticsLog(diagnostics),
  });

  if (options.failOnInvalidOrEmpty && !hasExtractionContent(extraction)) {
    console.error('[billing-ai] Extraction returned no usable metadata', {
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      promptId: DREAM_EXTRACTION_PROMPT_ID,
      schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
      parsedKeysCount: Object.keys(parsed).length,
    });
    throw new HttpError(502, 'AI extraction returned no usable metadata', {
      failureCode: 'extraction_empty',
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      promptId: DREAM_EXTRACTION_PROMPT_ID,
      schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
    });
  }

  return {
    extraction,
    diagnostics,
    parsedAmplificationsBeforeNormalize,
  };
}

export async function generateDreamInterpretation(params: {
  authHeader: string;
  dream: DreamRecord;
  depth: 'quick' | 'standard' | 'advanced';
}): Promise<{ text: string; extraction: ExtractionResult }> {
  const reflectionResult = await generateDreamReflectionWithCost(params);
  const extractionResult = await generateDreamExtractionWithCost({
    authHeader: params.authHeader,
    dream: params.dream,
    interpretation: reflectionResult.text,
  });
  return { text: reflectionResult.text, extraction: extractionResult.extraction };
}

export type DreamReflectionResult = {
  text: string;
  cost: AiCallCost | null;
  reflectiveQuestions: string[];
};
/** @deprecated Use DreamReflectionResult. Kept for gateway log compatibility during restore. */
export type DreamReflectionEditorialArcResult = DreamReflectionResult;

function visibleSameCallReadingStream(accumulated: string): string {
  return visibleEditorialArcReading(accumulated, END_MARKER_DREAM_READING);
}

function finalizeSameCallReading(params: {
  content: string;
  cost: AiCallCost | null;
  depth: 'quick' | 'standard' | 'advanced';
}): { text: string; reflectiveQuestions: string[]; cost: AiCallCost | null } {
  const reading = stripEndMarker(
    visibleEditorialArcReading(params.content, END_MARKER_DREAM_READING) || params.content,
    END_MARKER_DREAM_READING
  ).trim();
  if (!reading) {
    throw new HttpError(502, 'AI proxy returned empty reading');
  }
  return {
    text: reading,
    reflectiveQuestions: extractSameCallReflectiveQuestions(reading, params.depth),
    cost: params.cost,
  };
}

export async function generateDreamReflectionWithCost(params: {
  authHeader: string;
  dream: DreamRecord;
  depth: 'quick' | 'standard' | 'advanced';
  onProgress?: ReflectionProgressCallback;
}): Promise<DreamReflectionResult> {
  const request = buildReflectionMessages(params.dream, params.depth);
  const onProgress = params.onProgress
    ? async (progress: Parameters<NonNullable<ReflectionProgressCallback>>[0]) => {
        await params.onProgress?.({
          ...progress,
          text: visibleSameCallReadingStream(progress.text),
        });
      }
    : undefined;

  const streamedOrComplete = onProgress
    ? await invokeOpenAiProxyStream({
        authHeader: params.authHeader,
        ...request,
        onProgress,
      })
    : await invokeOpenAiProxy({
        authHeader: params.authHeader,
        ...request,
      }).then((payload) => ({
        content: extractContent(payload),
        cost: aiCallCostFromPayload(payload),
      }));

  const reading = finalizeSameCallReading({
    content: streamedOrComplete.content,
    cost: streamedOrComplete.cost,
    depth: params.depth,
  });
  console.log('[billing-ai] same-call reflective questions', {
    methodId: SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
    depth: params.depth,
    questionCount: reading.reflectiveQuestions.length,
  });
  return reading;
}

export async function generateDreamReflection(params: {
  authHeader: string;
  dream: DreamRecord;
  depth: 'quick' | 'standard' | 'advanced';
}): Promise<string> {
  const result = await generateDreamReflectionWithCost(params);
  return result.text;
}

export async function generateDreamExtractionWithCost(params: {
  authHeader: string;
  dream: DreamRecord;
  interpretation: string;
  debugInterpretiveEchoes?: boolean;
  debugFaultInjectionCase?: 'invalid_archetype' | 'invalid_myth' | 'mixed_optional' | 'all_optional_invalid' | null;
}): Promise<{
  extraction: ExtractionResult;
  cost: AiCallCost | null;
  diagnostics: InterpretiveEchoDiagnostics | null;
  model: string | null;
  /** Pre-validator model selection counts (debug only). */
  preValidation?: {
    archetypesCount: number;
    amplificationsCount: number;
  };
  /** Dev/debug mythic pipeline stages — never persist. */
  mythicPipelineDebug?: MythicEchoPipelineDebugPacket | null;
  outputLanguageCommit?: OutputLanguageCommitTelemetry | null;
  structuredValidation?: Record<string, unknown> | null;
}> {
  const debugInterpretiveEchoes = Boolean(params.debugInterpretiveEchoes);
  const prepared = buildExtractionMessages(params.dream, params.interpretation, { debugInterpretiveEchoes });
  const targetOutputLanguage = resolveDreamOutputLanguage(
    typeof params.dream.content === 'string' ? params.dream.content : ''
  );

  const extractionPayload = await invokeOpenAiProxy({
    authHeader: params.authHeader,
    ...prepared,
  });
  let content = extractContent(extractionPayload);
  content = applyDebugEchoFaultInjection(content, params.debugFaultInjectionCase ?? null);
  let costs: Array<AiCallCost | null> = [aiCallCostFromPayload(extractionPayload)];

  const firstValidated = validateStructuredTaskContent('dream_extraction', content, {
    provider: 'openai-or-fallback',
  });
  if (!firstValidated.ok) {
    throw new HttpError(502, 'AI extraction returned invalid JSON', {
      failureCode: 'structured_schema_invalid',
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      promptId: DREAM_EXTRACTION_PROMPT_ID,
      schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
      schemaErrors: firstValidated.schemaErrors.slice(0, 12),
      ...safeAssistantJsonDiagnostics(content),
    });
  }

  const languageGate = await runOutputLanguageCommitGate({
    parsed: firstValidated.data as Record<string, unknown>,
    target: targetOutputLanguage,
    repairOnce: async ({ messages, expectedPaths }) => {
      // Field-scoped repair only — not a second full extraction.
      // Proxy skips schema validation; gateway validates locally as
      // Record<ExactRequestedFieldPath, NonEmptyString>.
      const repairPayload = await invokeOpenAiProxy({
        authHeader: params.authHeader,
        task: 'dream_extraction',
        messages,
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        tokenLimit: Math.min(prepared.tokenLimit, 1200),
        responseFormat: { type: 'json_object' },
        timeoutMs: prepared.timeoutMs,
        skipStructuredValidation: true,
      });
      costs.push(aiCallCostFromPayload(repairPayload));
      const repairContent = extractContent(repairPayload);
      let parsedRepair: unknown;
      try {
        parsedRepair = JSON.parse(repairContent);
      } catch {
        console.log('[billing-ai] language_repair_payload_invalid_json', {
          expectedPathCount: expectedPaths.length,
        });
        return null;
      }
      const validated = validateLanguageRepairFieldMap(parsedRepair, expectedPaths);
      if (!validated) {
        console.log('[billing-ai] language_repair_payload_rejected', {
          expectedPathCount: expectedPaths.length,
          expectedPaths: expectedPaths.slice(0, 12),
        });
        return null;
      }
      return validated;
    },
  });

  console.log('[billing-ai] output_language_commit_gate', languageGate.telemetry);

  if (!languageGate.ok) {
    throw new HttpError(502, 'AI extraction failed output-language validation', {
      failureCode: 'language_validation_failed',
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      promptId: DREAM_EXTRACTION_PROMPT_ID,
      schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
      ...languageGate.telemetry,
    });
  }

  // Re-serialize the gated packet so parseExtraction + validators see only commit-allowed JSON.
  content = JSON.stringify(languageGate.parsed);
  const rawModelObject = debugInterpretiveEchoes ? languageGate.parsed : null;
  const parsed = parseExtraction(content, {
    failOnInvalidOrEmpty: true,
    captureDiagnostics: debugInterpretiveEchoes,
  });

  return finalizeExtractionAfterParse({
    params,
    content,
    parsed,
    extractionPayload,
    costs,
    debugInterpretiveEchoes,
    targetOutputLanguage,
    outputLanguageCommit: languageGate.telemetry,
    rawModelObject,
    structuredValidation: safeStructuredValidationLog(firstValidated.log),
  });
}

function applyDebugEchoFaultInjection(
  content: string,
  faultCase: 'invalid_archetype' | 'invalid_myth' | 'mixed_optional' | 'all_optional_invalid' | null
): string {
  if (!faultCase) return content;
  const parsed = tryParseRawModelObject(content);
  if (!parsed) return content;

  const invalidArchetype = {
    archetype_id: 'public_role_or_social_mask',
    expression: 'invalid test row',
    mechanism_tags: ['invalid_test_tag'],
    evidence_ids: ['D1'],
    resonance: 'invalid test row with a non-catalog archetype id',
    confidence: 'medium',
  };
  const invalidMyth = {
    catalog_id: 'invalid.test_myth',
    resonance: 'invalid test row',
    divergence: 'invalid test row',
    evidence_ids: ['D2'],
    confidence: 'medium',
  };

  const next: Record<string, unknown> = {
    ...parsed,
    archetypes: Array.isArray(parsed.archetypes) ? [...parsed.archetypes] : [],
    amplifications: Array.isArray(parsed.amplifications) ? [...parsed.amplifications] : [],
  };

  switch (faultCase) {
    case 'invalid_archetype':
      (next.archetypes as unknown[]).push(invalidArchetype);
      break;
    case 'invalid_myth':
      (next.amplifications as unknown[]).push(invalidMyth);
      break;
    case 'mixed_optional':
      (next.archetypes as unknown[]).push(invalidArchetype);
      (next.amplifications as unknown[]).push(invalidMyth);
      break;
    case 'all_optional_invalid':
      next.archetypes = [invalidArchetype];
      next.amplifications = [invalidMyth];
      break;
  }

  console.log('[billing-ai] debug_optional_echo_fault_injection', {
    faultCase,
    archetypesCount: Array.isArray(next.archetypes) ? next.archetypes.length : 0,
    amplificationsCount: Array.isArray(next.amplifications) ? next.amplifications.length : 0,
  });

  return JSON.stringify(next);
}

function sumAiCallCosts(costs: Array<AiCallCost | null>): AiCallCost | null {
  const present = costs.filter((c): c is AiCallCost => Boolean(c));
  if (present.length === 0) return null;
  if (present.length === 1) return present[0];
  const first = present[0];
  const sumNullable = (pick: (c: AiCallCost) => number | null) => {
    const values = present.map(pick).filter((v): v is number => typeof v === 'number');
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  return {
    ...first,
    inputTokens: present.reduce((sum, c) => sum + (c.inputTokens ?? 0), 0),
    cachedInputTokens: present.reduce((sum, c) => sum + (c.cachedInputTokens ?? 0), 0),
    billableInputTokens: present.reduce((sum, c) => sum + (c.billableInputTokens ?? 0), 0),
    outputTokens: present.reduce((sum, c) => sum + (c.outputTokens ?? 0), 0),
    totalTokens: present.reduce((sum, c) => sum + (c.totalTokens ?? 0), 0),
    inputUsd: sumNullable((c) => c.inputUsd),
    cachedInputUsd: sumNullable((c) => c.cachedInputUsd),
    outputUsd: sumNullable((c) => c.outputUsd),
    estimatedUsd: sumNullable((c) => c.estimatedUsd),
  };
}

function isDedicatedArchetypeRetryableError(error: unknown): boolean {
  if (!(error instanceof HttpError)) return false;
  const details =
    error.details && typeof error.details === 'object'
      ? (error.details as Record<string, unknown>)
      : null;
  const failureCode = typeof details?.failureCode === 'string' ? details.failureCode : null;
  return (
    error.status >= 500 ||
    failureCode === 'structured_schema_invalid' ||
    failureCode === 'language_validation_failed' ||
    failureCode === 'archetype_recognition_invalid' ||
    failureCode === 'archetype_adjudication_invalid' ||
    failureCode === 'archetype_pipeline_invalid'
  );
}

async function runDedicatedArchetypePipelineOnce(params: {
  authHeader: string;
  dream: DreamRecord;
}): Promise<Omit<DedicatedArchetypePipelineResult, 'attempts'>> {
  const recognitionPrompt = buildArchetypeRecognitionUserPrompt({
    dreamText: params.dream.content,
  });
  const recognitionPayload = await invokeOpenAiProxy({
    authHeader: params.authHeader,
    task: 'dream_archetype_recognition',
    messages: [
      {
        role: 'system',
        content: buildArchetypeRecognitionSystemPrompt(recognitionPrompt.targetLanguage),
      },
      { role: 'user', content: recognitionPrompt.prompt },
    ],
    temperature: ARCHETYPE_RECOGNITION_TEMPERATURE,
    tokenLimit: ARCHETYPE_RECOGNITION_TOKEN_LIMIT,
    responseFormat: buildArchetypeRecognitionResponseFormat(),
  });
  const recognitionContent = extractContent(recognitionPayload);
  const recognitionValidated = validateArchetypeRecognitionResponse(recognitionContent, {
    dreamText: params.dream.content,
  });
  if (!recognitionValidated.ok) {
    throw new HttpError(502, 'Dedicated archetype recognition returned invalid JSON', {
      failureCode: 'archetype_recognition_invalid',
      promptId: ARCHETYPE_RECOGNITION_PROMPT_ID,
      promptVersion: ARCHETYPE_RECOGNITION_PROMPT_VERSION,
      schemaVersion: ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
      recognitionCatalogVersion: ARCHETYPE_RECOGNITION_CATALOG_VERSION,
      issues: recognitionValidated.issues,
      errors: recognitionValidated.errors.slice(0, 12),
    });
  }

  const discoveryResponse = recognitionValidated.data;
  if (discoveryResponse.archetypes.length === 0) {
    return {
      archetypes: [],
      cost: sumAiCallCosts([aiCallCostFromPayload(recognitionPayload)]),
      status: 'empty',
      discoveryCount: 0,
      acceptedCount: 0,
    };
  }

  const adjudicationPrompt = buildArchetypeAdjudicationUserPrompt({
    dreamText: params.dream.content,
    discoveryResponse,
  });
  const adjudicationPayload = await invokeOpenAiProxy({
    authHeader: params.authHeader,
    task: 'dream_archetype_adjudication',
    messages: [
      {
        role: 'system',
        content: buildArchetypeAdjudicationSystemPrompt(adjudicationPrompt.targetLanguage),
      },
      { role: 'user', content: adjudicationPrompt.prompt },
    ],
    temperature: ARCHETYPE_ADJUDICATION_TEMPERATURE,
    tokenLimit: ARCHETYPE_ADJUDICATION_TOKEN_LIMIT,
    responseFormat: buildArchetypeAdjudicationResponseFormat(),
  });
  const adjudicationContent = extractContent(adjudicationPayload);
  const adjudicationValidated = validateArchetypeAdjudicationResponse(adjudicationContent, {
    dreamText: params.dream.content,
  });
  if (!adjudicationValidated.ok) {
    throw new HttpError(502, 'Dedicated archetype adjudication returned invalid JSON', {
      failureCode: 'archetype_adjudication_invalid',
      promptId: ARCHETYPE_ADJUDICATION_PROMPT_ID,
      promptVersion: ARCHETYPE_ADJUDICATION_PROMPT_VERSION,
      schemaVersion: ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
      boundaryCatalogVersion: ARCHETYPE_BOUNDARY_CATALOG_VERSION,
      issues: adjudicationValidated.issues,
      errors: adjudicationValidated.errors.slice(0, 12),
    });
  }

  const applied = applyArchetypeAdjudicationToRecognition(
    discoveryResponse,
    adjudicationValidated.data
  );
  if (!applied.ok) {
    throw new HttpError(502, 'Dedicated archetype pipeline returned inconsistent decisions', {
      failureCode: 'archetype_pipeline_invalid',
      issues: applied.issues,
      errors: applied.errors.slice(0, 12),
    });
  }

  const archetypes = mapAdjudicatedRecognitionToArchetypalEchoes(
    discoveryResponse,
    adjudicationValidated.data,
    {
      dreamText: params.dream.content,
      archetypeCatalogVersion: ARCHETYPE_RECOGNITION_CATALOG_VERSION,
    }
  );

  return {
    archetypes,
    cost: sumAiCallCosts([
      aiCallCostFromPayload(recognitionPayload),
      aiCallCostFromPayload(adjudicationPayload),
    ]),
    status: archetypes.length > 0 ? 'ready' : 'empty',
    discoveryCount: discoveryResponse.archetypes.length,
    acceptedCount: archetypes.length,
  };
}

async function generateDedicatedArchetypesWithCost(params: {
  authHeader: string;
  dream: DreamRecord;
}): Promise<DedicatedArchetypePipelineResult> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= DEDICATED_ARCHETYPE_PIPELINE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await runDedicatedArchetypePipelineOnce(params);
      console.log('[billing-ai] dedicated_archetype_pipeline', {
        status: result.status,
        attempts: attempt,
        discoveryCount: result.discoveryCount,
        acceptedCount: result.acceptedCount,
        recognitionPromptId: ARCHETYPE_RECOGNITION_PROMPT_ID,
        recognitionPromptVersion: ARCHETYPE_RECOGNITION_PROMPT_VERSION,
        recognitionSchemaVersion: ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
        recognitionCatalogVersion: ARCHETYPE_RECOGNITION_CATALOG_VERSION,
        adjudicationPromptId: ARCHETYPE_ADJUDICATION_PROMPT_ID,
        adjudicationPromptVersion: ARCHETYPE_ADJUDICATION_PROMPT_VERSION,
        adjudicationSchemaVersion: ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
        boundaryCatalogVersion: ARCHETYPE_BOUNDARY_CATALOG_VERSION,
        estimatedUsd: result.cost?.estimatedUsd ?? null,
      });
      return { ...result, attempts: attempt };
    } catch (error) {
      lastError = error;
      const retryable = isDedicatedArchetypeRetryableError(error);
      console.error('[billing-ai] dedicated_archetype_pipeline_failed', {
        attempt,
        retryable,
        message: error instanceof Error ? error.message : 'Unknown dedicated archetype pipeline error',
      });
      if (!retryable || attempt >= DEDICATED_ARCHETYPE_PIPELINE_MAX_ATTEMPTS) break;
    }
  }

  if (lastError instanceof HttpError) {
    const details =
      lastError.details && typeof lastError.details === 'object'
        ? (lastError.details as Record<string, unknown>)
        : {};
    throw new HttpError(502, 'Dedicated archetype pipeline failed after retry', {
      failureCode: 'dedicated_archetype_pipeline_failed',
      attempts: DEDICATED_ARCHETYPE_PIPELINE_MAX_ATTEMPTS,
      ...details,
    });
  }

  throw new HttpError(502, 'Dedicated archetype pipeline failed after retry', {
    failureCode: 'dedicated_archetype_pipeline_failed',
    attempts: DEDICATED_ARCHETYPE_PIPELINE_MAX_ATTEMPTS,
  });
}

async function finalizeExtractionAfterParse(args: {
  params: {
    authHeader: string;
    dream: DreamRecord;
    interpretation: string;
    debugInterpretiveEchoes?: boolean;
    debugFaultInjectionCase?: 'invalid_archetype' | 'invalid_myth' | 'mixed_optional' | 'all_optional_invalid' | null;
  };
  content: string;
  parsed: ReturnType<typeof parseExtraction>;
  extractionPayload: Record<string, unknown>;
  costs: Array<AiCallCost | null>;
  debugInterpretiveEchoes: boolean;
  targetOutputLanguage: ReturnType<typeof resolveDreamOutputLanguage>;
  outputLanguageCommit: OutputLanguageCommitTelemetry | null;
  rawModelObject?: Record<string, unknown> | null;
  structuredValidation?: Record<string, unknown> | null;
}): Promise<{
  extraction: ExtractionResult;
  cost: AiCallCost | null;
  diagnostics: InterpretiveEchoDiagnostics | null;
  model: string | null;
  preValidation?: { archetypesCount: number; amplificationsCount: number };
  mythicPipelineDebug?: MythicEchoPipelineDebugPacket | null;
  outputLanguageCommit?: OutputLanguageCommitTelemetry | null;
  structuredValidation?: Record<string, unknown> | null;
  dedicatedArchetypePipeline?: DedicatedArchetypePipelineResult | null;
}> {
  const {
    params,
    content,
    parsed,
    extractionPayload,
    costs,
    debugInterpretiveEchoes,
    targetOutputLanguage,
    outputLanguageCommit,
    structuredValidation,
  } = args;

  const rawForLanguage =
    args.rawModelObject ??
    (() => {
      try {
        return JSON.parse(content) as Record<string, unknown>;
      } catch {
        return null;
      }
    })();

  const recoveredRawArchetypeCandidates =
    parsed.extraction.archetypes.length > 0
      ? [...parsed.extraction.archetypes]
      : archetypesWithEvaluation(rawForLanguage?.archetypes);

  const preValidation = {
    archetypesCount: recoveredRawArchetypeCandidates.length,
    amplificationsCount: parsed.extraction.amplifications.length,
  };
  const normalizedAmplificationsBeforeValidation = [...parsed.extraction.amplifications];

  const rawArchetypeCandidates = recoveredRawArchetypeCandidates;

  const archetypeValidation = validateArchetypalEchoes(
    rawArchetypeCandidates as Array<ArchetypalEcho & { evaluation?: unknown }>,
    { max: MAX_ARCHETYPAL_ECHOES }
  );
  const monolithicArchetypes = archetypeValidation.accepted.map(toPersistedArchetypalEcho);
  const dedicatedArchetypePipeline = await generateDedicatedArchetypesWithCost({
    authHeader: params.authHeader,
    dream: params.dream,
  });
  parsed.extraction.archetypes = dedicatedArchetypePipeline.archetypes;
  costs.push(dedicatedArchetypePipeline.cost);

  const closedMythicValidation = validateClosedCatalogMythicEchoes(
    Array.isArray(parsed.parsedAmplificationsBeforeNormalize)
      ? parsed.parsedAmplificationsBeforeNormalize
      : parsed.extraction.amplifications,
    {
      dreamText: typeof params.dream.content === 'string' ? params.dream.content : '',
      max: MAX_MYTHIC_ECHOES,
    }
  );
  const mythicValidation = closedMythicValidationForDebug(closedMythicValidation);
  const postValidationAmplifications = closedMythicValidation.accepted.map(
    toPersistedClosedMythicEcho
  );
  parsed.extraction.amplifications = postValidationAmplifications;

  const outputLanguageTelemetry =
    outputLanguageCommit ??
    (rawForLanguage && typeof rawForLanguage === 'object'
      ? auditDreamExtractionOutputLanguage(rawForLanguage, targetOutputLanguage)
      : null);

  console.log('[billing-ai] interpretive_echo_validators', {
    promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
    schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
    archetypesAccepted: archetypeValidation.accepted.length,
    archetypesRejected: archetypeValidation.rejected.length,
    archetypeRejectReasons: archetypeValidation.rejected.map((r) => r.reason).slice(0, 6),
    monolithicArchetypesAccepted: monolithicArchetypes.length,
    dedicatedArchetypeStatus: dedicatedArchetypePipeline.status,
    dedicatedArchetypeAttempts: dedicatedArchetypePipeline.attempts,
    dedicatedArchetypeDiscoveryCount: dedicatedArchetypePipeline.discoveryCount,
    dedicatedArchetypeAcceptedCount: dedicatedArchetypePipeline.acceptedCount,
    outputLanguageTelemetry,
    outputLanguageCommit,
    heroTelemetry: summarizeHeroArchetypeTelemetry({
      rawCandidates: rawArchetypeCandidates,
      validation: archetypeValidation,
    }),
    mythicAccepted: mythicValidation.accepted.length,
    mythicRejected: mythicValidation.rejected.length,
    mythicRejectReasons: mythicValidation.rejected.map((r) => r.reason).slice(0, 6),
    mythicCatalogLogs: closedMythicValidation.logs.slice(0, 4),
  });

  let mythicPipelineDebug: MythicEchoPipelineDebugPacket | null = null;
  if (debugInterpretiveEchoes) {
    const enforced = applyMythicAuditProductionInvariant({
      diagnostics: parsed.diagnostics,
      amplifications: parsed.extraction.amplifications,
      enforce: true,
    });
    parsed.extraction.amplifications = enforced.amplifications;
    mythicPipelineDebug = buildMythicEchoPipelineDebugPacket({
      rawModelObject: args.rawModelObject ?? rawForLanguage,
      parsedAmplifications: parsed.parsedAmplificationsBeforeNormalize,
      normalizedBeforeValidation: normalizedAmplificationsBeforeValidation,
      mythicValidation,
      postValidationAmplifications,
      diagnostics: parsed.diagnostics,
      invariantClearedAmplifications: enforced.cleared,
    });
    console.log('[billing-ai] mythic_echo_pipeline_debug', mythicPipelineDebug);
    if (!enforced.consistency.ok) {
      console.error('[billing-ai] mythic_audit_production_invariant_failed', {
        promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
        ...enforced.consistency,
        note: 'Cleared mismatched production amplifications in debug; did not rewrite title/tradition.',
      });
    }
  }

  const model =
    typeof (extractionPayload as { model?: unknown })?.model === 'string'
      ? ((extractionPayload as { model: string }).model)
      : null;
  if (debugInterpretiveEchoes) {
    console.log('[billing-ai] interpretive_echo_diagnostics', {
      promptVersion: DREAM_EXTRACTION_PROMPT_VERSION,
      promptId: DREAM_EXTRACTION_PROMPT_ID,
      schemaVersion: DREAM_EXTRACTION_SCHEMA_VERSION,
      model,
      ...safeInterpretiveDiagnosticsLog(parsed.diagnostics),
      preValidation,
      interpretive_diagnostics: parsed.diagnostics,
      post_validation_archetypes: parsed.extraction.archetypes,
      post_validation_amplifications: postValidationAmplifications,
      mythic_echo_pipeline: mythicPipelineDebug,
      persisted_amplifications_after_invariant: parsed.extraction.amplifications,
    });
  }
  return {
    extraction: parsed.extraction,
    cost: sumAiCallCosts(costs),
    diagnostics: parsed.diagnostics,
    model,
    preValidation,
    mythicPipelineDebug,
    outputLanguageCommit,
    structuredValidation: structuredValidation ?? null,
    dedicatedArchetypePipeline,
  };
}

export async function generateDreamExtraction(params: {
  authHeader: string;
  dream: DreamRecord;
  interpretation: string;
  debugInterpretiveEchoes?: boolean;
}): Promise<ExtractionResult> {
  const result = await generateDreamExtractionWithCost(params);
  return result.extraction;
}

export async function generateFollowupReply(params: {
  authHeader: string;
  dream: DreamRecord;
  conversation: ChatMessage[];
  userMessage: string;
  assistantRepliesUsed: number;
  assistantRepliesLimit: number;
}): Promise<{ text: string; reflectiveQuestions: string[]; cost: AiCallCost | null }> {
  const isFinalResponse = params.assistantRepliesUsed + 1 >= params.assistantRepliesLimit;
  const request = buildFollowupMessages(
    params.dream,
    params.conversation,
    params.userMessage,
    isFinalResponse
  );
  const payload = await invokeOpenAiProxy({
    authHeader: params.authHeader,
    ...request,
  });
  const text = extractContent(payload).trim();
  if (!text) {
    throw new HttpError(502, 'AI proxy returned empty follow-up reply');
  }
  return {
    text,
    reflectiveQuestions: extractSameCallReflectiveQuestions(text, 'chat', {
      isFinalChat: isFinalResponse,
    }),
    cost: aiCallCostFromPayload(payload),
  };
}

type EssayProxyRequest = {
  task: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  tokenLimit: number;
};

function essayPayloadIsTruncated(payload: Record<string, unknown>): boolean {
  const choices = Array.isArray(payload.choices) ? payload.choices as Array<Record<string, unknown>> : [];
  const finishReason = choices[0]?.finish_reason;
  return finishReason === 'length' || finishReason === 'max_tokens';
}

async function generateEssayWithOperationalRetry(params: {
  authHeader: string;
  request: EssayProxyRequest;
  retryTokenLimit: number;
  lengthPolicy: EssayLengthPolicy;
  language: string;
  essayKind: 'period' | 'recent';
}): Promise<{ content: string; cost: AiCallCost | null }> {
  const primaryPayload = await invokeOpenAiProxy({
    authHeader: params.authHeader,
    ...params.request,
  });
  const primaryMarkedContent = extractContent(primaryPayload);
  const primaryIncomplete =
    essayPayloadIsTruncated(primaryPayload) || !primaryMarkedContent.includes(END_MARKER_DREAM_ESSAY);
  const primaryTooLong = essayExceedsHardMaximum(
    primaryMarkedContent,
    params.lengthPolicy,
    params.language
  );

  if (!primaryIncomplete && !primaryTooLong) {
    return {
      content: stripEndMarker(primaryMarkedContent, END_MARKER_DREAM_ESSAY),
      cost: aiCallCostFromPayload(primaryPayload),
    };
  }

  console.log('[billing-ai] pattern essay compact retry start', {
    essayKind: params.essayKind,
    retryReason: primaryIncomplete ? 'incomplete' : 'length_overflow',
    wordCount: countRenderedEssayWords(primaryMarkedContent, params.language),
    hardMaximum: params.lengthPolicy.hardMaximum,
  });

  const retryPayload = await invokeOpenAiProxy({
    authHeader: params.authHeader,
    task: 'pattern_insights_retry_compact',
    messages: [
      ...params.request.messages,
      { role: 'system', content: buildEssayCompressionRetryPrompt(params.lengthPolicy) },
    ],
    temperature: ESSAY_COMPRESSION_RETRY_TEMPERATURE,
    tokenLimit: params.retryTokenLimit,
  });
  const retryMarkedContent = extractContent(retryPayload);
  if (essayPayloadIsTruncated(retryPayload) || !retryMarkedContent.includes(END_MARKER_DREAM_ESSAY)) {
    throw new HttpError(502, 'AI proxy returned an incomplete compact essay');
  }

  const retryWordCount = countRenderedEssayWords(retryMarkedContent, params.language);
  const beyondTolerance = essayExceedsRetryTolerance(
    retryMarkedContent,
    params.lengthPolicy,
    params.language
  );
  console.log('[billing-ai] pattern essay compact retry done', {
    essayKind: params.essayKind,
    retryReason: primaryIncomplete ? 'incomplete' : 'length_overflow',
    wordCount: retryWordCount,
    hardMaximum: params.lengthPolicy.hardMaximum,
    retryToleranceCeiling: params.lengthPolicy.retryToleranceCeiling,
    beyondTolerance,
  });

  return {
    content: stripEndMarker(retryMarkedContent, END_MARKER_DREAM_ESSAY),
    cost: sumAiCallCosts([
      aiCallCostFromPayload(primaryPayload),
      aiCallCostFromPayload(retryPayload),
    ]),
  };
}

export async function generateRecentReflection(
  authHeader: string,
  entries: PatternEntry[],
  language: string
): Promise<{ content: string; cost: AiCallCost | null }> {
  return generateEssayWithOperationalRetry({
    authHeader,
    request: buildRecentEssayMessages(entries, language),
    retryTokenLimit: 1100,
    lengthPolicy: RECENT_DREAM_FIELD_LENGTH_POLICY,
    language,
    essayKind: 'recent',
  });
}

export async function generatePeriodReflection(
  authHeader: string,
  entries: PatternEntry[],
  scope: PeriodReflectionPromptScope,
  language: string
): Promise<{ content: string; cost: AiCallCost | null }> {
  const lengthPolicy = getPeriodEssayLengthPolicy(entries.length);
  return generateEssayWithOperationalRetry({
    authHeader,
    request: buildPeriodEssayMessages(entries, scope, language),
    retryTokenLimit: entries.length >= 5 ? 1700 : entries.length >= 2 ? 1300 : 850,
    lengthPolicy,
    language,
    essayKind: 'period',
  });
}

export function buildRecentScope(entries: PatternEntry[], count: number): string {
  return getRecentSequenceScopeKey(entries.map((entry) => entry.dreamId), count);
}

export function buildMonthScope(
  monthKey: string,
  timeZone: string,
  cadence: 'monthly' | 'weekly' | null = 'weekly'
): {
  scopeKey: string;
  startDate: string;
  endDate: string;
  isCurrentMonth: boolean;
  kind: Extract<PeriodEssayScope, 'weekly' | 'monthly'>;
} {
  const now = new Date();
  const current =
    cadence === 'monthly'
      ? buildCurrentMonthMonthlyScope(now, timeZone)
      : buildCurrentMonthScope(now, timeZone);
  if (monthKey === current.monthKey) {
    return {
      scopeKey: current.scopeKey,
      startDate: current.startDate,
      endDate: current.endDate,
      isCurrentMonth: true,
      kind: cadence === 'monthly' ? 'monthly' : 'weekly',
    };
  }

  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    scopeKey: monthKey,
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${String(lastDay).padStart(2, '0')}`,
    isCurrentMonth: false,
    kind: 'monthly',
  };
}
