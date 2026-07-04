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

drop policy if exists "Practitioners can read their own certification progress"
on public.certification_progress;

create policy "Practitioners and reviewers can read certification progress"
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

drop policy if exists "Admins can update certification progress"
on public.certification_progress;

drop policy if exists "Admins and managers can update certification progress"
on public.certification_progress;

create policy "Admins and managers can update certification progress"
on public.certification_progress
for update
to authenticated
using (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'))
with check (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'));
