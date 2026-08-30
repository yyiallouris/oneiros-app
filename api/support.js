const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 10_000;
const ALLOWED_ORIGINS = new Set([
  'https://oneirosjournal.com',
  'https://www.oneirosjournal.com',
]);

module.exports = async function supportHandler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const origin = request.headers?.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return response.status(403).json({ error: 'Origin not allowed' });
  }

  const body = parseBody(request.body);
  const email = String(body.email || '').trim();
  const subject = normalizeSubject(body.subject);
  const message = String(body.message || '').trim();
  const company = String(body.company || '').trim();

  // Hidden field: silently accept automated submissions without sending mail.
  if (company) return response.status(200).json({ ok: true });

  if (!isValidEmail(email) || !message) {
    return response.status(400).json({ error: 'A valid email and message are required' });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return response.status(400).json({ error: 'Message is too long' });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[web-support] Missing server configuration');
    return response.status(500).json({ error: 'Support is temporarily unavailable' });
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/support-request`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, subject, message }),
    });

    if (!upstream.ok) {
      console.error('[web-support] Upstream delivery failed', { status: upstream.status });
      return response.status(502).json({ error: 'Could not send support request' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('[web-support] Unexpected delivery failure', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return response.status(502).json({ error: 'Could not send support request' });
  }
};

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.has(origin)) return true;

  const deploymentHost = String(process.env.VERCEL_URL || '').trim();
  return Boolean(deploymentHost && origin === `https://${deploymentHost}`);
}

function parseBody(body) {
  if (body && typeof body === 'object') return body;
  if (typeof body !== 'string') return {};

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function normalizeSubject(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, MAX_SUBJECT_LENGTH);
}

function isValidEmail(value) {
  return (
    value.length > 0 &&
    value.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}
