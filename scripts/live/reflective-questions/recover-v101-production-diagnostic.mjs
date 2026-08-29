/**
 * One-time recovery for the frozen v1.0.1 production diagnostic run.
 *
 * This script never reruns Reader or open Exploring generations. It reads the
 * already committed open-turn quota telemetry directly, reconstructs only the
 * deleted synthetic rows, and executes each previously skipped closing turn
 * exactly once. Progress is persisted after every response.
 */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const EXPECTED_RUN_ID =
  'oneiros-v101-production-diagnostic-2026-08-29T14-59-46-903Z';
const EXPECTED_FIXTURE_SHA256 =
  '5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc';
const EXPECTED_METHOD_ID = 'oneiros-same-call-reflective-questions-v1.0.1';
const EXPECTED_BUNDLE_SHA256 =
  'e7e4ea4b8bfbb253912771f163f692980bbc677f051c72df4b49e5034f6fe8c7';
const COST_CAP_USD = 3;
const APPROVAL_ENV = 'ONEIROS_V101_PRODUCTION_DIAGNOSTIC_COST_APPROVED';
const NETWORK_RETRY_LIMIT = 1;

function cleanError(error) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/[\r\n]+/gu, ' ')
    .slice(0, 300);
}

function loadDotenv(repoPath) {
  const values = {};
  for (const line of readFileSync(path.join(repoPath, '.env'), 'utf8').split(/\r?\n/u)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/u, '$2');
  }
  return values;
}

async function fetchJson(url, init, label, acceptEmpty = false) {
  let lastError;
  for (let attempt = 0; attempt <= NETWORK_RETRY_LIMIT; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (response.ok && (data !== null || acceptEmpty)) return { data, status: response.status, retries: attempt };
      const reason = data?.reason ?? data?.message ?? data?.error ?? '';
      const error = new Error(`${label}_http_${response.status}${reason ? `:${reason}` : ''}`);
      if (![429, 502, 503, 504].includes(response.status) || attempt === NETWORK_RETRY_LIMIT) throw error;
      lastError = error;
    } catch (error) {
      lastError = error;
      if (attempt === NETWORK_RETRY_LIMIT) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw lastError;
}

function writeState(runDir, state, manifest) {
  state.generations.sort((a, b) =>
    a.fixture_index - b.fixture_index || a.surface.localeCompare(b.surface)
  );
  writeFileSync(path.join(runDir, 'RAW_RESULTS.json'), `${JSON.stringify(state, null, 2)}\n`);
  writeFileSync(
    path.join(runDir, 'RAW_RESULTS.jsonl'),
    `${state.generations.map((entry) => JSON.stringify(entry)).join('\n')}\n`
  );
  writeFileSync(path.join(runDir, 'RECOVERY_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function costUsd(result) {
  const direct = result?.chat_followup_cost_usd;
  const nested = result?.chat_followup_ai_cost?.estimatedUsd;
  return typeof direct === 'number' ? direct : typeof nested === 'number' ? nested : null;
}

function totalKnownCost(state) {
  return state.generations.reduce(
    (sum, entry) => sum + (typeof entry.estimated_cost_usd === 'number' ? entry.estimated_cost_usd : 0),
    0
  );
}

function applyTelemetry(entry, reservation) {
  const result = reservation.result;
  const validation = result?.contract_validation ?? null;
  const cost = result?.chat_followup_ai_cost ?? null;
  entry.contract_validation = validation;
  entry.issue_codes = Array.isArray(validation?.issues) ? validation.issues : [];
  entry.question_count = typeof validation?.question_count === 'number'
    ? validation.question_count
    : entry.question_count;
  entry.expected_question_count = typeof validation?.expected_question_count === 'number'
    ? validation.expected_question_count
    : entry.expected_question_count;
  entry.detected_language = validation?.detected_language ?? entry.detected_language;
  entry.expected_language = validation?.expected_language ?? entry.expected_language;
  entry.answer_menu_detected = typeof validation?.answer_menu_detected === 'boolean'
    ? validation.answer_menu_detected
    : entry.answer_menu_detected;
  entry.ai_cost = cost;
  entry.estimated_cost_usd = costUsd(result);
  entry.model = typeof cost?.model === 'string' ? cost.model : null;
  entry.provider = typeof cost?.provider === 'string' ? cost.provider : null;
  entry.quota_event_id = reservation.quota_event_id ?? entry.quota_event_id;
  entry.provider_api_error = null;
  entry.telemetry_recovered_via = 'billing_reserve_quota_committed_result_context';
  entry.gateway_generation_ms = typeof result?.chat_followup_ai_ms === 'number'
    ? result.chat_followup_ai_ms
    : null;
}

function closingQuestions(output) {
  return output.match(/[^\n.!?。！？]+[?？]\s*$/gu) ?? [];
}

async function main() {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid recovery locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  const repoPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const runDir = process.argv[3]
    ? path.resolve(process.argv[3])
    : path.join(repoPath, 'tmp', EXPECTED_RUN_ID);
  const rawPath = path.join(runDir, 'RAW_RESULTS.json');
  const fixturePath = path.join(runDir, 'FROZEN_FIXTURE.json');
  if (!existsSync(rawPath) || !existsSync(fixturePath)) throw new Error('Frozen run artifacts are missing.');

  const state = JSON.parse(readFileSync(rawPath, 'utf8'));
  const fixtureRaw = readFileSync(fixturePath);
  const fixture = JSON.parse(fixtureRaw.toString('utf8'));
  const fixtureHash = createHash('sha256').update(fixtureRaw).digest('hex');
  if (
    state.run_id !== EXPECTED_RUN_ID ||
    state.fixture_sha256 !== EXPECTED_FIXTURE_SHA256 ||
    fixtureHash !== EXPECTED_FIXTURE_SHA256 ||
    state.production_identity?.method_id !== EXPECTED_METHOD_ID ||
    state.production_identity?.bundle_sha256 !== EXPECTED_BUNDLE_SHA256
  ) {
    throw new Error('Frozen recovery identity mismatch. Refusing to continue.');
  }

  const manifestPath = path.join(runDir, 'RECOVERY_MANIFEST.json');
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {
        recovery_version: 1,
        run_id: state.run_id,
        started_at: new Date().toISOString(),
        finished_at: null,
        purpose: 'Recover committed open telemetry and execute only the 12 previously skipped closings.',
        reader_generations_rerun: 0,
        open_generations_rerun: 0,
        closing_generations_started: [],
        closing_generations_completed: [],
        open_telemetry_recovered: [],
        cleanup_failures: [],
        gateway_replay_finding:
          "Committed dream_followup_reply replay dereferenced missing result.value.next_messages after the original response had succeeded.",
      };
  if (manifest.finished_at) throw new Error('Recovery already completed; refusing any rerun.');

  const env = { ...loadDotenv(repoPath), ...process.env };
  const supabaseUrl = (env.EXPO_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? '').replace(/\/$/u, '');
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? '';
  const email = env.LIVE_SUPABASE_EMAIL ?? '';
  const password = env.LIVE_SUPABASE_PASSWORD ?? '';
  if (!supabaseUrl || !anonKey || !email || !password) throw new Error('Missing live Supabase credentials.');
  const auth = await fetchJson(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ email, password }),
    },
    'auth'
  );
  const token = auth.data?.access_token;
  const userId = auth.data?.user?.id;
  if (!token || !userId) throw new Error('Live authentication returned no token/user.');
  const headers = { apikey: anonKey, Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
  const restUrl = `${supabaseUrl}/rest/v1`;
  const gatewayUrl = `${supabaseUrl}/functions/v1/ai-entitlements-gateway`;
  const runStamp = state.run_id.replace('oneiros-v101-production-diagnostic-', '');
  const trajectoryCases = fixture.cases.filter((entry) => entry.trajectory);

  async function committedResult(caseId, interpretationId, turn) {
    const idempotencyKey = `v101-baseline:${state.fixture_sha256.slice(0, 16)}:${runStamp}:${caseId}:${turn}`;
    const rpc = await fetchJson(
      `${restUrl}/rpc/billing_reserve_quota`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          p_user_id: userId,
          p_action: 'dream_followup_reply',
          p_idempotency_key: idempotencyKey,
          p_context: { interpretation_id: interpretationId },
        }),
      },
      `${caseId}_${turn}_committed_result`
    );
    if (rpc.data?.status !== 'committed' || !rpc.data?.result) {
      throw new Error(`${caseId}_${turn}_result_not_committed`);
    }
    return rpc.data;
  }

  for (const fixtureCase of trajectoryCases) {
    const open = state.generations.find(
      (entry) => entry.case_id === fixtureCase.id && entry.surface === 'chat_followup'
    );
    if (!open?.output || !open.interpretation_id) throw new Error(`${fixtureCase.id}_open_output_missing`);
    if (!manifest.open_telemetry_recovered.includes(fixtureCase.id)) {
      const reservation = await committedResult(fixtureCase.id, open.interpretation_id, 'open');
      applyTelemetry(open, reservation);
      manifest.open_telemetry_recovered.push(fixtureCase.id);
      writeState(runDir, state, manifest);
    }
  }

  if (totalKnownCost(state) >= COST_CAP_USD) {
    throw new Error(`Known spend ${totalKnownCost(state)} reached the $${COST_CAP_USD} hard cap.`);
  }

  for (const fixtureCase of trajectoryCases) {
    const reader = state.generations.find(
      (entry) => entry.case_id === fixtureCase.id && entry.surface.startsWith('reading_')
    );
    const open = state.generations.find(
      (entry) => entry.case_id === fixtureCase.id && entry.surface === 'chat_followup'
    );
    const close = state.generations.find(
      (entry) => entry.case_id === fixtureCase.id && entry.surface === 'chat_followup_close'
    );
    if (!reader?.output || !open?.output || !close || !open.interpretation_id) {
      throw new Error(`${fixtureCase.id}_recovery_evidence_missing`);
    }
    if (manifest.closing_generations_completed.includes(fixtureCase.id)) continue;
    if (manifest.closing_generations_started.includes(fixtureCase.id)) {
      throw new Error(`${fixtureCase.id}_closing_started_without_completion; refusing possible model rerun`);
    }

    const dreamId = `v101-baseline-${runStamp}-${fixtureCase.id}`;
    const interpretationId = open.interpretation_id;
    const now = new Date().toISOString();
    let dreamInserted = false;
    let interpretationInserted = false;
    try {
      await fetchJson(
        `${restUrl}/dreams`,
        {
          method: 'POST',
          headers: { ...jsonHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify({
            id: dreamId,
            user_id: userId,
            date: fixture.dream_date,
            title: fixtureCase.title,
            content: fixtureCase.dream,
            archived: true,
          }),
        },
        `${fixtureCase.id}_dream_restore`,
        true
      );
      dreamInserted = true;
      const messages = [
        {
          id: randomUUID(),
          role: 'assistant',
          content: reader.output,
          timestamp: reader.generated_at,
          ...(reader.extracted_reflective_questions?.length
            ? { reflectiveQuestions: reader.extracted_reflective_questions }
            : {}),
        },
        {
          id: randomUUID(),
          role: 'user',
          content: fixtureCase.trajectory.open_user_turn,
          timestamp: open.generated_at,
        },
        {
          id: randomUUID(),
          role: 'assistant',
          content: open.output,
          timestamp: open.generated_at,
          ...(open.extracted_reflective_questions?.length
            ? { reflectiveQuestions: open.extracted_reflective_questions }
            : {}),
        },
      ];
      await fetchJson(
        `${restUrl}/interpretations`,
        {
          method: 'POST',
          headers: { ...jsonHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify({
            id: interpretationId,
            user_id: userId,
            dream_id: dreamId,
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
            display_distillation: null,
            summary: null,
            metadata_status: 'pending',
            reflection_origin: 'paid_cycle',
            chat_replies_used: 1,
            chat_replies_limit: 2,
            messages,
            created_at: now,
            updated_at: now,
          }),
        },
        `${fixtureCase.id}_interpretation_restore`,
        true
      );
      interpretationInserted = true;

      if (totalKnownCost(state) >= COST_CAP_USD) {
        throw new Error(`Known spend reached the $${COST_CAP_USD} hard cap before ${fixtureCase.id}.`);
      }
      manifest.closing_generations_started.push(fixtureCase.id);
      writeState(runDir, state, manifest);
      const idempotencyKey = `v101-baseline:${state.fixture_sha256.slice(0, 16)}:${runStamp}:${fixtureCase.id}:close`;
      const startedAt = Date.now();
      const response = await fetchJson(
        gatewayUrl,
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            action: 'dream_followup_reply',
            idempotencyKey,
            interpretationId,
            message: fixtureCase.trajectory.closing_user_turn,
          }),
        },
        `${fixtureCase.id}_closing_generation`
      );
      const completionMs = Date.now() - startedAt;
      if (response.data?.status !== 'committed' || typeof response.data?.assistant_reply !== 'string') {
        throw new Error(`${fixtureCase.id}_closing_not_committed`);
      }
      close.output = response.data.assistant_reply;
      close.extracted_reflective_questions = closingQuestions(close.output);
      close.question_count = close.extracted_reflective_questions.length;
      close.latency.completion_ms = completionMs;
      close.transport_retry_count = response.retries;
      close.transport_retry_occurred = response.retries > 0;
      close.provider_api_error = null;
      close.generated_at = new Date().toISOString();
      writeState(runDir, state, manifest);

      const reservation = await committedResult(fixtureCase.id, interpretationId, 'close');
      applyTelemetry(close, reservation);
      manifest.closing_generations_completed.push(fixtureCase.id);
      writeState(runDir, state, manifest);
      if (totalKnownCost(state) > COST_CAP_USD) {
        throw new Error(`Hard cost cap exceeded after ${fixtureCase.id}: ${totalKnownCost(state)}.`);
      }
      process.stdout.write(
        `[${manifest.closing_generations_completed.length}/12] ${fixtureCase.id}:close ` +
          `${close.contract_validation?.passed ? 'PASS' : 'FAIL'} cost=$${close.estimated_cost_usd?.toFixed(8)}\n`
      );
    } finally {
      if (interpretationInserted) {
        try {
          await fetchJson(
            `${restUrl}/interpretations?id=eq.${encodeURIComponent(interpretationId)}`,
            { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } },
            `${fixtureCase.id}_interpretation_cleanup`,
            true
          );
        } catch (error) {
          manifest.cleanup_failures.push(`${fixtureCase.id}:interpretation:${cleanError(error)}`);
        }
      }
      if (dreamInserted) {
        try {
          await fetchJson(
            `${restUrl}/dreams?id=eq.${encodeURIComponent(dreamId)}&user_id=eq.${encodeURIComponent(userId)}`,
            { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } },
            `${fixtureCase.id}_dream_cleanup`,
            true
          );
        } catch (error) {
          manifest.cleanup_failures.push(`${fixtureCase.id}:dream:${cleanError(error)}`);
        }
      }
      writeState(runDir, state, manifest);
    }
  }

  manifest.finished_at = new Date().toISOString();
  manifest.exact_total_cost_usd = totalKnownCost(state);
  state.finished_at = manifest.finished_at;
  state.fatal_error = null;
  state.recovery = {
    manifest: 'RECOVERY_MANIFEST.json',
    reader_generations_rerun: 0,
    open_generations_rerun: 0,
    closing_generations_completed: manifest.closing_generations_completed.length,
  };
  writeState(runDir, state, manifest);
  process.stdout.write(`Recovery complete. Exact total cost: $${totalKnownCost(state).toFixed(8)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${cleanError(error)}\n`);
  process.exitCode = 1;
});
