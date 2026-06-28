create type public.session_availability_status as enum (
  'available',
  'booked',
  'cancelled'
);

create table public.session_availability_slots (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.session_availability_status not null default 'available',
  session_request_id uuid references public.session_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_availability_slots_time_check check (ends_at > starts_at)
);

create index session_availability_slots_practitioner_id_idx
on public.session_availability_slots(practitioner_id);

create index session_availability_slots_public_lookup_idx
on public.session_availability_slots(practitioner_id, starts_at)
where status = 'available';

create trigger session_availability_slots_set_updated_at
before update on public.session_availability_slots
for each row
execute function public.set_updated_at();

alter table public.session_requests
add column availability_slot_id uuid references public.session_availability_slots(id) on delete set null,
add column requested_start_at timestamptz,
add column requested_end_at timestamptz;

create index session_requests_availability_slot_id_idx
on public.session_requests(availability_slot_id);

drop policy if exists "Public users can request public practitioners"
on public.session_requests;

alter table public.session_availability_slots enable row level security;

create policy "Public users can read available public practitioner slots"
on public.session_availability_slots
for select
to anon, authenticated
using (
  status = 'available'
  and starts_at > now()
  and exists (
    select 1
    from public.practitioners
    where practitioners.id = session_availability_slots.practitioner_id
      and practitioners.is_public = true
  )
);

create policy "Practitioners can manage their own availability slots"
on public.session_availability_slots
for all
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = session_availability_slots.practitioner_id
      and practitioners.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = session_availability_slots.practitioner_id
      and practitioners.user_id = auth.uid()
  )
);

create or replace function public.book_public_session_request(
  target_slot_id uuid,
  target_requester_name text,
  target_requester_email text,
  target_requester_phone text,
  target_message text
)
returns public.session_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_record public.session_availability_slots%rowtype;
  request_record public.session_requests%rowtype;
begin
  select *
  into slot_record
  from public.session_availability_slots
  where id = target_slot_id
  for update;

  if not found then
    raise exception 'Availability slot was not found.';
  end if;

  if slot_record.status <> 'available' or slot_record.starts_at <= now() then
    raise exception 'Availability slot is no longer available.';
  end if;

  if not exists (
    select 1
    from public.practitioners
    where practitioners.id = slot_record.practitioner_id
      and practitioners.is_public = true
  ) then
    raise exception 'Practitioner is not available for public booking.';
  end if;

  insert into public.session_requests (
    practitioner_id,
    availability_slot_id,
    requester_name,
    requester_email,
    requester_phone,
    preferred_date,
    requested_start_at,
    requested_end_at,
    message
  )
  values (
    slot_record.practitioner_id,
    slot_record.id,
    target_requester_name,
    target_requester_email,
    nullif(target_requester_phone, ''),
    slot_record.starts_at::date,
    slot_record.starts_at,
    slot_record.ends_at,
    nullif(target_message, '')
  )
  returning * into request_record;

  update public.session_availability_slots
  set status = 'booked',
      session_request_id = request_record.id
  where id = slot_record.id;

  return request_record;
end;
$$;

grant execute on function public.book_public_session_request(uuid, text, text, text, text)
to anon, authenticated;
