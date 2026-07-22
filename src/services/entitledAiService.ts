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
import type { Dream, Interpretation } from '../types/dream';
import type { GatewayAction } from '../billing/types';
import type { PatternInsightDreamEntry } from './ai';

type GatewayDeniedResponse = {
  status: 'denied' | 'released' | 'pending';
  reason?: string | null;
};

type GatewayReflectionResponse = {
  status: 'committed';
  interpretation_id: string;
  reflection: string;
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
};

const PREMIUM_REQUIRED_REASONS = new Set([
  'paid_subscription_required',
  'paid_reflection_read_only_after_lapse',
]);

const READ_ONLY_REASONS = new Set([
  'paid_reflection_read_only_after_lapse',
]);

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

async function syncInterpretationByDreamId(dreamId: string): Promise<Interpretation> {
  const interpretation = await remoteGetInterpretationByDreamId(dreamId);
  if (!interpretation) {
    throw new Error('The updated reflection could not be loaded.');
  }

  await StorageService.saveInterpretation(interpretation);
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

export async function generateEntitledDreamReflection(
  dream: Dream,
  depth: 'quick' | 'standard' | 'advanced',
  action: Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>
): Promise<Interpretation> {
  const response = await invokeAiEntitlementsGateway<GatewayReflectionResponse | GatewayDeniedResponse>({
    action,
    idempotencyKey: createIdempotencyKey(action, dream.id),
    dreamId: dream.id,
    depth,
  });

  assertCommitted(response);
  return syncInterpretationByDreamId(dream.id);
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
  await LocalStorage.savePatternReport(response.scope_key || monthKey, response.content);
  return response.content;
}
