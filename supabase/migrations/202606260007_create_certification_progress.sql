create type public.certification_status as enum (
  'in_progress',
  'eligible',
  'approved'
);

create table public.certification_progress (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null unique references public.practitioners(id) on delete cascade,
  validated_sessions_count integer not null default 0,
  required_sessions_count integer not null default 50,
  status public.certification_status not null default 'in_progress',
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certification_progress_counts_check check (
    validated_sessions_count >= 0
    and required_sessions_count > 0
  )
);

create index certification_progress_practitioner_id_idx
on public.certification_progress(practitioner_id);

create index certification_progress_status_idx
on public.certification_progress(status);

create trigger certification_progress_set_updated_at
before update on public.certification_progress
for each row
execute function public.set_updated_at();

create or replace function public.sync_certification_progress(target_practitioner_id uuid)
returns public.certification_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  validated_count integer;
  existing_status public.certification_status;
  updated_progress public.certification_progress;
begin
  select count(*)::integer
  into validated_count
  from public.sessions
  where practitioner_id = target_practitioner_id
    and is_validated = true;

  select status
  into existing_status
  from public.certification_progress
  where practitioner_id = target_practitioner_id;

  insert into public.certification_progress (
    practitioner_id,
    validated_sessions_count,
    status
  )
  values (
    target_practitioner_id,
    validated_count,
    case when validated_count >= 50 then 'eligible'::public.certification_status else 'in_progress'::public.certification_status end
  )
  on conflict (practitioner_id) do update
  set validated_sessions_count = excluded.validated_sessions_count,
      status = case
        when public.certification_progress.status = 'approved' then 'approved'::public.certification_status
        when excluded.validated_sessions_count >= public.certification_progress.required_sessions_count then 'eligible'::public.certification_status
        else 'in_progress'::public.certification_status
      end,
      updated_at = now()
  returning * into updated_progress;

  return updated_progress;
end;
$$;

create or replace function public.sync_certification_progress_from_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_certification_progress(new.practitioner_id);
  return new;
end;
$$;

create trigger sessions_sync_certification_progress
after insert or update of is_validated on public.sessions
for each row
execute function public.sync_certification_progress_from_session();

create or replace function public.approve_certification(
  target_practitioner_id uuid,
  approver_user_id uuid
)
returns public.certification_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  progress public.certification_progress;
begin
  if not (
    public.user_has_role(approver_user_id, 'admin')
    or public.user_has_role(approver_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can approve certification';
  end if;

  progress := public.sync_certification_progress(target_practitioner_id);

  if progress.validated_sessions_count < progress.required_sessions_count then
    raise exception 'Practitioner is not eligible for certification';
  end if;

  update public.certification_progress
  set status = 'approved',
      approved_by = approver_user_id,
      approved_at = now(),
      updated_at = now()
  where practitioner_id = target_practitioner_id
  returning * into progress;

  return progress;
end;
$$;

create or replace function public.list_certification_approval_candidates(reviewer_user_id uuid)
returns table (
  id uuid,
  practitioner_id uuid,
  user_id uuid,
  practitioner_name text,
  practitioner_email text,
  country text,
  city text,
  validated_sessions_count integer,
  required_sessions_count integer,
  status public.certification_status,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.user_has_role(reviewer_user_id, 'admin')
    or public.user_has_role(reviewer_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can review certification candidates';
  end if;

  return query
  select
    certification_progress.id,
    certification_progress.practitioner_id,
    practitioners.user_id,
    coalesce(users.official_full_name, users.full_name, users.email) as practitioner_name,
    users.email as practitioner_email,
    practitioners.country,
    practitioners.city,
    certification_progress.validated_sessions_count,
    certification_progress.required_sessions_count,
    certification_progress.status,
    certification_progress.approved_by,
    certification_progress.approved_at,
    certification_progress.created_at,
    certification_progress.updated_at
  from public.certification_progress
  join public.practitioners
    on practitioners.id = certification_progress.practitioner_id
  join public.users
    on users.id = practitioners.user_id
  where certification_progress.status in ('eligible', 'approved')
  order by
    case certification_progress.status
      when 'eligible' then 0
      when 'approved' then 1
      else 2
    end,
    certification_progress.updated_at desc;
end;
$$;

insert into public.certification_progress (
  practitioner_id,
  validated_sessions_count,
  status
)
select
  practitioners.id,
  count(sessions.id)::integer,
  case
    when count(sessions.id) >= 50 then 'eligible'::public.certification_status
    else 'in_progress'::public.certification_status
  end
from public.practitioners
left join public.sessions
  on sessions.practitioner_id = practitioners.id
  and sessions.is_validated = true
group by practitioners.id
on conflict (practitioner_id) do nothing;

alter table public.certification_progress enable row level security;

create policy "Practitioners can read their own certification progress"
on public.certification_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = certification_progress.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);

create policy "Admins and managers can update certification progress"
on public.certification_progress
for update
to authenticated
using (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'))
with check (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'));
