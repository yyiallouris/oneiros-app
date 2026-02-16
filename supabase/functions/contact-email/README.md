## contact-email Edge Function

Sends contact form submissions (rows in `contact_messages`) via **Postmark**.

### Env vars (Supabase function)
- `POSTMARK_TOKEN` (required, Postmark Server Token)
- `CONTACT_EMAIL` (optional fallback target; record.target_email is preferred)
- `FROM_EMAIL` (must be a verified sender/domain in Postmark, e.g., `no-reply@yourdomain.com`)

### Deploy
```bash
supabase functions deploy contact-email
```

### SQL trigger (already provided)
Replace `YOUR_PROJECT_REF` with your project ref (Supabase Dashboard → Project Settings → API → Project URL, e.g. `https://abcdefgh.supabase.co` → ref is `abcdefgh`). Project display name is **oneiros-dream-journal**; the ref does not change when you rename the project.

If not created yet, run in Supabase SQL editor:
```sql
create extension if not exists http;

create or replace function public.notify_contact()
returns trigger
language plpgsql
security definer
as $$
begin
  perform
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.functions.supabase.co/contact-email',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  return NEW;
end;
$$;

drop trigger if exists notify_contact_trigger on public.contact_messages;
create trigger notify_contact_trigger
after insert on public.contact_messages
for each row
execute function public.notify_contact();
```

### Notes
- The app already writes `target_email` from `.env` (`EXPO_PUBLIC_CONTACT_EMAIL`); this function uses it first, then `CONTACT_EMAIL`.
- For production, set `FROM_EMAIL` to a verified domain address in Postmark (or your sender signature). 

