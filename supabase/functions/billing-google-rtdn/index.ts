import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { processWebhookEvent } from '../../../src/billing/runtime.ts';
import { ensureBillingAccount, findUserIdByGoogleObfuscatedId, markWebhookFailed, markWebhookProcessed, recordIncomingWebhook, upsertEntitlement, upsertTransaction } from '../_shared/billing-db.ts';
import { getProvider } from '../_shared/billing-store.ts';
import { corsHeaders, handleError, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import { createAdminClient } from '../_shared/supabase.ts';

type PubSubPushBody = {
  message?: {
    messageId?: string;
    data?: string;
  };
};

serve(async (req: Request) => {
  const methods = 'POST, OPTIONS';
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(methods) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, methods);
  }

  try {
    const admin = createAdminClient();
    const body = await readJson<PubSubPushBody>(req);
    const provider = getProvider('google');
    const resolved = await provider.resolveWebhook({ message: body.message ?? {} });

    if (!resolved.purchase?.googleObfuscatedAccountId || !resolved.snapshot) {
      throw new HttpError(400, 'Google RTDN did not resolve a valid purchase state');
    }

    const userId = await findUserIdByGoogleObfuscatedId(admin, resolved.purchase.googleObfuscatedAccountId);
    if (!userId) {
      throw new HttpError(404, 'No Oneiros user found for Google obfuscated account id');
    }

    resolved.purchase.userId = userId;
    resolved.snapshot.userId = userId;

    const port = {
      ensureBillingAccount: async (targetUserId: string) => {
        await ensureBillingAccount(admin, targetUserId);
      },
      upsertTransaction: async (purchase: NonNullable<typeof resolved.purchase>) => {
        await upsertTransaction(admin, purchase);
      },
      upsertEntitlement: async (snapshot: NonNullable<typeof resolved.snapshot>) => {
        await upsertEntitlement(admin, snapshot);
      },
      recordIncomingWebhook: async (envelope: typeof resolved.envelope) => recordIncomingWebhook(admin, envelope),
      markWebhookProcessed: async (envelope: typeof resolved.envelope) => {
        await markWebhookProcessed(admin, envelope);
      },
      markWebhookFailed: async (envelope: typeof resolved.envelope, errorMessage: string) => {
        await markWebhookFailed(admin, envelope, errorMessage);
      },
    };

    const result = await processWebhookEvent(port, resolved.envelope, resolved.purchase, resolved.snapshot);
    return jsonResponse({ ok: true, duplicate: result.duplicate }, 200, methods);
  } catch (error) {
    return handleError('billing-google-rtdn', error, methods);
  }
});
