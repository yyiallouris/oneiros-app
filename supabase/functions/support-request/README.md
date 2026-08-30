# support-request Edge Function

Canonical delivery path for both Oneiros support surfaces:

- signed-in `ContactScreen` requests;
- signed-out `LoginSupportScreen` requests;
- the public `oneirosjournal.com/support` form through the same-origin Vercel `/api/support` proxy.

The function owns the destination address. It validates the request, resolves the caller when available, sends the request to the support inbox through Resend, and sends a best-effort acknowledgement to the user. For an authenticated caller, the function also attempts to persist the request to `contact_messages` with the service-role key; that archive is best-effort and cannot block email delivery. The mobile client does not bypass RLS or choose `target_email`.

Responses and privacy-safe logs include a random `request_id`. Unexpected failures also log the processing stage; support-message content and email addresses are never written to logs. Supabase Function logs are diagnostic only unless a separate log drain/alerting integration has been configured.

## Required configuration

Supabase Edge Function secrets:

- `RESEND_API_KEY` — Resend API key for the verified `oneirosjournal.com` sending domain.
- `SUPPORT_EMAIL` — receiving mailbox; production value `support@oneirosjournal.com`.
- `FROM_EMAIL` — verified sender identity; production value `Oneiros Support <support@oneirosjournal.com>`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are supplied by the Supabase Edge Function runtime.

The destination is server-owned. `EXPO_PUBLIC_CONTACT_EMAIL` is not used and must not be added to an EAS/mobile build.

The public website proxy keeps `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel server environment variables. These values are not embedded in the static support-page JavaScript.

## Mailbox and DNS

Resend domain verification authorizes outbound mail; it does not create a human inbox. Production also needs a real mailbox for `support@oneirosjournal.com` so replies and direct support messages can be received.

For the current Namecheap + Resend topology:

- root (`@`) MX records belong to the mailbox provider;
- Resend's return-path MX/SPF remain on `send.oneirosjournal.com`;
- Resend DKIM remains on `resend._domainkey.oneirosjournal.com`;
- keep only one SPF TXT record at each exact host.

Use the exact mailbox-provider DNS values shown after provisioning. Do not point the root MX at Resend unless Oneiros intentionally builds a webhook-based inbound-mail system.

## Deploy

Set or confirm secrets:

```bash
supabase secrets set SUPPORT_EMAIL=support@oneirosjournal.com \
  'FROM_EMAIL=Oneiros Support <support@oneirosjournal.com>' \
  --project-ref xacdawttvtfrdbcwhcqn
```

Deploy only this function:

```bash
supabase functions deploy support-request \
  --project-ref xacdawttvtfrdbcwhcqn
```

No database migration or `supabase db push` is required for this change. The existing `contact_messages` table is written by the function's service role.

## Release verification

1. Send an email from an unrelated external account to `support@oneirosjournal.com` and reply from the mailbox.
2. Submit one signed-out Login Support request and confirm both inbox delivery and auto-reply.
3. Submit one signed-in Contact request and confirm inbox delivery and auto-reply. Confirm a matching `contact_messages` row when the archive is available; temporarily unavailable archive persistence must not fail delivery.
4. Confirm a client-side direct insert remains blocked by RLS.
5. Force or inspect one failed request and confirm its response/logs contain `request_id` and stage/status without the submitted email or message text.

The legacy `contact-email` / Postmark implementation is not part of this flow and must not be deployed.
