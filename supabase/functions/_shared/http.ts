export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function corsHeaders(methods: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export function jsonResponse(payload: unknown, status = 200, methods = 'POST, OPTIONS'): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(methods),
      'Content-Type': 'application/json',
    },
  });
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch (error) {
    throw new HttpError(400, 'Invalid JSON payload', error);
  }
}

function safeErrorDetails(details: unknown): unknown {
  if (details == null) return undefined;
  if (typeof details !== 'object') return details;
  const raw = details as Record<string, unknown>;
  // Prefer already-sanitized diagnostic bags; never forward huge upstream bodies.
  if (raw.failureCode || raw.schemaErrors || raw.validationStage || raw.contentLength != null) {
    return {
      failureCode: raw.failureCode ?? null,
      validationStage: raw.validationStage ?? null,
      schemaErrors: Array.isArray(raw.schemaErrors) ? raw.schemaErrors.slice(0, 12) : null,
      schemaErrorCount: Array.isArray(raw.schemaErrors) ? raw.schemaErrors.length : null,
      contentLength: typeof raw.contentLength === 'number' ? raw.contentLength : null,
      looksTruncated: typeof raw.looksTruncated === 'boolean' ? raw.looksTruncated : null,
      finishReason: typeof raw.finishReason === 'string' ? raw.finishReason : null,
      provider: typeof raw.provider === 'string' ? raw.provider : null,
      model: typeof raw.model === 'string' ? raw.model : null,
      repairAttempted: typeof raw.repairAttempted === 'boolean' ? raw.repairAttempted : null,
      promptVersion: typeof raw.promptVersion === 'string' ? raw.promptVersion : null,
      dreamLength: typeof raw.dreamLength === 'number' ? raw.dreamLength : null,
      reflectionLength: typeof raw.reflectionLength === 'number' ? raw.reflectionLength : null,
      tokenLimit: typeof raw.tokenLimit === 'number' ? raw.tokenLimit : null,
      upstreamStatus: typeof raw.upstreamStatus === 'number' ? raw.upstreamStatus : null,
      upstreamErrorCode: typeof raw.upstreamErrorCode === 'string' ? raw.upstreamErrorCode : null,
      upstreamMessage: typeof raw.upstreamMessage === 'string' ? raw.upstreamMessage.slice(0, 240) : null,
    };
  }
  if (typeof raw.error === 'object' && raw.error && typeof (raw.error as { message?: unknown }).message === 'string') {
    return {
      upstreamMessage: (raw.error as { message: string }).message.slice(0, 240),
      upstreamErrorCode:
        typeof (raw.error as { code?: unknown }).code === 'string'
          ? (raw.error as { code: string }).code
          : null,
    };
  }
  if (typeof raw.message === 'string') {
    return { upstreamMessage: raw.message.slice(0, 240) };
  }
  return { detailKeys: Object.keys(raw).slice(0, 12) };
}

export function handleError(prefix: string, error: unknown, methods = 'POST, OPTIONS'): Response {
  if (error instanceof HttpError) {
    const details = safeErrorDetails(error.details);
    console.error(`[${prefix}]`, {
      message: error.message,
      status: error.status,
      details: details ?? null,
    });
    return jsonResponse(
      details !== undefined ? { error: error.message, details } : { error: error.message },
      error.status,
      methods
    );
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  console.error(`[${prefix}]`, error);
  return jsonResponse({ error: message }, 500, methods);
}
