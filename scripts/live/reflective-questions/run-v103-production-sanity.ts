/**
 * One-call production sanity for the PO-approved v1.0.3 prompt + structure
 * normalizer runtime. This is not a quality benchmark and never logs dream or
 * model text.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { extractSameCallReflectiveQuestions } from '../../../src/ai/reflectiveQuestionExtract';

const EXPECTED_RUNTIME = {
  runtime_bundle_identity: 'oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0',
  method_id: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
  prompt_sha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
  reader_prompt_id: 'oneiros-dream-reflection-v3.2.3-candidate',
  normalizer_version: 'oneiros-reflective-question-structure-normalizer-v1.0.0',
} as const;

const POLL_INTERVAL_MS = 1000;
const TIMEOUT_MS = 180000;

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const match = readFileSync(envPath, 'utf8').match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/gu, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n]+/gu, ' ').slice(0, 240);
}

function runtimeIdentityMatches(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const actual = value as Record<string, unknown>;
  return Object.entries(EXPECTED_RUNTIME).every(([key, expected]) => actual[key] === expected);
}

async function fetchJson<T>(url: string, init: RequestInit, label: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const data = text.trim() ? JSON.parse(text) as unknown : {};
    if (!response.ok) {
      const reason = data && typeof data === 'object'
        ? String((data as Record<string, unknown>).reason ?? (data as Record<string, unknown>).error ?? '')
        : '';
      throw new Error(`${label}_http_${response.status}${reason ? `:${reason.slice(0, 120)}` : ''}`);
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken(
  supabaseUrl: string,
  anonKey: string
): Promise<{ token: string; userId: string }> {
  const existing = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (existing) {
    const user = await fetchJson<{ id?: string }>(
      `${supabaseUrl}/auth/v1/user`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${existing}` } },
      'auth_user'
    );
    if (!user.id) throw new Error('auth_user_missing_id');
    return { token: existing, userId: user.id };
  }
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!email || !password) throw new Error('missing_live_supabase_auth');
  const auth = await fetchJson<{ access_token?: string; user?: { id?: string } }>(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
    'auth_password'
  );
  if (!auth.access_token || !auth.user?.id) throw new Error('auth_missing_token_or_user');
  return { token: auth.access_token, userId: auth.user.id };
}

async function main(): Promise<void> {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/u, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('missing_supabase_url_or_anon_key');

  const { token, userId } = await getAccessToken(supabaseUrl, anonKey);
  const authHeaders = { apikey: anonKey, Authorization: `Bearer ${token}` };
  const restUrl = `${supabaseUrl}/rest/v1`;
  const gatewayUrl = `${supabaseUrl}/functions/v1/ai-entitlements-gateway`;
  if (process.argv.includes('--inspect-latest')) {
    const rows = await fetchJson<Array<{
      id?: string;
      status?: string;
      result_context?: Record<string, unknown>;
      created_at?: string;
    }>>(
      `${restUrl}/quota_events?action=eq.dream_reflection_generate&idempotency_key=like.v103-production-sanity:*&select=id,status,result_context,created_at&order=created_at.desc&limit=1`,
      { headers: authHeaders },
      'latest_sanity_quota_event'
    );
    const latest = rows[0];
    const result = latest?.result_context ?? {};
    const partial = typeof result.partial_reflection === 'string' ? result.partial_reflection : '';
    process.stdout.write(`${JSON.stringify({
      found: Boolean(latest),
      quota_event_id: latest?.id ?? null,
      status: latest?.status ?? null,
      created_at: latest?.created_at ?? null,
      interpretation_id_present: typeof result.interpretation_id === 'string',
      reflection_ai_ms: result.reflection_ai_ms ?? null,
      save_reflection_ms: result.save_reflection_ms ?? null,
      partial_reflection_done: result.partial_reflection_done ?? null,
      partial_reflection_length: partial.length,
      reflective_question_runtime: result.reflective_question_runtime ?? null,
      question_structure_normalization:
        result.question_structure_normalization ?? null,
      contract_validation: result.contract_validation ?? null,
      reflection_cost_usd: result.reflection_cost_usd ?? null,
    }, null, 2)}\n`);
    return;
  }
  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const dreamId = `v103-production-sanity-${suffix}`;
  const idempotencyKey = `v103-production-sanity:${suffix}:reader`;
  let interpretationId: string | null = null;
  let dreamDeleted = false;
  let interpretationDeleted = false;

  const gateway = (body: Record<string, unknown>, label: string) => fetchJson<Record<string, unknown>>(
    gatewayUrl,
    {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    label
  );

  try {
    await fetchJson<unknown>(
      `${restUrl}/dreams`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          id: dreamId,
          user_id: userId,
          date: '2026-08-29',
          title: 'Production structure sanity',
          content: 'I opened a blue gate. A small fox crossed the path, stopped, and looked back at me. I remained beside the gate while the wind moved through the grass.',
          archived: true,
        }),
      },
      'dream_insert'
    );

    const startBody = {
      action: 'dream_reflection_generate',
      idempotencyKey,
      dreamId,
      depth: 'standard',
      async: true,
    };
    const startedAt = Date.now();
    const started = await gateway(startBody, 'reflection_start');
    if (started.status !== 'pending' || typeof started.quota_event_id !== 'string') {
      throw new Error(`reflection_start_${String(started.status ?? 'unknown')}`);
    }
    const quotaEventId = started.quota_event_id;
    let committed: Record<string, unknown> | null = null;
    let firstPartialMs: number | null = null;
    let partialUpdates = 0;
    let priorPartial = '';
    while (Date.now() - startedAt < TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const status = await gateway({
        action: 'dream_reflection_status',
        idempotencyKey: `v103-production-sanity:${suffix}:status`,
        dreamId,
        quotaEventId,
      }, 'reflection_status');
      const partial = typeof status.partial_reflection === 'string' ? status.partial_reflection : '';
      if (partial && partial !== priorPartial) {
        priorPartial = partial;
        partialUpdates += 1;
        if (firstPartialMs === null) firstPartialMs = Date.now() - startedAt;
      }
      if (status.status === 'committed') {
        committed = status;
        break;
      }
      if (status.status === 'released' || status.status === 'denied') {
        throw new Error(`reflection_${String(status.status)}:${String(status.reason ?? '')}`);
      }
    }
    if (!committed) throw new Error('reflection_completion_timeout');
    if (typeof committed.reflection !== 'string' || typeof committed.interpretation_id !== 'string') {
      throw new Error('committed_payload_incomplete');
    }
    interpretationId = committed.interpretation_id;
    const questions = extractSameCallReflectiveQuestions(committed.reflection, 'standard');
    if (questions.length !== 2) throw new Error(`extracted_question_count_${questions.length}`);

    const replay = await gateway(startBody, 'reflection_committed_replay');
    if (replay.status !== 'committed' || replay.quota_event_id !== quotaEventId) {
      throw new Error('committed_replay_not_reused');
    }
    const result = replay.result && typeof replay.result === 'object'
      ? replay.result as Record<string, unknown>
      : null;
    if (!result) throw new Error('missing_committed_result_context');
    const runtime = result.reflective_question_runtime;
    if (!runtimeIdentityMatches(runtime)) {
      throw new Error('runtime_identity_mismatch');
    }
    const normalization = result.question_structure_normalization as Record<string, unknown> | undefined;
    if (normalization?.normalizer_version !== EXPECTED_RUNTIME.normalizer_version) {
      throw new Error('normalizer_identity_missing');
    }

    const rows = await fetchJson<Array<{ messages?: Array<Record<string, unknown>> }>>(
      `${restUrl}/interpretations?id=eq.${encodeURIComponent(interpretationId)}&select=messages`,
      { headers: authHeaders },
      'interpretation_read'
    );
    const assistant = rows[0]?.messages?.find((message) => message.role === 'assistant');
    const persistedQuestions = Array.isArray(assistant?.reflectiveQuestions)
      ? assistant.reflectiveQuestions.filter((value): value is string => typeof value === 'string')
      : [];
    if (assistant?.content !== committed.reflection) throw new Error('persisted_content_mismatch');
    if (persistedQuestions.length !== 2 || JSON.stringify(persistedQuestions) !== JSON.stringify(questions)) {
      throw new Error('persisted_question_extraction_mismatch');
    }

    process.stdout.write(`${JSON.stringify({
      status: 'PASS',
      gateway_generation_count: 1,
      committed_result_reused: true,
      runtime_identity: runtime,
      normalization,
      extracted_question_count: questions.length,
      persisted_question_count: persistedQuestions.length,
      completion_ms: Date.now() - startedAt,
      first_partial_ms: firstPartialMs,
      partial_update_count: partialUpdates,
      reflection_cost_usd: result.reflection_cost_usd ?? null,
    }, null, 2)}\n`);
  } finally {
    if (interpretationId) {
      try {
        await fetchJson<unknown>(
          `${restUrl}/interpretations?id=eq.${encodeURIComponent(interpretationId)}`,
          { method: 'DELETE', headers: { ...authHeaders, Prefer: 'return=minimal' } },
          'interpretation_cleanup'
        );
        interpretationDeleted = true;
      } catch {
        // Report below without masking the primary verification result.
      }
    }
    try {
      await fetchJson<unknown>(
        `${restUrl}/dreams?id=eq.${encodeURIComponent(dreamId)}&user_id=eq.${encodeURIComponent(userId)}`,
        { method: 'DELETE', headers: { ...authHeaders, Prefer: 'return=minimal' } },
        'dream_cleanup'
      );
      dreamDeleted = true;
    } catch {
      // Report below without logging sensitive row data.
    }
    process.stdout.write(`${JSON.stringify({ cleanup: { interpretationDeleted, dreamDeleted } })}\n`);
    if (!dreamDeleted || (interpretationId !== null && !interpretationDeleted)) {
      throw new Error('synthetic_cleanup_incomplete');
    }
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${cleanError(error)}\n`);
  process.exit(1);
});
