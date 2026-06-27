create table if not exists public.location_review_logs (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('approve', 'reject')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists location_review_logs_location_id_idx
on public.location_review_logs(location_id);

create index if not exists location_review_logs_reviewer_id_idx
on public.location_review_logs(reviewer_id);

alter table public.location_review_logs enable row level security;

drop policy if exists "Submitters can read location review logs" on public.location_review_logs;
create policy "Submitters can read location review logs"
on public.location_review_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.locations
    join public.practitioners
      on practitioners.id = locations.submitted_by
    where locations.id = location_review_logs.location_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);

drop function if exists public.approve_location(uuid, uuid);
create or replace function public.approve_location(
  target_location_id uuid,
  reviewer_user_id uuid,
  review_reason text default null
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_location public.locations;
begin
  if not (
    public.user_has_role(reviewer_user_id, 'admin')
    or public.user_has_role(reviewer_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can approve locations';
  end if;

  update public.locations
  set status = 'approved',
      approved_by = reviewer_user_id,
      approved_at = now(),
      updated_at = now()
  where id = target_location_id
  returning * into reviewed_location;

  if reviewed_location.id is null then
    raise exception 'Location not found';
  end if;

  insert into public.location_review_logs (location_id, reviewer_id, action, reason)
  values (target_location_id, reviewer_user_id, 'approve', nullif(trim(review_reason), ''));

  return reviewed_location;
end;
$$;

drop function if exists public.reject_location(uuid, uuid);
create or replace function public.reject_location(
  target_location_id uuid,
  reviewer_user_id uuid,
  review_reason text
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_location public.locations;
begin
  if not (
    public.user_has_role(reviewer_user_id, 'admin')
    or public.user_has_role(reviewer_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can reject locations';
  end if;

  if nullif(trim(review_reason), '') is null then
    raise exception 'Rejection reason is required';
  end if;

  update public.locations
  set status = 'rejected',
      approved_by = null,
      approved_at = null,
      updated_at = now()
  where id = target_location_id
  returning * into reviewed_location;

  if reviewed_location.id is null then
    raise exception 'Location not found';
  end if;

  insert into public.location_review_logs (location_id, reviewer_id, action, reason)
  values (target_location_id, reviewer_user_id, 'reject', trim(review_reason));

  return reviewed_location;
end;
$$;
