import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { persistVerifiedPurchase } from '../../../src/billing/runtime.ts';
import type { BillingProvider } from '../../../src/billing/types.ts';
import { ensureBillingAccount, upsertEntitlement, upsertTransaction } from '../_shared/billing-db.ts';
import { getProvider } from '../_shared/billing-store.ts';
import { corsHeaders, handleError, HttpError, jsonResponse, readJson } from '../_shared/http.ts';
import { createAdminClient, requireUser } from '../_shared/supabase.ts';

type RequestBody = {
  provider: BillingProvider;
  signedTransactionInfo?: string;
  purchaseToken?: string;
  packageName?: string;
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
    const { userId } = await requireUser(req);
    const body = await readJson<RequestBody>(req);
    const admin = createAdminClient();
    const account = await ensureBillingAccount(admin, userId);
    const provider = getProvider(body.provider);

    const verified =
      body.provider === 'apple'
        ? await provider.verifyPurchase({
            userId,
            signedTransactionInfo: body.signedTransactionInfo,
          })
        : await provider.verifyPurchase({
            userId,
            purchaseToken: body.purchaseToken,
            packageName: body.packageName,
          });

    if (body.provider === 'apple') {
      if (!verified.purchase.appAccountToken || verified.purchase.appAccountToken !== account.apple_app_account_token) {
        throw new HttpError(409, 'Apple purchase token does not belong to this Oneiros account');
      }
    } else if (!verified.purchase.googleObfuscatedAccountId || verified.purchase.googleObfuscatedAccountId !== account.google_obfuscated_account_id) {
      throw new HttpError(409, 'Google purchase token does not belong to this Oneiros account');
    }

    const port = {
      ensureBillingAccount: async (targetUserId: string) => {
        await ensureBillingAccount(admin, targetUserId);
      },
      upsertTransaction: async (purchase: typeof verified.purchase) => {
        await upsertTransaction(admin, purchase);
      },
      upsertEntitlement: async (snapshot: typeof verified.snapshot) => {
        await upsertEntitlement(admin, snapshot);
      },
    };

    await persistVerifiedPurchase(port, verified.purchase, verified.snapshot);

    return jsonResponse(
      {
        ok: true,
        provider: body.provider,
        transaction_key: verified.purchase.transactionKey,
        plan_code: verified.snapshot.planCode,
        entitlement_state: verified.snapshot.entitlementState,
        current_period_start: verified.snapshot.currentPeriodStart,
        current_period_end: verified.snapshot.currentPeriodEnd,
      },
      200,
      methods
    );
  } catch (error) {
    return handleError('billing-register-purchase', error, methods);
  }
});
