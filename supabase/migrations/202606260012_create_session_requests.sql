create type public.session_request_status as enum (
  'pending',
  'accepted',
  'declined'
);

create table public.session_requests (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  preferred_date date,
  message text,
  status public.session_request_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_requests_email_check check (position('@' in requester_email) > 1)
);

create index session_requests_practitioner_id_idx on public.session_requests(practitioner_id);
create index session_requests_status_idx on public.session_requests(status);
create index session_requests_created_at_idx on public.session_requests(created_at desc);

create trigger session_requests_set_updated_at
before update on public.session_requests
for each row
execute function public.set_updated_at();

create or replace function public.notify_session_request_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
begin
  select user_id
  into recipient_user_id
  from public.practitioners
  where id = new.practitioner_id;

  perform public.insert_notification(
    recipient_user_id,
    'session_request_received',
    'Session request received',
    new.requester_name || ' requested a Janzu session.',
    '/dashboard/sessions'
  );

  return new;
end;
$$;

create trigger session_requests_notify_practitioner
after insert on public.session_requests
for each row
execute function public.notify_session_request_received();

alter table public.session_requests enable row level security;

create policy "Public users can request public practitioners"
on public.session_requests
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = session_requests.practitioner_id
      and practitioners.is_public = true
  )
);

create policy "Practitioners can read their own session requests"
on public.session_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = session_requests.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can update their own session requests"
on public.session_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = session_requests.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = session_requests.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);
