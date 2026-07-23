create table if not exists public.voice_transcription_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  clip_id text not null check (char_length(clip_id) between 8 and 100),
  status text not null check (status in ('processing', 'completed')),
  transcript text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, clip_id),
  check ((status = 'completed' and transcript is not null) or (status = 'processing' and transcript is null))
);

alter table public.voice_transcription_requests enable row level security;

-- Only the Edge Function service-role client accesses this short-lived ledger.
create index if not exists voice_transcription_requests_expiry_idx
  on public.voice_transcription_requests (expires_at);
