alter table public.voice_transcription_requests
  add column if not exists lease_id uuid not null default gen_random_uuid();

create table if not exists public.voice_transcription_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  clip_id text not null check (char_length(clip_id) between 8 and 100),
  lease_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.voice_transcription_attempts enable row level security;

create index if not exists voice_transcription_attempts_user_created_idx
  on public.voice_transcription_attempts (user_id, created_at desc);

-- Supports the global seven-day retention delete inside reservation without a
-- full ledger scan (the user-leading index above cannot serve this predicate).
create index if not exists voice_transcription_attempts_created_idx
  on public.voice_transcription_attempts (created_at);

revoke all on table public.voice_transcription_attempts from public, anon, authenticated;

drop function if exists public.reserve_voice_transcription(uuid, text);

create function public.reserve_voice_transcription(
  p_user_id uuid,
  p_clip_id text
)
returns table (
  acquired boolean,
  request_status text,
  cached_transcript text,
  reservation_lease_id uuid,
  limit_reason text,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.voice_transcription_requests%rowtype;
  inserted_count integer;
  v_lease_id uuid := gen_random_uuid();
  v_recent_count integer;
  v_retry_after integer;
begin
  -- Serialize different clip ids for the same user so rate and concurrency checks
  -- cannot be bypassed by parallel requests.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  delete from public.voice_transcription_requests
  where expires_at <= now();

  delete from public.voice_transcription_attempts
  where created_at <= now() - interval '7 days';

  select requests.* into existing
  from public.voice_transcription_requests as requests
  where requests.user_id = p_user_id and requests.clip_id = p_clip_id
  for update;

  if found then
    if existing.status = 'completed' then
      return query select false, existing.status, existing.transcript, null::uuid, null::text, null::integer;
      return;
    end if;

    if existing.updated_at > now() - interval '4 minutes' then
      return query select false, existing.status, null::text, null::uuid, null::text, 3;
      return;
    end if;
  end if;

  select count(*) into v_recent_count
  from public.voice_transcription_requests as requests
  where requests.user_id = p_user_id
    and requests.clip_id <> p_clip_id
    and requests.status = 'processing'
    and requests.updated_at > now() - interval '4 minutes';

  if v_recent_count >= 2 then
    return query select false, 'rate_limited'::text, null::text, null::uuid,
      'concurrency'::text, 10;
    return;
  end if;

  select count(*) into v_recent_count
  from public.voice_transcription_attempts as attempts
  where attempts.user_id = p_user_id
    and attempts.created_at > now() - interval '1 hour';

  if v_recent_count >= 20 then
    select greatest(1, ceil(extract(epoch from (
      min(attempts.created_at) + interval '1 hour' - now()
    )))::integer) into v_retry_after
    from public.voice_transcription_attempts as attempts
    where attempts.user_id = p_user_id
      and attempts.created_at > now() - interval '1 hour';
    return query select false, 'rate_limited'::text, null::text, null::uuid,
      'rolling_hour'::text, coalesce(v_retry_after, 60);
    return;
  end if;

  select count(*) into v_recent_count
  from public.voice_transcription_attempts as attempts
  where attempts.user_id = p_user_id
    and attempts.created_at > now() - interval '24 hours';

  if v_recent_count >= 100 then
    select greatest(1, ceil(extract(epoch from (
      min(attempts.created_at) + interval '24 hours' - now()
    )))::integer) into v_retry_after
    from public.voice_transcription_attempts as attempts
    where attempts.user_id = p_user_id
      and attempts.created_at > now() - interval '24 hours';
    return query select false, 'rate_limited'::text, null::text, null::uuid,
      'rolling_day'::text, coalesce(v_retry_after, 300);
    return;
  end if;

  if existing.user_id is not null then
    update public.voice_transcription_requests as requests
    set updated_at = now(),
        expires_at = now() + interval '24 hours',
        lease_id = v_lease_id
    where requests.user_id = p_user_id and requests.clip_id = p_clip_id;
    insert into public.voice_transcription_attempts (user_id, clip_id, lease_id)
    values (p_user_id, p_clip_id, v_lease_id);
    return query select true, 'processing'::text, null::text, v_lease_id, null::text, null::integer;
    return;
  end if;

  insert into public.voice_transcription_requests (user_id, clip_id, status, lease_id)
  values (p_user_id, p_clip_id, 'processing', v_lease_id)
  on conflict (user_id, clip_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    insert into public.voice_transcription_attempts (user_id, clip_id, lease_id)
    values (p_user_id, p_clip_id, v_lease_id);
  end if;

  return query select inserted_count = 1, 'processing'::text, null::text,
    case when inserted_count = 1 then v_lease_id else null::uuid end,
    null::text,
    case when inserted_count = 1 then null::integer else 3 end;
end;
$$;

revoke all on function public.reserve_voice_transcription(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_voice_transcription(uuid, text) to service_role;

comment on column public.voice_transcription_requests.lease_id is
  'Fencing token: only the worker holding the current lease may complete or release this request.';

comment on table public.voice_transcription_attempts is
  'Service-role-only rolling usage ledger for transcription rate and cost controls.';
