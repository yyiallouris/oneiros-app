import { LocalStorage } from './localStorage';
import { StorageService } from './storageService';
import {
  createIdempotencyKey,
  invokeAiEntitlementsGateway,
} from './subscriptionService';
import {
  remoteGetInterpretationByDreamId,
  remoteGetInterpretationById,
} from './remoteStorage';
import { getRecentPatternInsightEntries, getRecentSequenceScopeKey, type RecentDreamFieldCount } from './patternInsightsService';
import { logInfo, logWarn } from './logger';
import type { Dream, Interpretation } from '../types/dream';
import type { GatewayAction } from '../billing/types';
import type { PatternInsightDreamEntry } from './ai';

type GatewayDeniedResponse = {
  status: 'denied' | 'released' | 'pending';
  reason?: string | null;
  quota_event_id?: string;
  partial_reflection?: string;
  partial_reflection_updated_at?: string;
  partial_reflection_done?: boolean;
  partial_reflection_cost_usd?: number | null;
};

type GatewayReflectionResponse = {
  status: 'committed';
  interpretation_id: string;
  reflection: string;
  interpretation?: Interpretation;
  reflection_ai_ms?: number;
  save_reflection_ms?: number;
  reflection_ai_cost?: Record<string, unknown> | null;
  reflection_cost_usd?: number | null;
};

type GatewayReflectionPendingResponse = {
  status: 'pending';
  quota_event_id: string;
  partial_reflection?: string;
  partial_reflection_updated_at?: string;
  partial_reflection_done?: boolean;
  partial_reflection_cost_usd?: number | null;
};

type GatewayReflectionStatusResponse =
  | GatewayReflectionResponse
  | GatewayReflectionPendingResponse
  | GatewayDeniedResponse;

type GatewayMetadataResponse = {
  status: 'committed';
  interpretation_id: string;
  metadata_status: 'ready' | 'failed';
  metadata_ai_cost?: Record<string, unknown> | null;
  metadata_cost_usd?: number | null;
  reflection_ai_cost?: Record<string, unknown> | null;
  reflection_cost_usd?: number | null;
  total_ai_cost_usd?: number | null;
};

type GatewayFollowupResponse = {
  status: 'committed';
  interpretation_id: string;
  assistant_reply: string;
};

type GatewayArtifactResponse = {
  status: 'committed' | 'cached';
  artifact_id?: string;
  content: string;
  scope_key: string;
  recent_dream_field_ai_cost?: Record<string, unknown> | null;
  recent_dream_field_cost_usd?: number | null;
  period_reflection_ai_cost?: Record<string, unknown> | null;
  period_reflection_cost_usd?: number | null;
};

const PREMIUM_REQUIRED_REASONS = new Set([
  'paid_subscription_required',
  'paid_reflection_read_only_after_lapse',
]);

const READ_ONLY_REASONS = new Set([
  'paid_reflection_read_only_after_lapse',
]);

const METADATA_EXTRACTION_RETRY_DELAYS_MS = [0, 15000, 45000];
const REFLECTION_STATUS_MAX_ATTEMPTS = 90;
const REFLECTION_STATUS_POLL_DELAY_MS = 1000;
const REFLECTION_PARTIAL_REVEAL_AFTER_MS = 15000;
const metadataExtractionInFlight = new Map<string, Promise<GatewayMetadataResponse | null>>();

export type DreamReflectionProgress = {
  text: string;
  elapsedMs: number;
  updatedAt?: string;
  done?: boolean;
  costUsd?: number | null;
};

export type EntitledDreamReflectionOptions = {
  onPartialReflection?: (progress: DreamReflectionProgress) => void;
};

export class EntitlementError extends Error {
  reason: string;
  premiumRequired: boolean;
  readOnlyAfterLapse: boolean;

  constructor(reason: string, message?: string) {
    super(message ?? toUserFacingError(reason));
    this.reason = reason;
    this.premiumRequired = PREMIUM_REQUIRED_REASONS.has(reason);
    this.readOnlyAfterLapse = READ_ONLY_REASONS.has(reason);
  }
}

function assertCommitted<T extends { status?: string }>(response: T | GatewayDeniedResponse): asserts response is T {
  if (!response || !response.status || response.status === 'committed' || response.status === 'cached') return;
  const deniedResponse = response as GatewayDeniedResponse;
  throw new EntitlementError(deniedResponse.reason ?? 'unknown_quota_error');
}

function toUserFacingError(reason: string): string {
  switch (reason) {
    case 'free_weekly_reflection_unavailable':
      return 'Free mode includes one reflection every 7 days. You can wait for the reset or upgrade to Premium.';
    case 'dream_reflection_quota_reached':
      return 'You have used all 60 Premium reflections for this billing cycle.';
    case 'chat_reply_limit_reached':
      return 'This reflection has reached its 5 follow-up replies.';
    case 'recent_dream_field_quota_reached':
      return 'You have used all 10 Recent Dream Field generations for this billing cycle.';
    case 'period_reflection_already_exists':
      return 'That period reflection already exists and can be reopened without spending quota.';
    case 'not_enough_reflected_dreams':
      return 'Reflect on at least 2 dreams in this period before generating a report.';
    case 'no_new_reflected_dream_since_last_generation':
      return 'Add at least one newly reflected dream before generating another current-month reflection.';
    case 'paid_reflection_read_only_after_lapse':
      return 'This premium reflection is now read-only until Premium is renewed.';
    case 'paid_subscription_required':
      return 'This action is available with Premium.';
    default:
      return 'This action is unavailable right now. Please try again later.';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncInterpretationByDreamId(dreamId: string): Promise<Interpretation> {
  const startedAt = Date.now();
  logInfo('dream_reflection_remote_sync_start', { dreamId });
  const interpretation = await remoteGetInterpretationByDreamId(dreamId);
  if (!interpretation) {
    throw new Error('The updated reflection could not be loaded.');
  }

  await StorageService.saveInterpretation(interpretation);
  triggerPendingDreamMetadataExtraction(interpretation);
  logInfo('dream_reflection_remote_sync_done', {
    dreamId,
    interpretationId: interpretation.id,
    metadataStatus: interpretation.metadata_status,
    durationMs: Date.now() - startedAt,
  });
  return interpretation;
}

async function syncInterpretationById(interpretationId: string): Promise<Interpretation> {
  const interpretation = await remoteGetInterpretationById(interpretationId);
  if (!interpretation) {
    throw new Error('The updated reflection could not be loaded.');
  }

  await StorageService.saveInterpretation(interpretation);
  return interpretation;
}

async function saveCommittedReflectionPayload(
  action: Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>,
  dreamId: string,
  response: GatewayReflectionResponse,
  totalStartedAt: number
): Promise<Interpretation> {
  logInfo('dream_reflection_gateway_committed', {
    action,
    dreamId,
    interpretationId: response.interpretation_id,
    hasDirectInterpretation: Boolean(response.interpretation),
    reflectionCostUsd: response.reflection_cost_usd,
    // Avoid keys containing "dream"/"interpretation" content patterns beyond ids —
    // flatten cost fields so the logger does not strip nested objects.
    costProvider: response.reflection_ai_cost?.provider ?? null,
    costModel: response.reflection_ai_cost?.model ?? null,
    costPricingModel: response.reflection_ai_cost?.pricingModel ?? null,
    costPricingSource: response.reflection_ai_cost?.pricingSource ?? null,
    costInputTokens: response.reflection_ai_cost?.inputTokens ?? null,
    costOutputTokens: response.reflection_ai_cost?.outputTokens ?? null,
    costTotalTokens: response.reflection_ai_cost?.totalTokens ?? null,
  });

  if (response.interpretation) {
    const saveStartedAt = Date.now();
    await LocalStorage.saveInterpretation(response.interpretation);
    logInfo('dream_reflection_direct_payload_saved', {
      action,
      dreamId,
      interpretationId: response.interpretation.id,
      metadataStatus: response.interpretation.metadata_status,
      saveLocalMs: Date.now() - saveStartedAt,
      totalMs: Date.now() - totalStartedAt,
    });
    triggerPendingDreamMetadataExtraction(response.interpretation);
    return response.interpretation;
  }

  const interpretation = await syncInterpretationByDreamId(dreamId);
  logInfo('dream_reflection_generate_done_with_remote_fallback', {
    action,
    dreamId,
    interpretationId: interpretation.id,
    totalMs: Date.now() - totalStartedAt,
  });
  return interpretation;
}

async function pollEntitledDreamReflection(params: {
  action: Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>;
  dreamId: string;
  quotaEventId: string;
  totalStartedAt: number;
  onPartialReflection?: (progress: DreamReflectionProgress) => void;
}): Promise<Interpretation> {
  let lastPartialText = '';
  for (let attempt = 0; attempt < REFLECTION_STATUS_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await delay(REFLECTION_STATUS_POLL_DELAY_MS);
    }

    const pollStartedAt = Date.now();
    const response = await invokeAiEntitlementsGateway<GatewayReflectionStatusResponse>({
      action: 'dream_reflection_status',
      idempotencyKey: createIdempotencyKey('dream_reflection_status', params.quotaEventId),
      dreamId: params.dreamId,
      quotaEventId: params.quotaEventId,
    });

    logInfo('dream_reflection_status_polled', {
      action: params.action,
      dreamId: params.dreamId,
      quotaEventId: params.quotaEventId,
      status: response.status,
      attempt: attempt + 1,
      durationMs: Date.now() - pollStartedAt,
      totalMs: Date.now() - params.totalStartedAt,
      reflectionAiMs: response.status === 'committed' ? response.reflection_ai_ms : undefined,
      saveReflectionMs: response.status === 'committed' ? response.save_reflection_ms : undefined,
      reflectionCostUsd: response.status === 'committed' ? response.reflection_cost_usd : undefined,
      partialReflectionLength: response.status === 'pending' ? response.partial_reflection?.length : undefined,
    });

    if (response.status === 'committed') {
      return saveCommittedReflectionPayload(params.action, params.dreamId, response, params.totalStartedAt);
    }

    if (
      response.status === 'pending' &&
      params.onPartialReflection &&
      Date.now() - params.totalStartedAt >= REFLECTION_PARTIAL_REVEAL_AFTER_MS &&
      typeof response.partial_reflection === 'string' &&
      response.partial_reflection.trim().length > 0 &&
      response.partial_reflection !== lastPartialText
    ) {
      lastPartialText = response.partial_reflection;
      params.onPartialReflection({
        text: response.partial_reflection,
        elapsedMs: Date.now() - params.totalStartedAt,
        updatedAt: response.partial_reflection_updated_at,
        done: response.partial_reflection_done,
        costUsd: response.partial_reflection_cost_usd,
      });
    }

    if (response.status === 'released' || response.status === 'denied') {
      throw new EntitlementError(response.reason ?? 'dream_reflection_generation_failed');
    }
  }

  throw new Error('The reflection is still being generated. Please reopen this dream in a moment.');
}

async function runMetadataExtractionWithRetry(interpretationId: string): Promise<GatewayMetadataResponse | null> {
  let lastError: unknown = null;

  for (const retryDelay of METADATA_EXTRACTION_RETRY_DELAYS_MS) {
    if (retryDelay > 0) {
      await delay(retryDelay);
    }

    const attemptStartedAt = Date.now();
    try {
      logInfo('dream_metadata_extract_attempt_start', {
        interpretationId,
        retryDelayMs: retryDelay,
      });
      const response = await invokeAiEntitlementsGateway<GatewayMetadataResponse | GatewayDeniedResponse>({
        action: 'dream_metadata_extract',
        idempotencyKey: createIdempotencyKey('dream_metadata_extract', interpretationId),
        interpretationId,
      });
      assertCommitted(response);
      logInfo('dream_metadata_extract_attempt_done', {
        interpretationId,
        metadataStatus: response.metadata_status,
        metadataCostUsd: response.metadata_cost_usd,
        // Flatten cost fields — logger redacts nested objects and "dream*" keys.
        costProvider: response.metadata_ai_cost?.provider ?? null,
        costModel: response.metadata_ai_cost?.model ?? null,
        costPricingModel: response.metadata_ai_cost?.pricingModel ?? null,
        costPricingSource: response.metadata_ai_cost?.pricingSource ?? null,
        costInputTokens: response.metadata_ai_cost?.inputTokens ?? null,
        costOutputTokens: response.metadata_ai_cost?.outputTokens ?? null,
        costTotalTokens: response.metadata_ai_cost?.totalTokens ?? null,
        reflectionCostUsd: response.reflection_cost_usd ?? null,
        reflectionCostModel: response.reflection_ai_cost?.model ?? null,
        totalAiCostUsd: response.total_ai_cost_usd,
        durationMs: Date.now() - attemptStartedAt,
      });
      return response;
    } catch (error) {
      lastError = error;
      if (error instanceof EntitlementError && error.reason === 'metadata_extraction_processing') {
        logInfo('dream_metadata_extract_already_processing', {
          interpretationId,
          retryDelayMs: retryDelay,
          durationMs: Date.now() - attemptStartedAt,
        });
        continue;
      }
      logWarn('dream_metadata_extract_attempt_failed', {
        interpretationId,
        retryDelayMs: retryDelay,
        durationMs: Date.now() - attemptStartedAt,
        message: error instanceof Error ? error.message : 'Unknown metadata extraction error',
      });
    }
  }

  if (lastError) {
    console.warn('[entitledAiService] Metadata extraction trigger failed', {
      interpretationId,
      message: lastError instanceof Error ? lastError.message : 'Unknown metadata extraction error',
    });
  }
  return null;
}

export function ensureDreamMetadataExtraction(interpretationId: string): Promise<GatewayMetadataResponse | null> {
  const existing = metadataExtractionInFlight.get(interpretationId);
  if (existing) {
    logInfo('dream_metadata_extract_deduped', { interpretationId });
    return existing;
  }

  logInfo('dream_metadata_extract_triggered', { interpretationId });
  const promise = runMetadataExtractionWithRetry(interpretationId).finally(() => {
    metadataExtractionInFlight.delete(interpretationId);
  });
  metadataExtractionInFlight.set(interpretationId, promise);
  return promise;
}

export function triggerDreamMetadataExtraction(interpretationId: string): boolean {
  if (metadataExtractionInFlight.has(interpretationId)) {
    logInfo('dream_metadata_extract_deduped', { interpretationId });
    return false;
  }
  void ensureDreamMetadataExtraction(interpretationId);
  return true;
}

export function triggerPendingDreamMetadataExtraction(
  interpretation: Pick<Interpretation, 'id' | 'metadata_status'>
): boolean {
  if (interpretation.metadata_status !== 'pending') return false;
  return triggerDreamMetadataExtraction(interpretation.id);
}

export async function generateEntitledDreamReflection(
  dream: Dream,
  depth: 'quick' | 'standard' | 'advanced',
  action: Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>,
  options: EntitledDreamReflectionOptions = {}
): Promise<Interpretation> {
  const totalStartedAt = Date.now();
  logInfo('dream_reflection_generate_start', {
    action,
    dreamId: dream.id,
    depth,
  });

  const gatewayStartedAt = Date.now();
  const response = await invokeAiEntitlementsGateway<GatewayReflectionResponse | GatewayReflectionPendingResponse | GatewayDeniedResponse>({
    action,
    idempotencyKey: createIdempotencyKey(action, dream.id),
    dreamId: dream.id,
    depth,
    async: true,
  });
  const gatewayDurationMs = Date.now() - gatewayStartedAt;

  if (response.status === 'pending') {
    const quotaEventId = response.quota_event_id;
    if (!quotaEventId) {
      throw new Error('Reflection started without a status reference. Please try again.');
    }
    logInfo('dream_reflection_async_started', {
      action,
      dreamId: dream.id,
      quotaEventId,
      gatewayDurationMs,
    });
    return pollEntitledDreamReflection({
      action,
      dreamId: dream.id,
      quotaEventId,
      totalStartedAt,
      onPartialReflection: options.onPartialReflection,
    });
  }

  assertCommitted(response);
  logInfo('dream_reflection_gateway_committed_after_sync_wait', {
    action,
    dreamId: dream.id,
    gatewayDurationMs,
    reflectionCostUsd: response.reflection_cost_usd,
  });
  return saveCommittedReflectionPayload(action, dream.id, response, totalStartedAt);
}

export async function generateEntitledFollowupReply(
  interpretationId: string,
  message: string
): Promise<Interpretation> {
  const response = await invokeAiEntitlementsGateway<GatewayFollowupResponse | GatewayDeniedResponse>({
    action: 'dream_followup_reply',
    idempotencyKey: createIdempotencyKey('dream_followup_reply', interpretationId),
    interpretationId,
    message,
  });

  assertCommitted(response);
  return syncInterpretationById(interpretationId);
}

function buildRecentReflectionCache(
  entries: PatternInsightDreamEntry[],
  count: RecentDreamFieldCount,
  language: string,
  content: string,
  scopeKey: string
) {
  return {
    id: `${scopeKey}:${language}`,
    scope_type: 'recent_sequence' as const,
    scope_key: scopeKey || getRecentSequenceScopeKey(entries.map((entry) => entry.dreamId), count),
    dream_ids: entries.map((entry) => entry.dreamId),
    dream_count: entries.length,
    language,
    content,
    generated_at: new Date().toISOString(),
  };
}

export async function generateEntitledRecentDreamField(
  count: RecentDreamFieldCount,
  language: string
): Promise<string> {
  const entries = await getRecentPatternInsightEntries(count);
  const response = await invokeAiEntitlementsGateway<GatewayArtifactResponse | GatewayDeniedResponse>({
    action: 'recent_dream_field_generate',
    idempotencyKey: createIdempotencyKey('recent_dream_field_generate', `${count}:${language}`),
    count,
    language,
  });

  assertCommitted(response);
  logInfo('recent_dream_field_gateway_committed', {
    status: response.status,
    scopeKey: response.scope_key,
    language,
    count,
    // Avoid keys containing "dream" — logger redacts those for privacy.
    costUsd: response.recent_dream_field_cost_usd ?? null,
    costProvider: response.recent_dream_field_ai_cost?.provider ?? null,
    costModel: response.recent_dream_field_ai_cost?.model ?? null,
    costPricingModel: response.recent_dream_field_ai_cost?.pricingModel ?? null,
    costPricingSource: response.recent_dream_field_ai_cost?.pricingSource ?? null,
    costInputTokens: response.recent_dream_field_ai_cost?.inputTokens ?? null,
    costOutputTokens: response.recent_dream_field_ai_cost?.outputTokens ?? null,
    costTotalTokens: response.recent_dream_field_ai_cost?.totalTokens ?? null,
  });
  const cache = buildRecentReflectionCache(entries, count, language, response.content, response.scope_key);
  await LocalStorage.saveRecentSequenceReflection(cache);
  return response.content;
}

export async function generateEntitledPeriodReflection(
  monthKey: string,
  language: string
): Promise<string> {
  const response = await invokeAiEntitlementsGateway<GatewayArtifactResponse | GatewayDeniedResponse>({
    action: 'period_reflection_generate',
    idempotencyKey: createIdempotencyKey('period_reflection_generate', `${monthKey}:${language}`),
    monthKey,
    language,
  });

  assertCommitted(response);
  logInfo('period_reflection_gateway_committed', {
    status: response.status,
    monthKey,
    scopeKey: response.scope_key,
    language,
    costUsd: response.period_reflection_cost_usd ?? null,
    costProvider: response.period_reflection_ai_cost?.provider ?? null,
    costModel: response.period_reflection_ai_cost?.model ?? null,
    costPricingModel: response.period_reflection_ai_cost?.pricingModel ?? null,
    costPricingSource: response.period_reflection_ai_cost?.pricingSource ?? null,
    costInputTokens: response.period_reflection_ai_cost?.inputTokens ?? null,
    costOutputTokens: response.period_reflection_ai_cost?.outputTokens ?? null,
    costTotalTokens: response.period_reflection_ai_cost?.totalTokens ?? null,
  });
  await LocalStorage.savePatternReport(response.scope_key || monthKey, response.content);
  return response.content;
}
