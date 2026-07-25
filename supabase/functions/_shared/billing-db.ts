import type { EntitlementSnapshot, GatewayAction, QuotaReservation, VerifiedPurchase, WebhookEventEnvelope } from '../../../src/billing/types.ts';
import { normalizeArchetypalEchoes, type ArchetypalEcho } from '../../../src/ai/archetypalEchoes.ts';
import { normalizeAmplifications, type MythicEcho } from '../../../src/ai/mythicEchoes.ts';
import { HttpError } from './http.ts';
import { createAdminClient } from './supabase.ts';

type AdminClient = ReturnType<typeof createAdminClient>;

type BillingAccountRow = {
  user_id: string;
  apple_app_account_token: string;
  google_obfuscated_account_id: string;
};

type DreamRow = {
  id: string;
  title: string | null;
  date: string;
  content: string;
  user_id: string;
};

type InterpretationRow = {
  id: string;
  dream_id: string;
  user_id: string;
  messages: unknown[];
  symbols: string[];
  archetypes?: unknown[] | null;
  landscapes?: string[] | null;
  affects?: string[] | null;
  motifs?: string[] | null;
  relational_dynamics?: string[] | null;
  thresholds?: string[] | null;
  central_conflicts?: string[] | null;
  core_mode?: string | null;
  amplifications?: unknown[] | null;
  symbol_stances?: Array<{ symbol: string; stance: string }> | null;
  display_distillation?: Record<string, unknown> | null;
  metadata_status?: 'pending' | 'ready' | 'failed' | null;
  metadata_generated_at?: string | null;
  metadata_error_code?: string | null;
  reflection_origin?: string | null;
  origin_quota_event_id?: string | null;
  origin_entitlement_id?: string | null;
  chat_replies_used?: number | null;
  chat_replies_limit?: number | null;
  created_at: string;
  updated_at: string;
};

type MetadataExtractionClaimStatus = 'claimed' | 'ready' | 'processing' | 'not_found';

export type MetadataExtractionClaim = {
  status: MetadataExtractionClaimStatus;
  claimed: boolean;
  leaseExpiresAt?: string | null;
  attempts?: number | null;
};

export type PatternEntry = {
  dreamId: string;
  date: string;
  extracted: {
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
  interpretation: string;
  interpretationCreatedAt: string;
};

type ArtifactInsert = {
  userId: string;
  entitlementId?: string | null;
  quotaEventId?: string | null;
  sourceAction: 'recent_dream_field_generate' | 'period_reflection_generate';
  scopeType: 'recent_sequence' | 'calendar_period';
  scopeKey: string;
  language: string;
  startDate?: string | null;
  endDate?: string | null;
  dreamIds: string[];
  dreamCount: number;
  monthKey?: string | null;
  content: string;
  metadata?: Record<string, unknown>;
};

export async function ensureBillingAccount(client: AdminClient, userId: string): Promise<BillingAccountRow> {
  const db = client as any;
  const { data, error } = await db.rpc('billing_ensure_account', { p_user_id: userId });
  if (error || !data) {
    throw new HttpError(500, 'Failed to ensure billing account', error);
  }
  return data as BillingAccountRow;
}

export async function getSubscriptionStatus(client: AdminClient, userId: string): Promise<Record<string, unknown>> {
  const db = client as any;
  const { data, error } = await db.rpc('billing_subscription_status', { p_user_id: userId });
  if (error || !data) {
    throw new HttpError(500, 'Failed to load subscription status', error);
  }
  return data as Record<string, unknown>;
}

export async function reserveQuota(
  client: AdminClient,
  userId: string,
  action: GatewayAction,
  idempotencyKey: string,
  context: Record<string, unknown>
): Promise<QuotaReservation> {
  const db = client as any;
  const { data, error } = await db.rpc('billing_reserve_quota', {
    p_user_id: userId,
    p_action: action,
    p_idempotency_key: idempotencyKey,
    p_context: context,
  });

  if (error || !data) {
    throw new HttpError(500, 'Failed to reserve quota', error);
  }

  const reservation = data as QuotaReservation;
  return {
    status: reservation.status,
    quotaEventId: reservation.quotaEventId ?? (data as Record<string, unknown>).quota_event_id as string | undefined,
    bucketId: reservation.bucketId ?? (data as Record<string, unknown>).bucket_id as string | undefined,
    artifactId: reservation.artifactId ?? (data as Record<string, unknown>).artifact_id as string | undefined,
    reason: reservation.reason ?? (data as Record<string, unknown>).reason as string | undefined,
    result: reservation.result ?? (data as Record<string, unknown>).result as Record<string, unknown> | undefined,
  };
}

export async function commitQuota(
  client: AdminClient,
  quotaEventId: string,
  result: Record<string, unknown>
): Promise<void> {
  const db = client as any;
  const { error } = await db.rpc('billing_commit_quota', {
    p_quota_event_id: quotaEventId,
    p_result: result,
  });

  if (error) {
    throw new HttpError(500, 'Failed to commit quota', error);
  }
}

export async function releaseQuota(
  client: AdminClient,
  quotaEventId: string,
  reason: string,
  result?: Record<string, unknown>
): Promise<void> {
  const db = client as any;
  const { error } = await db.rpc('billing_release_quota', {
    p_quota_event_id: quotaEventId,
    p_reason: reason,
    p_result: result ?? {},
  });

  if (error) {
    throw new HttpError(500, 'Failed to release quota', error);
  }
}

export async function getQuotaEvent(client: AdminClient, quotaEventId: string): Promise<Record<string, unknown>> {
  const db = client as any;
  const { data, error } = await db
    .from('quota_events')
    .select('*')
    .eq('id', quotaEventId)
    .single();

  if (error || !data) {
    throw new HttpError(500, 'Failed to load quota event', error);
  }

  return data as Record<string, unknown>;
}

export async function patchQuotaEventResultContext(
  client: AdminClient,
  quotaEventId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const db = client as any;
  const current = await getQuotaEvent(client, quotaEventId);
  const resultContext = current.result_context && typeof current.result_context === 'object'
    ? current.result_context as Record<string, unknown>
    : {};
  const { error } = await db
    .from('quota_events')
    .update({
      result_context: {
        ...resultContext,
        ...patch,
      },
    })
    .eq('id', quotaEventId)
    .eq('status', 'pending');

  if (error) {
    throw new HttpError(500, 'Failed to update quota event progress', error);
  }
}

export async function upsertTransaction(client: AdminClient, purchase: VerifiedPurchase): Promise<void> {
  const db = client as any;
  const { error } = await db.from('subscription_transactions').upsert(
    {
      user_id: purchase.userId,
      provider: purchase.provider,
      transaction_key: purchase.transactionKey,
      external_transaction_id: purchase.externalTransactionId,
      original_transaction_id: purchase.originalTransactionId ?? null,
      purchase_token: purchase.purchaseToken ?? null,
      plan_code: purchase.planCode,
      entitlement_state: purchase.entitlementState,
      product_id: purchase.productId,
      transaction_type: purchase.transactionType,
      transaction_time: purchase.transactionTime ?? null,
      current_period_start: purchase.currentPeriodStart ?? null,
      current_period_end: purchase.currentPeriodEnd ?? null,
      auto_renew_status: purchase.autoRenewStatus ?? null,
      environment: purchase.environment ?? null,
      raw: purchase.raw,
    },
    { onConflict: 'transaction_key' }
  );

  if (error) {
    throw new HttpError(500, 'Failed to persist subscription transaction', error);
  }
}

export async function upsertEntitlement(client: AdminClient, snapshot: EntitlementSnapshot): Promise<void> {
  const db = client as any;
  const { error } = await db.from('subscription_entitlements').upsert(
    {
      user_id: snapshot.userId,
      provider: snapshot.provider,
      plan_code: snapshot.planCode,
      entitlement_state: snapshot.entitlementState,
      product_id: snapshot.productId,
      store_subscription_id: snapshot.storeSubscriptionId ?? null,
      original_transaction_id: snapshot.originalTransactionId ?? null,
      latest_transaction_id: snapshot.latestTransactionId ?? null,
      current_period_start: snapshot.currentPeriodStart ?? null,
      current_period_end: snapshot.currentPeriodEnd ?? null,
      auto_renew_status: snapshot.autoRenewStatus ?? null,
      environment: snapshot.environment ?? null,
      raw: snapshot.raw,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new HttpError(500, 'Failed to persist subscription entitlement', error);
  }
}

export async function recordIncomingWebhook(client: AdminClient, envelope: WebhookEventEnvelope): Promise<{ duplicate: boolean }> {
  const db = client as any;
  const { error } = await db.from('billing_webhook_events').insert({
    provider: envelope.provider,
    external_event_id: envelope.eventId,
    event_type: envelope.eventType,
    payload: envelope.payload,
    status: 'pending',
  });

  if (!error) return { duplicate: false };
  if ((error as { code?: string }).code === '23505') return { duplicate: true };
  throw new HttpError(500, 'Failed to record webhook event', error);
}

export async function markWebhookProcessed(client: AdminClient, envelope: WebhookEventEnvelope): Promise<void> {
  const db = client as any;
  const { error } = await db
    .from('billing_webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('provider', envelope.provider)
    .eq('external_event_id', envelope.eventId);

  if (error) {
    throw new HttpError(500, 'Failed to mark webhook processed', error);
  }
}

export async function markWebhookFailed(
  client: AdminClient,
  envelope: WebhookEventEnvelope,
  errorMessage: string
): Promise<void> {
  const db = client as any;
  const { error } = await db
    .from('billing_webhook_events')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('provider', envelope.provider)
    .eq('external_event_id', envelope.eventId);

  if (error) {
    throw new HttpError(500, 'Failed to mark webhook failed', error);
  }
}

export async function getDreamById(client: AdminClient, userId: string, dreamId: string): Promise<DreamRow> {
  const db = client as any;
  const { data, error } = await db
    .from('dreams')
    .select('id, title, date, content, user_id')
    .eq('user_id', userId)
    .eq('id', dreamId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'Dream not found', error);
  }
  return data as DreamRow;
}

export async function getInterpretationById(client: AdminClient, userId: string, interpretationId: string): Promise<InterpretationRow> {
  const db = client as any;
  const { data, error } = await db
    .from('interpretations')
    .select('*')
    .eq('user_id', userId)
    .eq('id', interpretationId)
    .single();

  if (error || !data) {
    throw new HttpError(404, 'Interpretation not found', error);
  }
  return data as InterpretationRow;
}

export async function getInterpretationByDreamId(client: AdminClient, userId: string, dreamId: string): Promise<InterpretationRow | null> {
  const db = client as any;
  const { data, error } = await db
    .from('interpretations')
    .select('*')
    .eq('user_id', userId)
    .eq('dream_id', dreamId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'Failed to load interpretation by dream id', error);
  }

  return (data as InterpretationRow | null) ?? null;
}

export async function saveInterpretation(
  client: AdminClient,
  payload: Record<string, unknown>
): Promise<string> {
  const db = client as any;
  const { data, error } = await db
    .from('interpretations')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();

  if (error || !data) {
    throw new HttpError(500, 'Failed to persist interpretation', error);
  }

  return (data as { id: string }).id;
}

function normalizeMetadataExtractionClaim(data: unknown): MetadataExtractionClaim {
  const raw = (data ?? {}) as Record<string, unknown>;
  const status = typeof raw.status === 'string' ? raw.status : 'processing';
  if (!['claimed', 'ready', 'processing', 'not_found'].includes(status)) {
    throw new HttpError(500, 'Invalid metadata extraction claim response');
  }

  return {
    status: status as MetadataExtractionClaimStatus,
    claimed: raw.claimed === true,
    leaseExpiresAt: typeof raw.lease_expires_at === 'string' ? raw.lease_expires_at : null,
    attempts: typeof raw.attempts === 'number' ? raw.attempts : null,
  };
}

export async function claimMetadataExtraction(
  client: AdminClient,
  userId: string,
  interpretationId: string
): Promise<MetadataExtractionClaim> {
  const db = client as any;
  const { data, error } = await db.rpc('billing_claim_metadata_extraction', {
    p_user_id: userId,
    p_interpretation_id: interpretationId,
  });

  if (error || !data) {
    throw new HttpError(500, 'Failed to claim metadata extraction', error);
  }

  return normalizeMetadataExtractionClaim(data);
}

export async function finishMetadataExtraction(
  client: AdminClient,
  userId: string,
  interpretationId: string,
  status: 'completed' | 'failed',
  errorCode?: string | null
): Promise<void> {
  const db = client as any;
  const { error } = await db.rpc('billing_finish_metadata_extraction', {
    p_user_id: userId,
    p_interpretation_id: interpretationId,
    p_status: status,
    p_error_code: errorCode ?? null,
  });

  if (error) {
    throw new HttpError(500, 'Failed to finish metadata extraction', error);
  }
}

export async function saveArtifact(client: AdminClient, artifact: ArtifactInsert): Promise<string> {
  const db = client as any;
  const { data, error } = await db
    .from('ai_generation_artifacts')
    .upsert(
      {
        user_id: artifact.userId,
        entitlement_id: artifact.entitlementId ?? null,
        quota_event_id: artifact.quotaEventId ?? null,
        source_action: artifact.sourceAction,
        scope_type: artifact.scopeType,
        scope_key: artifact.scopeKey,
        artifact_state: 'ready',
        language: artifact.language,
        start_date: artifact.startDate ?? null,
        end_date: artifact.endDate ?? null,
        dream_ids: artifact.dreamIds,
        dream_count: artifact.dreamCount,
        month_key: artifact.monthKey ?? null,
        content: artifact.content,
        metadata: artifact.metadata ?? {},
      },
      { onConflict: 'user_id,scope_type,scope_key,language' }
    )
    .select('id')
    .single();

  if (error || !data) {
    throw new HttpError(500, 'Failed to persist AI artifact', error);
  }

  return (data as { id: string }).id;
}

export async function mirrorPatternReport(
  client: AdminClient,
  userId: string,
  scopeKey: string,
  content: string
): Promise<void> {
  const db = client as any;
  const { error } = await db.from('pattern_reports').upsert(
    {
      user_id: userId,
      month_key: scopeKey,
      generated_at: new Date().toISOString(),
      text: content,
    },
    { onConflict: 'user_id,month_key' }
  );

  if (error) {
    throw new HttpError(500, 'Failed to mirror pattern report', error);
  }
}

function firstAssistantText(messages: unknown[]): string {
  const found = Array.isArray(messages)
    ? messages.find((message) => typeof message === 'object' && message !== null && (message as { role?: string }).role === 'assistant')
    : null;
  return typeof (found as { content?: unknown } | null)?.content === 'string'
    ? (found as { content: string }).content
    : '';
}

function toPatternEntry(row: InterpretationRow, dreamsById: Map<string, DreamRow>): PatternEntry | null {
  if (row.metadata_status === 'pending') return null;

  const dream = dreamsById.get(row.dream_id);
  if (!dream) return null;

  return {
    dreamId: row.dream_id,
    date: dream.date,
    extracted: {
      symbols: row.symbols ?? [],
      archetypes: normalizeArchetypalEchoes(row.archetypes ?? []),
      landscapes: row.landscapes ?? [],
      affects: row.affects ?? [],
      motifs: row.motifs ?? [],
      relational_dynamics: row.relational_dynamics ?? [],
      thresholds: row.thresholds ?? [],
      central_conflicts: row.central_conflicts ?? [],
      core_mode: row.core_mode ?? null,
      amplifications: normalizeAmplifications(row.amplifications ?? []),
      symbol_stances: row.symbol_stances ?? [],
    },
    interpretation: firstAssistantText(row.messages),
    interpretationCreatedAt: row.created_at,
  };
}

async function getDreamsMap(client: AdminClient, userId: string): Promise<Map<string, DreamRow>> {
  const db = client as any;
  const { data, error } = await db
    .from('dreams')
    .select('id, title, date, content, user_id')
    .eq('user_id', userId);

  if (error) {
    throw new HttpError(500, 'Failed to load dreams', error);
  }

  return new Map(((data ?? []) as DreamRow[]).map((dream) => [dream.id, dream]));
}

export async function getRecentPatternEntries(
  client: AdminClient,
  userId: string,
  count: number
): Promise<PatternEntry[]> {
  const [dreamsById, interpretationsResponse] = await Promise.all([
    getDreamsMap(client, userId),
    (client as any)
      .from('interpretations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  const { data, error } = interpretationsResponse;
  if (error) {
    throw new HttpError(500, 'Failed to load interpretations', error);
  }

  const entries = ((data ?? []) as InterpretationRow[])
    .map((row) => toPatternEntry(row, dreamsById))
    .filter((entry): entry is PatternEntry => Boolean(entry))
    .sort((a, b) => a.date.localeCompare(b.date));

  return entries.slice(-count);
}

export async function getPatternEntriesForPeriod(
  client: AdminClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<PatternEntry[]> {
  const [dreamsById, interpretationsResponse] = await Promise.all([
    getDreamsMap(client, userId),
    (client as any)
      .from('interpretations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  const { data, error } = interpretationsResponse;
  if (error) {
    throw new HttpError(500, 'Failed to load interpretations', error);
  }

  return ((data ?? []) as InterpretationRow[])
    .map((row) => toPatternEntry(row, dreamsById))
    .filter((entry): entry is PatternEntry => Boolean(entry))
    .filter((entry) => entry.date >= startDate && entry.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function findUserIdByAppleAccountToken(client: AdminClient, token: string): Promise<string | null> {
  const db = client as any;
  const { data, error } = await db
    .from('billing_accounts')
    .select('user_id')
    .eq('apple_app_account_token', token)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'Failed to resolve Apple billing account', error);
  }

  return (data as { user_id: string } | null)?.user_id ?? null;
}

export async function findUserIdByGoogleObfuscatedId(client: AdminClient, obfuscatedId: string): Promise<string | null> {
  const db = client as any;
  const { data, error } = await db
    .from('billing_accounts')
    .select('user_id')
    .eq('google_obfuscated_account_id', obfuscatedId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'Failed to resolve Google billing account', error);
  }

  return (data as { user_id: string } | null)?.user_id ?? null;
}

export async function getUserTimeZone(client: AdminClient, userId: string): Promise<string> {
  const db = client as any;
  const { data, error } = await db
    .from('user_settings')
    .select('time_zone')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'Failed to load user time zone', error);
  }

  return ((data as { time_zone?: string } | null)?.time_zone || 'UTC').trim() || 'UTC';
}
