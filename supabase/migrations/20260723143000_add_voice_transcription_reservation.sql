create or replace function public.reserve_voice_transcription(
  p_user_id uuid,
  p_clip_id text
)
returns table (
  acquired boolean,
  request_status text,
  cached_transcript text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.voice_transcription_requests%rowtype;
  inserted_count integer;
begin
  delete from public.voice_transcription_requests
  where expires_at <= now();

  select * into existing
  from public.voice_transcription_requests
  where user_id = p_user_id and clip_id = p_clip_id
  for update;

  if found then
    if existing.status = 'completed' then
      return query select false, existing.status, existing.transcript;
      return;
    end if;

    if existing.updated_at > now() - interval '2 minutes' then
      return query select false, existing.status, null::text;
      return;
    end if;

    update public.voice_transcription_requests
    set updated_at = now(), expires_at = now() + interval '24 hours'
    where user_id = p_user_id and clip_id = p_clip_id;
    return query select true, 'processing'::text, null::text;
    return;
  end if;

  insert into public.voice_transcription_requests (user_id, clip_id, status)
  values (p_user_id, p_clip_id, 'processing')
  on conflict (user_id, clip_id) do nothing;
  get diagnostics inserted_count = row_count;
  return query select inserted_count = 1, 'processing'::text, null::text;
end;
$$;

revoke all on function public.reserve_voice_transcription(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_voice_transcription(uuid, text) to service_role;
