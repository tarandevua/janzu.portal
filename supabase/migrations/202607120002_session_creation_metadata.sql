alter table public.sessions
add column if not exists created_by_ip text,
add column if not exists created_by_user_agent text,
add column if not exists created_by_device_id text,
add column if not exists created_by_accept_language text,
add column if not exists created_by_referrer text,
add column if not exists created_by_metadata jsonb not null default '{}'::jsonb;

create index if not exists sessions_created_by_ip_idx
on public.sessions(created_by_ip)
where created_by_ip is not null;

create index if not exists sessions_created_by_device_id_idx
on public.sessions(created_by_device_id)
where created_by_device_id is not null;
