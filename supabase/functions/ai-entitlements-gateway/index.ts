import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { executeQuotaJob } from '../../../src/billing/runtime.ts';
import type { GatewayAction, QuotaReservation } from '../../../src/billing/types.ts';
import {
  buildMonthScope,
  buildRecentScope,
  type AiCallCost,
  emptyExtraction,
  generateDreamExtractionWithCost,
  generateDreamReflectionWithCost,
  generateFollowupReply,
  generatePeriodReflection,
  generateRecentReflection,
} from '../_shared/billing-ai.ts';
import {
  claimMetadataExtraction,
  commitQuota,
  finishMetadataExtraction,
  getDreamById,
  getInterpretationByDreamId,
  getInterpretationById,
  getPatternEntriesForPeriod,
  getQuotaEvent,
  getRecentPatternEntries,
  getSubscriptionStatus,
  getUserTimeZone,
  mirrorPatternReport,
  patchQuotaEventResultContext,
  releaseQuota,
  reserveQuota,
  saveArtifact,
  saveInterpretation,
} from '../_shared/billing-db.ts';
import { corsHeaders, handleError, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import { createAdminClient, requireUser } from '../_shared/supabase.ts';

type GatewayBody = {
  action: GatewayAction;
  idempotencyKey: string;
  dreamId?: string;
  interpretationId?: string;
  quotaEventId?: string;
  message?: string;
  depth?: 'quick' | 'standard' | 'advanced';
  async?: boolean;
  count?: 2 | 3 | 5;
  monthKey?: string;
  language?: string;
};

type DreamExtraction = ReturnType<typeof emptyExtraction>;
type ChatMessagePayload = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

function normalizeReservation(reservation: QuotaReservation): Record<string, unknown> {
  return {
    status: reservation.status,
    quota_event_id: reservation.quotaEventId,
    artifact_id: reservation.artifactId,
    bucket_id: reservation.bucketId,
    reason: reservation.reason,
    result: reservation.result,
  };
}

function measureStart(): number {
  return Date.now();
}

function measureSince(startedAt: number): number {
  return Date.now() - startedAt;
}

function roundUsd(value: number): number {
  return Number(value.toFixed(8));
}

function costUsd(cost: AiCallCost | null | undefined): number | null {
  return typeof cost?.estimatedUsd === 'number' ? cost.estimatedUsd : null;
}

function sumCostUsd(...costs: Array<AiCallCost | null | undefined>): number | null {
  let hasKnownCost = false;
  let total = 0;
  for (const cost of costs) {
    if (typeof cost?.estimatedUsd !== 'number') continue;
    hasKnownCost = true;
    total += cost.estimatedUsd;
  }
  return hasKnownCost ? roundUsd(total) : null;
}

function safeCostLog(cost: AiCallCost | null | undefined): Record<string, unknown> | null {
  if (!cost) return null;
  return {
    provider: cost.provider,
    model: cost.model,
    pricingModel: cost.pricingModel,
    pricingSource: cost.pricingSource,
    inputTokens: cost.inputTokens,
    cachedInputTokens: cost.cachedInputTokens,
    billableInputTokens: cost.billableInputTokens,
    outputTokens: cost.outputTokens,
    totalTokens: cost.totalTokens,
    inputUsd: cost.inputUsd,
    cachedInputUsd: cost.cachedInputUsd,
    outputUsd: cost.outputUsd,
    estimatedUsd: cost.estimatedUsd,
  };
}

function parseAiCallCost(value: unknown): AiCallCost | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<AiCallCost>;
  return {
    provider: typeof raw.provider === 'string' ? raw.provider : null,
    model: typeof raw.model === 'string' ? raw.model : null,
    pricingModel: typeof raw.pricingModel === 'string' ? raw.pricingModel : null,
    pricingSource: typeof raw.pricingSource === 'string' ? raw.pricingSource : 'unknown_provider_or_model',
    inputTokens: typeof raw.inputTokens === 'number' ? raw.inputTokens : 0,
    cachedInputTokens: typeof raw.cachedInputTokens === 'number' ? raw.cachedInputTokens : 0,
    billableInputTokens: typeof raw.billableInputTokens === 'number' ? raw.billableInputTokens : 0,
    outputTokens: typeof raw.outputTokens === 'number' ? raw.outputTokens : 0,
    totalTokens: typeof raw.totalTokens === 'number' ? raw.totalTokens : 0,
    inputUsd: typeof raw.inputUsd === 'number' ? raw.inputUsd : null,
    cachedInputUsd: typeof raw.cachedInputUsd === 'number' ? raw.cachedInputUsd : null,
    outputUsd: typeof raw.outputUsd === 'number' ? raw.outputUsd : null,
    estimatedUsd: typeof raw.estimatedUsd === 'number' ? raw.estimatedUsd : null,
  };
}

function extractionRowFields(
  extraction: DreamExtraction,
  metadataStatus: 'pending' | 'ready' | 'failed',
  metadataGeneratedAt: string | null,
  metadataErrorCode: string | null
): Record<string, unknown> {
  return {
    symbols: extraction.symbols,
    archetypes: extraction.archetypes,
    landscapes: extraction.landscapes,
    affects: extraction.affects,
    motifs: extraction.motifs,
    relational_dynamics: extraction.relational_dynamics,
    thresholds: extraction.thresholds,
    central_conflicts: extraction.central_conflicts,
    core_mode: extraction.core_mode,
    amplifications: extraction.amplifications,
    symbol_stances: extraction.symbol_stances,
    display_distillation: extraction.display_distillation ?? null,
    metadata_status: metadataStatus,
    metadata_generated_at: metadataGeneratedAt,
    metadata_error_code: metadataErrorCode,
  };
}

function clientInterpretationPayload(params: {
  id: string;
  dreamId: string;
  messages: ChatMessagePayload[];
  extraction: DreamExtraction;
  reflectionOrigin: string;
  quotaEventId?: string | null;
  entitlementId?: string | null;
  createdAt: string;
  updatedAt: string;
  metadataStatus: 'pending' | 'ready' | 'failed';
  metadataGeneratedAt?: string | null;
  metadataErrorCode?: string | null;
}): Record<string, unknown> {
  return {
    id: params.id,
    dreamId: params.dreamId,
    messages: params.messages,
    symbols: params.extraction.symbols,
    archetypes: params.extraction.archetypes,
    landscapes: params.extraction.landscapes.length > 0 ? params.extraction.landscapes : undefined,
    affects: params.extraction.affects.length > 0 ? params.extraction.affects : undefined,
    motifs: params.extraction.motifs.length > 0 ? params.extraction.motifs : undefined,
    relational_dynamics:
      params.extraction.relational_dynamics.length > 0 ? params.extraction.relational_dynamics : undefined,
    thresholds: params.extraction.thresholds.length > 0 ? params.extraction.thresholds : undefined,
    central_conflicts: params.extraction.central_conflicts.length > 0 ? params.extraction.central_conflicts : undefined,
    core_mode: params.extraction.core_mode ?? undefined,
    amplifications: params.extraction.amplifications.length > 0 ? params.extraction.amplifications : undefined,
    symbol_stances: params.extraction.symbol_stances.length > 0 ? params.extraction.symbol_stances : undefined,
    display_distillation: params.extraction.display_distillation,
    metadata_status: params.metadataStatus,
    metadata_generated_at: params.metadataGeneratedAt ?? undefined,
    metadata_error_code: params.metadataErrorCode ?? undefined,
    reflection_origin: params.reflectionOrigin,
    chat_replies_used: 0,
    chat_replies_limit: 5,
    origin_quota_event_id: params.quotaEventId ?? undefined,
    origin_entitlement_id: params.entitlementId ?? undefined,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

function asChatMessages(value: unknown): ChatMessagePayload[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const message = item as Record<string, unknown>;
      const role = message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : null;
      const content = typeof message.content === 'string' ? message.content : '';
      const timestamp = typeof message.timestamp === 'string' ? message.timestamp : new Date().toISOString();
      const id = typeof message.id === 'string' ? message.id : crypto.randomUUID();
      if (!role || !content.trim()) return null;
      return { id, role, content, timestamp };
    })
    .filter((message): message is ChatMessagePayload => message !== null);
}

function runInBackground(promise: Promise<unknown>): void {
  if (typeof EdgeRuntime !== 'undefined' && typeof EdgeRuntime.waitUntil === 'function') {
    EdgeRuntime.waitUntil(promise);
    return;
  }
  void promise;
}

async function buildAndSaveReflection(params: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  authHeader: string;
  action: Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>;
  dream: Awaited<ReturnType<typeof getDreamById>>;
  existing: Awaited<ReturnType<typeof getInterpretationByDreamId>>;
  reservation: QuotaReservation;
  depth: 'quick' | 'standard' | 'advanced';
  timings: Record<string, number>;
}): Promise<{
  value: Record<string, unknown>;
  result: Record<string, unknown>;
}> {
  const quotaStartedAt = measureStart();
  const quotaEvent = await getQuotaEvent(params.admin, params.reservation.quotaEventId!);
  params.timings.loadQuotaEventMs = measureSince(quotaStartedAt);
  const reflectionOrigin = ((quotaEvent.request_context as { reflection_origin?: string } | null)?.reflection_origin ?? 'paid_cycle') as string;
  const reflectionStartedAt = measureStart();
  console.log('[ai-entitlements-gateway] reflection ai start', {
    action: params.action,
    dreamId: params.dream.id,
    depth: params.depth,
  });
  const reflectionResult = await generateDreamReflectionWithCost({
    authHeader: params.authHeader,
    dream: params.dream,
    depth: params.depth,
    onProgress: async (progress) => {
      if (!params.reservation.quotaEventId) return;
      await patchQuotaEventResultContext(params.admin, params.reservation.quotaEventId, {
        partial_reflection: progress.text,
        partial_reflection_updated_at: new Date().toISOString(),
        partial_reflection_done: progress.done,
        partial_reflection_cost: safeCostLog(progress.cost),
        partial_reflection_cost_usd: costUsd(progress.cost),
      });
    },
  });
  const reflection = reflectionResult.text;
  const reflectionCost = reflectionResult.cost;
  params.timings.reflectionAiMs = measureSince(reflectionStartedAt);
  console.log('[ai-entitlements-gateway] reflection ai done', {
    action: params.action,
    dreamId: params.dream.id,
    reflectionAiMs: params.timings.reflectionAiMs,
    aiCost: safeCostLog(reflectionCost),
  });

  const interpretationId = params.existing?.id ?? crypto.randomUUID();
  const createdAt = params.existing?.created_at ?? new Date().toISOString();
  const updatedAt = new Date().toISOString();
  const messages: ChatMessagePayload[] = [
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: reflection,
      timestamp: updatedAt,
    },
  ];
  const pendingExtraction = emptyExtraction();
  const saveStartedAt = measureStart();
  await saveInterpretation(params.admin, {
    id: interpretationId,
    user_id: params.userId,
    dream_id: params.dream.id,
    messages,
    ...extractionRowFields(pendingExtraction, 'pending', null, null),
    summary: null,
    reflection_origin: reflectionOrigin,
    origin_quota_event_id: params.reservation.quotaEventId,
    origin_entitlement_id: (quotaEvent.entitlement_id as string | null) ?? null,
    chat_replies_used: 0,
    chat_replies_limit: 5,
    created_at: createdAt,
    updated_at: updatedAt,
  });
  params.timings.saveReflectionMs = measureSince(saveStartedAt);

  return {
    value: {
      interpretation_id: interpretationId,
      reflection,
      reflection_ai_cost: safeCostLog(reflectionCost),
      reflection_cost_usd: costUsd(reflectionCost),
      interpretation: clientInterpretationPayload({
        id: interpretationId,
        dreamId: params.dream.id,
        messages,
        extraction: pendingExtraction,
        reflectionOrigin,
        quotaEventId: params.reservation.quotaEventId,
        entitlementId: (quotaEvent.entitlement_id as string | null) ?? null,
        createdAt,
        updatedAt,
        metadataStatus: 'pending',
      }),
    },
    result: {
      interpretation_id: interpretationId,
      reflection_ai_ms: params.timings.reflectionAiMs,
      save_reflection_ms: params.timings.saveReflectionMs,
      reflection_ai_cost: safeCostLog(reflectionCost),
      reflection_cost_usd: costUsd(reflectionCost),
    },
  };
}

async function persistReflectionMetadata(params: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  authHeader: string;
  interpretationId: string;
  dream: Awaited<ReturnType<typeof getDreamById>>;
  reflection: string;
  reflectionCost?: AiCallCost | null;
}): Promise<{ metadataStatus: 'ready' | 'failed'; metadataCost: AiCallCost | null; totalCostUsd: number | null }> {
  const startedAt = measureStart();
  try {
    const extractionStartedAt = measureStart();
    const extractionResult = await generateDreamExtractionWithCost({
      authHeader: params.authHeader,
      dream: params.dream,
      interpretation: params.reflection,
    });
    const extraction = extractionResult.extraction;
    const metadataCost = extractionResult.cost;
    const totalCostUsd = sumCostUsd(params.reflectionCost, metadataCost);
    const extractionAiMs = measureSince(extractionStartedAt);
    const metadataGeneratedAt = new Date().toISOString();
    const saveStartedAt = measureStart();
    await saveInterpretation(params.admin, {
      id: params.interpretationId,
      user_id: params.userId,
      dream_id: params.dream.id,
      ...extractionRowFields(extraction, 'ready', metadataGeneratedAt, null),
      updated_at: metadataGeneratedAt,
    });
    console.log('[ai-entitlements-gateway] metadata extraction committed', {
      action: 'dream_metadata_extract',
      dreamId: params.dream.id,
      interpretationId: params.interpretationId,
      extractionAiMs,
      saveMetadataMs: measureSince(saveStartedAt),
      totalMs: measureSince(startedAt),
      metadataAiCost: safeCostLog(metadataCost),
      reflectionCostUsd: costUsd(params.reflectionCost),
      metadataCostUsd: costUsd(metadataCost),
      totalAiCostUsd: totalCostUsd,
    });
    console.log('[ai-entitlements-gateway] reflection total ai cost', {
      action: 'dream_reflection_generate',
      dreamId: params.dream.id,
      interpretationId: params.interpretationId,
      reflectionAiCost: safeCostLog(params.reflectionCost),
      metadataAiCost: safeCostLog(metadataCost),
      totalAiCostUsd: totalCostUsd,
    });
    return { metadataStatus: 'ready', metadataCost, totalCostUsd };
  } catch (error) {
    const failedAt = new Date().toISOString();
    await saveInterpretation(params.admin, {
      id: params.interpretationId,
      user_id: params.userId,
      dream_id: params.dream.id,
      metadata_status: 'failed',
      metadata_error_code: 'metadata_generation_failed',
      updated_at: failedAt,
    });
    const httpError = error instanceof HttpError ? error : null;
    console.error('[ai-entitlements-gateway] metadata extraction failed', {
      action: 'dream_metadata_extract',
      dreamId: params.dream.id,
      interpretationId: params.interpretationId,
      message: error instanceof Error ? error.message : 'Unknown metadata extraction error',
      status: httpError?.status ?? null,
      details: httpError?.details ?? null,
      dreamLength: params.dream.content?.length ?? 0,
      reflectionLength: params.reflection?.length ?? 0,
      totalMs: measureSince(startedAt),
      reflectionCostUsd: costUsd(params.reflectionCost),
    });
    throw httpError ?? new HttpError(502, 'Metadata extraction failed');
  }
}

serve(async (req: Request) => {
  const methods = 'POST, OPTIONS';
  const requestStartedAt = measureStart();
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(methods) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, methods);
  }

  try {
    const authStartedAt = measureStart();
    const { userId, authHeader } = await requireUser(req);
    const authMs = measureSince(authStartedAt);
    const readBodyStartedAt = measureStart();
    const body = await readJson<GatewayBody>(req);
    const readBodyMs = measureSince(readBodyStartedAt);
    const admin = createAdminClient();
    const language = body.language ?? 'en';

    if (!body.action || !body.idempotencyKey) {
      throw new HttpError(400, 'action and idempotencyKey are required');
    }

    console.log('[ai-entitlements-gateway] request accepted', {
      action: body.action,
      hasDreamId: Boolean(body.dreamId),
      hasInterpretationId: Boolean(body.interpretationId),
      authMs,
      readBodyMs,
    });

    if (body.action === 'dream_reflection_status') {
      if (!body.quotaEventId) throw new HttpError(400, 'quotaEventId is required');
      const quotaEvent = await getQuotaEvent(admin, body.quotaEventId);
      if (quotaEvent.user_id !== userId) throw new HttpError(404, 'quota event not found');

      const status = String(quotaEvent.status ?? 'pending');
      if (status !== 'committed') {
        const resultContext = (quotaEvent.result_context ?? {}) as Record<string, unknown>;
        return jsonResponse(
          {
            status,
            quota_event_id: body.quotaEventId,
            reason: quotaEvent.denial_reason ?? null,
            partial_reflection: typeof resultContext.partial_reflection === 'string' ? resultContext.partial_reflection : undefined,
            partial_reflection_updated_at:
              typeof resultContext.partial_reflection_updated_at === 'string'
                ? resultContext.partial_reflection_updated_at
                : undefined,
            partial_reflection_done:
              typeof resultContext.partial_reflection_done === 'boolean'
                ? resultContext.partial_reflection_done
                : undefined,
            partial_reflection_cost_usd:
              typeof resultContext.partial_reflection_cost_usd === 'number'
                ? resultContext.partial_reflection_cost_usd
                : undefined,
            result: resultContext,
          },
          200,
          methods
        );
      }

      const resultContext = (quotaEvent.result_context ?? {}) as {
        interpretation_id?: string;
        reflection_ai_ms?: number;
        save_reflection_ms?: number;
        reflection_ai_cost?: unknown;
        reflection_cost_usd?: number | null;
      };
      const interpretationId = resultContext.interpretation_id;
      if (!interpretationId) throw new HttpError(500, 'quota event missing interpretation result');
      const interpretation = await getInterpretationById(admin, userId, interpretationId);
      const messages = asChatMessages(interpretation.messages);
      const firstAssistant = messages.find((message) => message.role === 'assistant');
      const reflection = firstAssistant?.content?.trim() ?? '';

      return jsonResponse(
        {
          status: 'committed',
          quota_event_id: body.quotaEventId,
          interpretation_id: interpretation.id,
          reflection,
          reflection_ai_ms: resultContext.reflection_ai_ms,
          save_reflection_ms: resultContext.save_reflection_ms,
          reflection_ai_cost: resultContext.reflection_ai_cost ?? null,
          reflection_cost_usd: resultContext.reflection_cost_usd ?? null,
          interpretation: clientInterpretationPayload({
            id: interpretation.id,
            dreamId: interpretation.dream_id,
            messages,
            extraction: {
              display_distillation: interpretation.display_distillation as DreamExtraction['display_distillation'],
              symbols: interpretation.symbols ?? [],
              archetypes: interpretation.archetypes ?? [],
              landscapes: interpretation.landscapes ?? [],
              affects: interpretation.affects ?? [],
              motifs: interpretation.motifs ?? [],
              relational_dynamics: interpretation.relational_dynamics ?? [],
              thresholds: interpretation.thresholds ?? [],
              central_conflicts: interpretation.central_conflicts ?? [],
              core_mode: interpretation.core_mode ?? null,
              amplifications: interpretation.amplifications ?? [],
              symbol_stances: interpretation.symbol_stances ?? [],
            },
            reflectionOrigin: interpretation.reflection_origin ?? 'paid_cycle',
            quotaEventId: interpretation.origin_quota_event_id,
            entitlementId: interpretation.origin_entitlement_id,
            createdAt: interpretation.created_at,
            updatedAt: interpretation.updated_at,
            metadataStatus: interpretation.metadata_status ?? 'ready',
            metadataGeneratedAt: interpretation.metadata_generated_at,
            metadataErrorCode: interpretation.metadata_error_code,
          }),
        },
        200,
        methods
      );
    }

    if (body.action === 'dream_reflection_generate' || body.action === 'dream_reflection_regenerate') {
      if (!body.dreamId) throw new HttpError(400, 'dreamId is required');
      const reflectionAction = body.action as Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>;
      const totalStartedAt = measureStart();
      const timings: Record<string, number> = {};
      const loadDreamStartedAt = measureStart();
      const dream = await getDreamById(admin, userId, body.dreamId);
      timings.loadDreamMs = measureSince(loadDreamStartedAt);
      const loadExistingStartedAt = measureStart();
      const existing = await getInterpretationByDreamId(admin, userId, body.dreamId);
      timings.loadExistingInterpretationMs = measureSince(loadExistingStartedAt);
      const depth = body.depth ?? 'standard';

      if (body.async === true) {
        const reserveStartedAt = measureStart();
        const reservation = await reserveQuota(admin, userId, reflectionAction, body.idempotencyKey, { dream_id: body.dreamId });
        timings.reserveMs = measureSince(reserveStartedAt);

        if (reservation.status !== 'pending' || !reservation.quotaEventId) {
          console.log('[ai-entitlements-gateway] async reflection not started', {
            action: body.action,
            dreamId: body.dreamId,
            status: reservation.status,
            reason: reservation.reason,
            ...timings,
            totalMs: measureSince(totalStartedAt),
          });
          return jsonResponse(normalizeReservation(reservation), 200, methods);
        }

        runInBackground((async () => {
          const backgroundStartedAt = measureStart();
          try {
            const workResult = await buildAndSaveReflection({
              admin,
              userId,
              authHeader,
              action: reflectionAction,
              dream,
              existing,
              reservation,
              depth,
              timings,
            });
            const commitStartedAt = measureStart();
            await commitQuota(admin, reservation.quotaEventId!, workResult.result);
            timings.commitMs = measureSince(commitStartedAt);
            console.log('[ai-entitlements-gateway] async reflection committed', {
              action: body.action,
              dreamId: body.dreamId,
              quotaEventId: reservation.quotaEventId,
              metadataStatus: 'pending',
              ...timings,
              totalMs: measureSince(backgroundStartedAt),
            });
          } catch (error) {
            const reason = error instanceof Error ? error.message : 'Unknown async reflection error';
            await releaseQuota(admin, reservation.quotaEventId!, reason).catch((releaseError) => {
              console.error('[ai-entitlements-gateway] async reflection release failed', {
                action: body.action,
                dreamId: body.dreamId,
                quotaEventId: reservation.quotaEventId,
                message: releaseError instanceof Error ? releaseError.message : 'Unknown release error',
              });
            });
            console.error('[ai-entitlements-gateway] async reflection failed', {
              action: body.action,
              dreamId: body.dreamId,
              quotaEventId: reservation.quotaEventId,
              message: reason,
              ...timings,
              totalMs: measureSince(backgroundStartedAt),
            });
          }
        })());

        console.log('[ai-entitlements-gateway] async reflection started', {
          action: body.action,
          dreamId: body.dreamId,
          quotaEventId: reservation.quotaEventId,
          depth,
          ...timings,
          totalMs: measureSince(totalStartedAt),
        });

        return jsonResponse(
          {
            status: 'pending',
            quota_event_id: reservation.quotaEventId,
          },
          200,
          methods
        );
      }

      const result = await executeQuotaJob({
        reserve: async () => {
          const startedAt = measureStart();
          const reservation = await reserveQuota(admin, userId, reflectionAction, body.idempotencyKey, { dream_id: body.dreamId });
          timings.reserveMs = measureSince(startedAt);
          return reservation;
        },
        commit: async (quotaEventId, commitResult) => {
          const startedAt = measureStart();
          await commitQuota(admin, quotaEventId, commitResult ?? {});
          timings.commitMs = measureSince(startedAt);
        },
        release: (quotaEventId, reason, releaseResult) => releaseQuota(admin, quotaEventId, reason, releaseResult),
        work: (reservation) => buildAndSaveReflection({
          admin,
          userId,
          authHeader,
          action: reflectionAction,
          dream,
          existing,
          reservation,
          depth,
          timings,
        }),
      });

      if (result.reservation.status !== 'committed') {
        console.log('[ai-entitlements-gateway] reflection request completed without commit', {
          action: body.action,
          dreamId: body.dreamId,
          status: result.reservation.status,
          reason: result.reservation.reason,
          ...timings,
          totalMs: measureSince(totalStartedAt),
        });
        return jsonResponse(normalizeReservation(result.reservation), 200, methods);
      }

      console.log('[ai-entitlements-gateway] reflection committed', {
        action: body.action,
        dreamId: body.dreamId,
        metadataStatus: 'pending',
        ...timings,
        totalMs: measureSince(totalStartedAt),
      });

      return jsonResponse(
        {
          status: 'committed',
          quota_event_id: result.reservation.quotaEventId,
          ...result.value,
        },
        200,
        methods
      );
    }

    if (body.action === 'dream_metadata_extract') {
      if (!body.interpretationId) throw new HttpError(400, 'interpretationId is required');
      const totalStartedAt = measureStart();
      console.log('[ai-entitlements-gateway] metadata request start', {
        action: body.action,
        interpretationId: body.interpretationId,
      });
      const interpretation = await getInterpretationById(admin, userId, body.interpretationId);
      if (interpretation.metadata_status === 'ready') {
        console.log('[ai-entitlements-gateway] metadata request cached', {
          action: body.action,
          interpretationId: interpretation.id,
          totalMs: measureSince(totalStartedAt),
        });
        return jsonResponse(
          {
            status: 'committed',
            interpretation_id: interpretation.id,
            metadata_status: 'ready',
            cached: true,
            total_ms: measureSince(totalStartedAt),
          },
          200,
          methods
        );
      }

      const firstAssistant = ((interpretation.messages ?? []) as Array<{ role?: string; content?: string }>)
        .find((message) => message.role === 'assistant');
      const reflection = firstAssistant?.content?.trim();
      if (!reflection) throw new HttpError(400, 'interpretation has no assistant reflection');

      const dream = await getDreamById(admin, userId, interpretation.dream_id);
      let reflectionCost: AiCallCost | null = null;
      if (interpretation.origin_quota_event_id) {
        const quotaEvent = await getQuotaEvent(admin, interpretation.origin_quota_event_id);
        if (quotaEvent.user_id === userId) {
          const resultContext = (quotaEvent.result_context ?? {}) as { reflection_ai_cost?: unknown };
          reflectionCost = parseAiCallCost(resultContext.reflection_ai_cost);
        }
      }

      const claim = await claimMetadataExtraction(admin, userId, interpretation.id);
      if (claim.status === 'not_found') {
        throw new HttpError(404, 'Interpretation not found');
      }
      if (claim.status === 'ready') {
        console.log('[ai-entitlements-gateway] metadata request cached by claim', {
          action: body.action,
          interpretationId: interpretation.id,
          totalMs: measureSince(totalStartedAt),
        });
        return jsonResponse(
          {
            status: 'committed',
            interpretation_id: interpretation.id,
            metadata_status: 'ready',
            cached: true,
            total_ms: measureSince(totalStartedAt),
          },
          200,
          methods
        );
      }
      if (!claim.claimed) {
        console.log('[ai-entitlements-gateway] metadata request already processing', {
          action: body.action,
          interpretationId: interpretation.id,
          attempts: claim.attempts,
          leaseExpiresAt: claim.leaseExpiresAt,
          totalMs: measureSince(totalStartedAt),
        });
        return jsonResponse(
          {
            status: 'pending',
            reason: 'metadata_extraction_processing',
            interpretation_id: interpretation.id,
            metadata_status: interpretation.metadata_status ?? 'pending',
            total_ms: measureSince(totalStartedAt),
          },
          200,
          methods
        );
      }

      console.log('[ai-entitlements-gateway] metadata request claimed', {
        action: body.action,
        interpretationId: interpretation.id,
        attempts: claim.attempts,
        leaseExpiresAt: claim.leaseExpiresAt,
      });

      let metadataResult: Awaited<ReturnType<typeof persistReflectionMetadata>>;
      try {
        metadataResult = await persistReflectionMetadata({
          admin,
          userId,
          authHeader,
          interpretationId: interpretation.id,
          dream,
          reflection,
          reflectionCost,
        });
        await finishMetadataExtraction(admin, userId, interpretation.id, 'completed');
      } catch (error) {
        try {
          await finishMetadataExtraction(
            admin,
            userId,
            interpretation.id,
            'failed',
            'metadata_generation_failed'
          );
        } catch (finishError) {
          console.error('[ai-entitlements-gateway] metadata claim finish failed', {
            action: body.action,
            interpretationId: interpretation.id,
            message: finishError instanceof Error ? finishError.message : 'Unknown metadata claim finish error',
          });
        }
        throw error;
      }

      console.log('[ai-entitlements-gateway] metadata request done', {
        action: body.action,
        interpretationId: interpretation.id,
        metadataStatus: metadataResult.metadataStatus,
        metadataAiCost: safeCostLog(metadataResult.metadataCost),
        metadataCostUsd: costUsd(metadataResult.metadataCost),
        reflectionAiCost: safeCostLog(reflectionCost),
        reflectionCostUsd: costUsd(reflectionCost),
        totalAiCostUsd: metadataResult.totalCostUsd,
        totalMs: measureSince(totalStartedAt),
      });
      return jsonResponse(
        {
          status: 'committed',
          interpretation_id: interpretation.id,
          metadata_status: metadataResult.metadataStatus,
          metadata_ai_cost: safeCostLog(metadataResult.metadataCost),
          metadata_cost_usd: costUsd(metadataResult.metadataCost),
          reflection_ai_cost: safeCostLog(reflectionCost),
          reflection_cost_usd: costUsd(reflectionCost),
          total_ai_cost_usd: metadataResult.totalCostUsd,
          total_ms: measureSince(totalStartedAt),
        },
        200,
        methods
      );
    }

    if (body.action === 'dream_followup_reply') {
      if (!body.interpretationId || !body.message?.trim()) {
        throw new HttpError(400, 'interpretationId and message are required');
      }

      const interpretation = await getInterpretationById(admin, userId, body.interpretationId);
      const dream = await getDreamById(admin, userId, interpretation.dream_id);

      const result = await executeQuotaJob({
        reserve: () => reserveQuota(admin, userId, body.action, body.idempotencyKey, { interpretation_id: body.interpretationId }),
        commit: (quotaEventId, commitResult) => commitQuota(admin, quotaEventId, commitResult ?? {}),
        release: (quotaEventId, reason, releaseResult) => releaseQuota(admin, quotaEventId, reason, releaseResult),
        work: async () => {
          const assistantReply = await generateFollowupReply({
            authHeader,
            dream,
            conversation: (interpretation.messages ?? []) as Array<{
              id: string;
              role: 'user' | 'assistant';
              content: string;
              timestamp: string;
            }>,
            userMessage: body.message!.trim(),
            assistantRepliesUsed: interpretation.chat_replies_used ?? 0,
            assistantRepliesLimit: interpretation.chat_replies_limit ?? 5,
          });

          const nextMessages = [
            ...((interpretation.messages ?? []) as Record<string, unknown>[]),
            {
              id: crypto.randomUUID(),
              role: 'user',
              content: body.message!.trim(),
              timestamp: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantReply,
              timestamp: new Date().toISOString(),
            },
          ];

          await saveInterpretation(admin, {
            id: interpretation.id,
            user_id: userId,
            dream_id: interpretation.dream_id,
            messages: nextMessages,
            updated_at: new Date().toISOString(),
          });

          return {
            value: {
              interpretation_id: interpretation.id,
              assistant_reply: assistantReply,
            },
            result: { interpretation_id: interpretation.id },
          };
        },
      });

      if (result.reservation.status !== 'committed') {
        return jsonResponse(normalizeReservation(result.reservation), 200, methods);
      }

      return jsonResponse({ status: 'committed', ...result.value }, 200, methods);
    }

    if (body.action === 'recent_dream_field_generate') {
      const count = body.count ?? 3;
      const entries = await getRecentPatternEntries(admin, userId, count);
      const scopeKey = buildRecentScope(entries, count);
      console.log('[ai-entitlements-gateway] recent dream field ai start', {
        action: body.action,
        scopeKey,
        language,
        dreamCount: entries.length,
        count,
      });
      const result = await executeQuotaJob({
        reserve: () =>
          reserveQuota(admin, userId, body.action, body.idempotencyKey, {
            scope_type: 'recent_sequence',
            scope_key: scopeKey,
            language,
            dream_count: entries.length,
          }),
        commit: (quotaEventId, commitResult) => commitQuota(admin, quotaEventId, commitResult ?? {}),
        release: (quotaEventId, reason, releaseResult) => releaseQuota(admin, quotaEventId, reason, releaseResult),
        work: async (reservation) => {
          const quotaEvent = await getQuotaEvent(admin, reservation.quotaEventId!);
          const aiStartedAt = measureStart();
          const generated = await generateRecentReflection(authHeader, entries, language);
          const aiMs = measureSince(aiStartedAt);
          console.log('[ai-entitlements-gateway] recent dream field ai done', {
            action: body.action,
            scopeKey,
            language,
            dreamCount: entries.length,
            aiMs,
            aiCost: safeCostLog(generated.cost),
            recentDreamFieldCostUsd: costUsd(generated.cost),
          });
          const artifactId = await saveArtifact(admin, {
            userId,
            entitlementId: (quotaEvent.entitlement_id as string | null) ?? null,
            quotaEventId: reservation.quotaEventId,
            sourceAction: 'recent_dream_field_generate',
            scopeType: 'recent_sequence',
            scopeKey,
            language,
            dreamIds: entries.map((entry) => entry.dreamId),
            dreamCount: entries.length,
            content: generated.content,
            metadata: { count },
          });

          return {
            value: {
              artifact_id: artifactId,
              content: generated.content,
              scope_key: scopeKey,
              recent_dream_field_ai_cost: safeCostLog(generated.cost),
              recent_dream_field_cost_usd: costUsd(generated.cost),
            },
            result: {
              artifact_id: artifactId,
              recent_dream_field_ai_ms: aiMs,
              recent_dream_field_ai_cost: safeCostLog(generated.cost),
              recent_dream_field_cost_usd: costUsd(generated.cost),
            },
          };
        },
      });

      if (result.reservation.status === 'cached') {
        console.log('[ai-entitlements-gateway] recent dream field cached', {
          action: body.action,
          scopeKey,
          language,
        });
        return jsonResponse({ status: 'cached', ...result.reservation.result }, 200, methods);
      }
      if (result.reservation.status !== 'committed') {
        console.log('[ai-entitlements-gateway] recent dream field not committed', {
          action: body.action,
          scopeKey,
          status: result.reservation.status,
          reason: (result.reservation as { reason?: string }).reason ?? null,
        });
        return jsonResponse(normalizeReservation(result.reservation), 200, methods);
      }

      return jsonResponse({ status: 'committed', ...result.value }, 200, methods);
    }

    if (body.action === 'period_reflection_generate') {
      if (!body.monthKey) throw new HttpError(400, 'monthKey is required');
      const monthKey = body.monthKey;
      const timeZone = await getUserTimeZone(admin, userId);
      const scope = buildMonthScope(monthKey, timeZone);
      const entries = await getPatternEntriesForPeriod(admin, userId, scope.startDate, scope.endDate);
      const latestReflectedAt = entries[entries.length - 1]?.interpretationCreatedAt ?? null;
      console.log('[ai-entitlements-gateway] period reflection ai start', {
        action: body.action,
        monthKey,
        scopeKey: scope.scopeKey,
        language,
        dreamCount: entries.length,
        isCurrentMonth: scope.isCurrentMonth,
      });
      const result = await executeQuotaJob({
        reserve: () =>
          reserveQuota(admin, userId, body.action, body.idempotencyKey, {
            scope_type: 'calendar_period',
            scope_key: scope.scopeKey,
            month_key: monthKey,
            language,
            dream_count: entries.length,
            is_current_month: scope.isCurrentMonth,
            latest_reflected_at: latestReflectedAt,
          }),
        commit: (quotaEventId, commitResult) => commitQuota(admin, quotaEventId, commitResult ?? {}),
        release: (quotaEventId, reason, releaseResult) => releaseQuota(admin, quotaEventId, reason, releaseResult),
        work: async (reservation) => {
          const quotaEvent = await getQuotaEvent(admin, reservation.quotaEventId!);
          const aiStartedAt = measureStart();
          const generated = await generatePeriodReflection(authHeader, entries, monthKey, language);
          const aiMs = measureSince(aiStartedAt);
          console.log('[ai-entitlements-gateway] period reflection ai done', {
            action: body.action,
            monthKey,
            scopeKey: scope.scopeKey,
            language,
            dreamCount: entries.length,
            aiMs,
            aiCost: safeCostLog(generated.cost),
            periodReflectionCostUsd: costUsd(generated.cost),
          });
          const artifactId = await saveArtifact(admin, {
            userId,
            entitlementId: (quotaEvent.entitlement_id as string | null) ?? null,
            quotaEventId: reservation.quotaEventId,
            sourceAction: 'period_reflection_generate',
            scopeType: 'calendar_period',
            scopeKey: scope.scopeKey,
            language,
            startDate: scope.startDate,
            endDate: scope.endDate,
            dreamIds: entries.map((entry) => entry.dreamId),
            dreamCount: entries.length,
            monthKey,
            content: generated.content,
            metadata: { is_current_month: scope.isCurrentMonth },
          });
          await mirrorPatternReport(admin, userId, scope.scopeKey, generated.content);

          return {
            value: {
              artifact_id: artifactId,
              content: generated.content,
              scope_key: scope.scopeKey,
              period_reflection_ai_cost: safeCostLog(generated.cost),
              period_reflection_cost_usd: costUsd(generated.cost),
            },
            result: {
              artifact_id: artifactId,
              period_reflection_ai_ms: aiMs,
              period_reflection_ai_cost: safeCostLog(generated.cost),
              period_reflection_cost_usd: costUsd(generated.cost),
            },
          };
        },
      });

      if (result.reservation.status === 'cached') {
        console.log('[ai-entitlements-gateway] period reflection cached', {
          action: body.action,
          monthKey,
          scopeKey: scope.scopeKey,
          language,
        });
        return jsonResponse({ status: 'cached', ...result.reservation.result }, 200, methods);
      }
      if (result.reservation.status !== 'committed') {
        console.log('[ai-entitlements-gateway] period reflection not committed', {
          action: body.action,
          monthKey,
          scopeKey: scope.scopeKey,
          status: result.reservation.status,
          reason: (result.reservation as { reason?: string }).reason ?? null,
        });
        return jsonResponse(normalizeReservation(result.reservation), 200, methods);
      }

      return jsonResponse({ status: 'committed', ...result.value }, 200, methods);
    }

    if (body.action === 'dream_reflection_generate' || body.action === 'dream_reflection_regenerate') {
      throw new HttpError(500, 'Unreachable action branch');
    }

    console.error('[ai-entitlements-gateway] unsupported action', {
      action: body.action,
      totalMs: measureSince(requestStartedAt),
    });
    const status = await getSubscriptionStatus(admin, userId);
    return jsonResponse({ error: 'Unsupported action', status }, 400, methods);
  } catch (error) {
    return handleError('ai-entitlements-gateway', error, methods);
  }
});
