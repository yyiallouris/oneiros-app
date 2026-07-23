import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 90_000;
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
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    },
  });
}

function requestIdFor(req: Request): string {
  const supplied = req.headers.get('X-Idempotency-Key');
  return supplied && /^[a-zA-Z0-9-]{8,100}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

serve(async (req: Request) => {
  const requestId = requestIdFor(req);
  let releaseReservation: (() => PromiseLike<unknown>) | null = null;
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ code: 'METHOD_NOT_ALLOWED' }, 405, requestId);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ code: 'UNAUTHENTICATED' }, 401, requestId);
    if (!OPENAI_API_KEY) {
      console.error('[whisper-transcription] missing OpenAI configuration', { requestId });
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

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return jsonResponse({ code: 'INVALID_AUDIO' }, 400, requestId);
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return jsonResponse({ code: 'INVALID_AUDIO' }, 415, requestId);
    }
    if (file.size <= 0) return jsonResponse({ code: 'INVALID_AUDIO' }, 400, requestId);
    if (file.size > MAX_AUDIO_BYTES) return jsonResponse({ code: 'AUDIO_TOO_LARGE' }, 413, requestId);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: reservation, error: reservationError } = await admin
      .rpc('reserve_voice_transcription', { p_user_id: user.id, p_clip_id: requestId })
      .single();
    if (reservationError) {
      console.error('[whisper-transcription] reservation failed', { requestId });
      return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
    }
    if (!reservation.acquired && reservation.request_status === 'completed' && reservation.cached_transcript) {
      return jsonResponse({ text: reservation.cached_transcript }, 200, requestId);
    }
    if (!reservation.acquired) {
      return jsonResponse({ code: 'TRANSCRIPTION_IN_PROGRESS' }, 409, requestId);
    }
    releaseReservation = () => admin.from('voice_transcription_requests')
      .delete().eq('user_id', user.id).eq('clip_id', requestId);

    const model = formData.get('model');
    const prompt = formData.get('prompt');
    const openaiFormData = new FormData();
    openaiFormData.append('file', file);
    openaiFormData.append('model', model === 'whisper-1' ? model : 'whisper-1');
    if (typeof prompt === 'string' && prompt.length <= 500) openaiFormData.append('prompt', prompt);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let openaiResponse: Response;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: openaiFormData,
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'AbortError';
      console.error('[whisper-transcription] upstream request failed', { requestId, timedOut });
      await releaseReservation();
      return jsonResponse({ code: timedOut ? 'UPSTREAM_TIMEOUT' : 'SERVICE_UNAVAILABLE' }, timedOut ? 504 : 503, requestId);
    } finally {
      clearTimeout(timeout);
    }

    if (!openaiResponse.ok) {
      const status = openaiResponse.status === 429 ? 429 : openaiResponse.status >= 500 ? 503 : 422;
      const code = status === 429 ? 'RATE_LIMITED' : status === 422 ? 'INVALID_AUDIO' : 'SERVICE_UNAVAILABLE';
      console.error('[whisper-transcription] upstream rejected audio', {
        requestId,
        upstreamStatus: openaiResponse.status,
      });
      await releaseReservation();
      return jsonResponse({ code }, status, requestId);
    }

    const data = await openaiResponse.json();
    if (!data || typeof data.text !== 'string' || !data.text.trim()) {
      await releaseReservation();
      return jsonResponse({ code: 'INVALID_AUDIO' }, 422, requestId);
    }

    const payload = { text: data.text.trim() };
    const completion = await admin.from('voice_transcription_requests').update({
      status: 'completed', transcript: payload.text, updated_at: new Date().toISOString(),
    }).eq('user_id', user.id).eq('clip_id', requestId);
    if (completion.error) {
      await releaseReservation();
      console.error('[whisper-transcription] completion persistence failed', { requestId });
      return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
    }
    console.log('[whisper-transcription] completed', { requestId, sizeBytes: file.size });
    return jsonResponse(payload, 200, requestId);
  } catch (error) {
    if (releaseReservation) await releaseReservation();
    console.error('[whisper-transcription] request failed', {
      requestId,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return jsonResponse({ code: 'SERVICE_UNAVAILABLE' }, 503, requestId);
  }
});
