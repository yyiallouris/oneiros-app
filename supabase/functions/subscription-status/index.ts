import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { getSubscriptionStatus } from '../_shared/billing-db.ts';
import { corsHeaders, handleError, jsonResponse } from '../_shared/http.ts';
import { createAdminClient, requireUser } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  const methods = 'GET, OPTIONS';
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(methods) });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, methods);
  }

  try {
    const { userId } = await requireUser(req);
    const admin = createAdminClient();
    const status = await getSubscriptionStatus(admin, userId);
    return jsonResponse(status, 200, methods);
  } catch (error) {
    return handleError('subscription-status', error, methods);
  }
});
