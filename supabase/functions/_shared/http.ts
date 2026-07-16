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

export function handleError(prefix: string, error: unknown, methods = 'POST, OPTIONS'): Response {
  if (error instanceof HttpError) {
    console.error(`[${prefix}]`, error.message, error.details ?? '');
    return jsonResponse({ error: error.message }, error.status, methods);
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  console.error(`[${prefix}]`, error);
  return jsonResponse({ error: message }, 500, methods);
}
