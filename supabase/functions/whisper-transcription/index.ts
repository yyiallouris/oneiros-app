import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assessTranscriptQuality } from '../../../src/utils/transcriptionQuality.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TRANSCRIPTION_MODEL = 'gpt-transcribe';
const TRANSCRIPTION_STRATEGY_ID = 'voice-transcription-v3.0.0-language-neutral';
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_AUDIO_BYTES + 1024 * 1024;
const MIN_DURATION_MS = 500;
const MAX_DURATION_MS = 5 * 60 * 1000 + 15_000;
const PRIMARY_TIMEOUT_MS = 90_000;
const RECOVERY_TIMEOUT_MS = 60_000;
const ALLOWED_MIME_TYPES = new Set([
  'audio/aac',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': requestId,
    },
  });
}

function idempotencyKeyFor(req: Request): string | null {
  const supplied = req.headers.get('X-Idempotency-Key');
  return supplied && /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,99}$/.test(supplied)
    ? supplied
    : null;
}

function parseDurationMs(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || !/^\d{1,9}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function safeLanguageCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object' && 'code' in entry) {
        return (entry as { code?: unknown }).code;
      }
      return null;
    })
    .filter((code): code is string => typeof code === 'string' && /^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(code))
    .slice(0, 3);
}

type UpstreamResult =
  | { ok: true; text: string; languages: string[] }
  | { ok: false; status: number; timedOut: boolean; retryAfterSeconds: number | null };

async function requestTranscription(input: {
  file: File;
  languages?: string[];
  lowTemperatureRecovery?: boolean;
  timeoutMs: number;
}): Promise<UpstreamResult> {
  const openaiFormData = new FormData();
  openaiFormData.append('file', input.file);
  openaiFormData.append('model', TRANSCRIPTION_MODEL);
  input.languages?.forEach((language) => openaiFormData.append('languages[]', language));
  if (input.lowTemperatureRecovery) openaiFormData.append('temperature', '0');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: openaiFormData,
      signal: controller.signal,
    });
    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after'));
      return {
        ok: false,
        status: response.status,
        timedOut: false,
        retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
      };
    }

    const data = await response.json().catch(() => null);
    return {
      ok: true,
      text: typeof data?.text === 'string' ? data.text.trim() : '',
      languages: safeLanguageCodes(data?.languages),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      timedOut: error instanceof Error && error.name === 'AbortError',
      retryAfterSeconds: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function upstreamFailureResponse(result: Extract<UpstreamResult, { ok: false }>, requestId: string): Response {
  if (result.timedOut) return jsonResponse({ code: 'UPSTREAM_TIMEOUT' }, 504, requestId);
  if (result.status === 429) {
    const retryAfterSeconds = Math.min(Math.max(result.retryAfterSeconds ?? 5, 1), 60);
    return jsonResponse(
      { code: 'RATE_LIMITED', retry_after_ms: retryAfterSeconds * 1000 },
      429,
      requestId,
      { 'Retry-After': String(retryAfterSeconds) },
    );
  }
  if ([400, 413, 415, 422].includes(result.status)) {
    return jsonResponse({ code: 'INVALID_AUDIO' }, 422, requestId);
  }
  return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
}

serve(async (req: Request) => {
  const idempotencyKey = idempotencyKeyFor(req);
  const requestId = idempotencyKey ?? crypto.randomUUID();
  let releaseReservation: (() => PromiseLike<unknown>) | null = null;
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ code: 'METHOD_NOT_ALLOWED' }, 405, requestId);
  if (!idempotencyKey) {
    return jsonResponse({ code: 'INVALID_IDEMPOTENCY_KEY' }, 400, requestId);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ code: 'UNAUTHENTICATED' }, 401, requestId);
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[whisper-transcription] missing server configuration', { requestId });
      return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ code: 'UNAUTHENTICATED' }, 401, requestId);

    const contentLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
      return jsonResponse({ code: 'AUDIO_TOO_LARGE' }, 413, requestId);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const rawDurationMs = formData.get('duration_ms');
    const durationMs = parseDurationMs(rawDurationMs);
    if (!(file instanceof File)) return jsonResponse({ code: 'INVALID_AUDIO' }, 400, requestId);
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return jsonResponse({ code: 'INVALID_AUDIO' }, 415, requestId);
    }
    if (file.size <= 0) return jsonResponse({ code: 'INVALID_AUDIO' }, 400, requestId);
    if (file.size > MAX_AUDIO_BYTES) return jsonResponse({ code: 'AUDIO_TOO_LARGE' }, 413, requestId);
    if (rawDurationMs != null && durationMs == null) {
      return jsonResponse({ code: 'INVALID_AUDIO' }, 422, requestId);
    }
    if (durationMs != null && (durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS)) {
      return jsonResponse({ code: 'INVALID_AUDIO' }, 422, requestId);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: reservationRaw, error: reservationError } = await admin
      .rpc('reserve_voice_transcription', { p_user_id: user.id, p_clip_id: requestId })
      .single();
    if (reservationError || !reservationRaw || typeof reservationRaw !== 'object') {
      console.error('[whisper-transcription] reservation failed', { requestId });
      return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
    }
    const reservation = reservationRaw as {
      acquired?: unknown;
      request_status?: unknown;
      cached_transcript?: unknown;
      reservation_lease_id?: unknown;
      limit_reason?: unknown;
      retry_after_seconds?: unknown;
    };
    if (!reservation.acquired && reservation.request_status === 'completed' && reservation.cached_transcript) {
      const cachedText = String(reservation.cached_transcript);
      const cachedQuality = assessTranscriptQuality({ text: cachedText, durationMs });
      if (cachedQuality.accepted) {
        return jsonResponse({ text: cachedText, cached: true }, 200, requestId);
      }
      await admin.from('voice_transcription_requests')
        .delete()
        .eq('user_id', user.id)
        .eq('clip_id', requestId)
        .eq('status', 'completed');
      console.warn('[whisper-transcription] rejected and evicted cached transcript', {
        requestId,
        issue: cachedQuality.issue,
      });
      return jsonResponse({ code: 'LOW_CONFIDENCE_TRANSCRIPT' }, 422, requestId);
    }
    if (!reservation.acquired && reservation.request_status === 'rate_limited') {
      const retryAfterSeconds = typeof reservation.retry_after_seconds === 'number'
        ? Math.min(Math.max(Math.round(reservation.retry_after_seconds), 1), 86_400)
        : 60;
      console.warn('[whisper-transcription] user rate limit reached', {
        requestId,
        limitReason: reservation.limit_reason,
      });
      return jsonResponse(
        { code: 'RATE_LIMITED', retry_after_ms: retryAfterSeconds * 1000 },
        429,
        requestId,
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }
    if (reservation.acquired !== true || typeof reservation.reservation_lease_id !== 'string') {
      const retryAfterSeconds = typeof reservation.retry_after_seconds === 'number'
        ? Math.min(Math.max(Math.round(reservation.retry_after_seconds), 1), 60)
        : 3;
      return jsonResponse(
        { code: 'TRANSCRIPTION_IN_PROGRESS', retry_after_ms: retryAfterSeconds * 1000 },
        409,
        requestId,
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }

    const leaseId = reservation.reservation_lease_id;
    releaseReservation = () => admin.from('voice_transcription_requests')
      .delete()
      .eq('user_id', user.id)
      .eq('clip_id', requestId)
      .eq('lease_id', leaseId);

    let upstream = await requestTranscription({
      file,
      timeoutMs: PRIMARY_TIMEOUT_MS,
    });
    if (!upstream.ok) {
      console.error('[whisper-transcription] upstream request failed', {
        requestId,
        timedOut: upstream.timedOut,
        upstreamStatus: upstream.status || undefined,
      });
      await releaseReservation();
      return upstreamFailureResponse(upstream, requestId);
    }

    let quality = assessTranscriptQuality({ text: upstream.text, durationMs });
    let qualityRecoveryUsed = false;
    if (!quality.accepted) {
      qualityRecoveryUsed = true;
      console.warn('[whisper-transcription] transcript quality recovery started', {
        requestId,
        issue: quality.issue,
        durationMs,
        detectedLanguages: upstream.languages,
      });
      const recovery = await requestTranscription({
        file,
        languages: upstream.languages,
        lowTemperatureRecovery: true,
        timeoutMs: RECOVERY_TIMEOUT_MS,
      });
      if (!recovery.ok) {
        console.error('[whisper-transcription] quality recovery request failed', {
          requestId,
          timedOut: recovery.timedOut,
          upstreamStatus: recovery.status || undefined,
        });
        await releaseReservation();
        return upstreamFailureResponse(recovery, requestId);
      }
      upstream = recovery;
      quality = assessTranscriptQuality({ text: upstream.text, durationMs });
    }

    if (!quality.accepted) {
      console.warn('[whisper-transcription] transcript rejected by quality gate', {
        requestId,
        issue: quality.issue,
        durationMs,
        detectedLanguages: upstream.languages,
      });
      await releaseReservation();
      return jsonResponse({ code: 'LOW_CONFIDENCE_TRANSCRIPT' }, 422, requestId);
    }

    const completion = await admin.from('voice_transcription_requests').update({
      status: 'completed',
      transcript: upstream.text,
      updated_at: new Date().toISOString(),
    })
      .eq('user_id', user.id)
      .eq('clip_id', requestId)
      .eq('lease_id', leaseId)
      .select('clip_id')
      .maybeSingle();
    if (completion.error || !completion.data) {
      console.error('[whisper-transcription] completion fencing failed', { requestId });
      const current = await admin.from('voice_transcription_requests')
        .select('status, transcript, updated_at')
        .eq('user_id', user.id)
        .eq('clip_id', requestId)
        .maybeSingle();
      if (!current.error
        && current.data?.status === 'completed'
        && typeof current.data.transcript === 'string'
        && current.data.transcript.trim()) {
        releaseReservation = null;
        return jsonResponse({ text: current.data.transcript, cached: true }, 200, requestId);
      }
      const leaseUpdatedAt = current.data?.updated_at
        ? Date.parse(current.data.updated_at)
        : Date.now();
      const retryAfterSeconds = Math.min(
        Math.max(Math.ceil((leaseUpdatedAt + 4 * 60 * 1000 - Date.now()) / 1000), 1),
        4 * 60,
      );
      return jsonResponse(
        { code: 'TRANSCRIPTION_IN_PROGRESS', retry_after_ms: retryAfterSeconds * 1000 },
        409,
        requestId,
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }
    releaseReservation = null;

    console.log('[whisper-transcription] completed', {
      requestId,
      model: TRANSCRIPTION_MODEL,
      strategyId: TRANSCRIPTION_STRATEGY_ID,
      sizeBytes: file.size,
      durationMs,
      detectedLanguages: upstream.languages,
      qualityRecoveryUsed,
    });
    return jsonResponse({
      text: upstream.text,
      languages: upstream.languages.map((code) => ({ code })),
      quality_recovery_used: qualityRecoveryUsed,
    }, 200, requestId);
  } catch (error) {
    if (releaseReservation) await releaseReservation();
    console.error('[whisper-transcription] request failed', {
      requestId,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
  }
});
