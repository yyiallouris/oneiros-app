# support-request Edge Function

Handles **login/support** form submissions from the Auth screen (no auth required).

1. Sends the request to **support@oneirosjournal.com** (or `SUPPORT_EMAIL`).
2. Sends an **auto-reply** to the user from **support@oneirosjournal.com** saying we've received their message and will get back soon.

Uses **Resend** (same as your Supabase SMTP for auth emails). Domain **oneirosjournal.com** must be verified in Resend.

## Env vars (Supabase → Edge Function secrets)

- **RESEND_API_KEY** (required) – Resend API key from https://resend.com/api-keys  
- **SUPPORT_EMAIL** (optional) – Where to receive requests; default `support@oneirosjournal.com`  
- **FROM_EMAIL** (optional) – Sender for both emails; default `Oneiros Support <support@oneirosjournal.com>`

## Deploy

```bash
supabase functions deploy support-request
```

Then set secrets in Supabase Dashboard → Edge Functions → support-request → Secrets, or:

```bash
supabase secrets set RESEND_API_KEY=re_xxxx
# optional:
supabase secrets set SUPPORT_EMAIL=support@oneirosjournal.com
supabase secrets set FROM_EMAIL="Oneiros Support <support@oneirosjournal.com>"
```

## Resend setup (if not already done)

You already use Resend for oneirosjournal.com (Supabase SMTP). For this function:

1. Use the **same API key** (or a new one) at https://resend.com/api-keys  
2. Ensure **support@oneirosjournal.com** is allowed (domain oneirosjournal.com verified in Resend → Domains)  
3. No extra steps if the domain is already verified for your auth emails.

The app calls this function with `supabase.functions.invoke('support-request', { body: { email, message } })`; anon key is enough.
