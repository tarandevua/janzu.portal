create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  session_date date not null,
  duration_minutes integer not null,
  location text,
  notes text,
  is_validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_duration_minutes_check check (duration_minutes > 0 and duration_minutes <= 1440)
);

create index sessions_practitioner_id_idx on public.sessions(practitioner_id);
create index sessions_client_id_idx on public.sessions(client_id);
create index sessions_session_date_idx on public.sessions(session_date desc);

create or replace function public.session_client_matches_practitioner(
  target_practitioner_id uuid,
  target_client_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_client_id is null
    or exists (
      select 1
      from public.clients
      where clients.id = target_client_id
        and clients.practitioner_id = target_practitioner_id
    );
$$;

create trigger sessions_set_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

alter table public.sessions enable row level security;

create policy "Practitioners can read their own sessions"
on public.sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = sessions.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can create their own sessions"
on public.sessions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = sessions.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  and public.session_client_matches_practitioner(practitioner_id, client_id)
);

create policy "Practitioners can update their own sessions"
on public.sessions
for update
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = sessions.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
)
with check (
  (
    exists (
      select 1
      from public.practitioners
      where practitioners.id = sessions.practitioner_id
        and practitioners.user_id = auth.uid()
    )
    or public.user_has_role(auth.uid(), 'admin')
  )
  and public.session_client_matches_practitioner(practitioner_id, client_id)
);

create policy "Practitioners can delete their own sessions"
on public.sessions
for delete
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = sessions.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);
