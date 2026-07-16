import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { executeQuotaJob } from '../../../src/billing/runtime.ts';
import type { GatewayAction, QuotaReservation } from '../../../src/billing/types.ts';
import {
  buildMonthScope,
  buildRecentScope,
  generateDreamInterpretation,
  generateFollowupReply,
  generatePeriodReflection,
  generateRecentReflection,
} from '../_shared/billing-ai.ts';
import {
  commitQuota,
  getDreamById,
  getInterpretationByDreamId,
  getInterpretationById,
  getPatternEntriesForPeriod,
  getQuotaEvent,
  getRecentPatternEntries,
  getSubscriptionStatus,
  getUserTimeZone,
  mirrorPatternReport,
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
  message?: string;
  depth?: 'quick' | 'standard' | 'advanced';
  count?: 2 | 3 | 5;
  monthKey?: string;
  language?: string;
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

serve(async (req: Request) => {
  const methods = 'POST, OPTIONS';
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(methods) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, methods);
  }

  try {
    const { userId } = await requireUser(req);
    const body = await readJson<GatewayBody>(req);
    const admin = createAdminClient();
    const language = body.language ?? 'en';

    if (!body.action || !body.idempotencyKey) {
      throw new HttpError(400, 'action and idempotencyKey are required');
    }

    if (body.action === 'dream_reflection_generate' || body.action === 'dream_reflection_regenerate') {
      if (!body.dreamId) throw new HttpError(400, 'dreamId is required');
      const dream = await getDreamById(admin, userId, body.dreamId);
      const existing = await getInterpretationByDreamId(admin, userId, body.dreamId);

      const result = await executeQuotaJob({
        reserve: () => reserveQuota(admin, userId, body.action, body.idempotencyKey, { dream_id: body.dreamId }),
        commit: (quotaEventId, commitResult) => commitQuota(admin, quotaEventId, commitResult ?? {}),
        release: (quotaEventId, reason, releaseResult) => releaseQuota(admin, quotaEventId, reason, releaseResult),
        work: async (reservation) => {
          const quotaEvent = await getQuotaEvent(admin, reservation.quotaEventId!);
          const reflectionOrigin = ((quotaEvent.request_context as { reflection_origin?: string } | null)?.reflection_origin ?? 'paid_cycle') as string;
          const interpretation = await generateDreamInterpretation({
            dream,
            depth: body.depth ?? 'standard',
          });

          const interpretationId = existing?.id ?? crypto.randomUUID();
          await saveInterpretation(admin, {
            id: interpretationId,
            user_id: userId,
            dream_id: dream.id,
            messages: [
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: interpretation.text,
                timestamp: new Date().toISOString(),
              },
            ],
            symbols: interpretation.extraction.symbols,
            archetypes: interpretation.extraction.archetypes,
            landscapes: interpretation.extraction.landscapes,
            affects: interpretation.extraction.affects,
            motifs: interpretation.extraction.motifs,
            relational_dynamics: interpretation.extraction.relational_dynamics,
            thresholds: interpretation.extraction.thresholds,
            central_conflicts: interpretation.extraction.central_conflicts,
            core_mode: interpretation.extraction.core_mode,
            amplifications: interpretation.extraction.amplifications,
            symbol_stances: interpretation.extraction.symbol_stances,
            display_distillation: interpretation.extraction.display_distillation ?? null,
            summary: null,
            reflection_origin: reflectionOrigin,
            origin_quota_event_id: reservation.quotaEventId,
            origin_entitlement_id: (quotaEvent.entitlement_id as string | null) ?? null,
            chat_replies_used: 0,
            chat_replies_limit: 5,
            created_at: existing?.created_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          return {
            value: {
              interpretation_id: interpretationId,
              reflection: interpretation.text,
            },
            result: { interpretation_id: interpretationId },
          };
        },
      });

      if (result.reservation.status !== 'committed') {
        return jsonResponse(normalizeReservation(result.reservation), 200, methods);
      }

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
          const reflection = await generateRecentReflection(entries, language);
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
            content: reflection,
            metadata: { count },
          });

          return {
            value: {
              artifact_id: artifactId,
              content: reflection,
              scope_key: scopeKey,
            },
            result: { artifact_id: artifactId },
          };
        },
      });

      if (result.reservation.status === 'cached') {
        return jsonResponse({ status: 'cached', ...result.reservation.result }, 200, methods);
      }
      if (result.reservation.status !== 'committed') {
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
          const reflection = await generatePeriodReflection(entries, monthKey, language);
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
            content: reflection,
            metadata: { is_current_month: scope.isCurrentMonth },
          });
          await mirrorPatternReport(admin, userId, scope.scopeKey, reflection);

          return {
            value: {
              artifact_id: artifactId,
              content: reflection,
              scope_key: scope.scopeKey,
            },
            result: { artifact_id: artifactId },
          };
        },
      });

      if (result.reservation.status === 'cached') {
        return jsonResponse({ status: 'cached', ...result.reservation.result }, 200, methods);
      }
      if (result.reservation.status !== 'committed') {
        return jsonResponse(normalizeReservation(result.reservation), 200, methods);
      }

      return jsonResponse({ status: 'committed', ...result.value }, 200, methods);
    }

    if (body.action === 'dream_reflection_generate' || body.action === 'dream_reflection_regenerate') {
      throw new HttpError(500, 'Unreachable action branch');
    }

    const status = await getSubscriptionStatus(admin, userId);
    return jsonResponse({ error: 'Unsupported action', status }, 400, methods);
  } catch (error) {
    return handleError('ai-entitlements-gateway', error, methods);
  }
});
