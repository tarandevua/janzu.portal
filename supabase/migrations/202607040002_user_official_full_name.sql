alter table public.users
add column if not exists official_full_name text;

update public.users
set official_full_name = full_name
where official_full_name is null
  and full_name is not null;

create or replace function public.update_current_user_full_name(
  target_user_id uuid,
  target_full_name text,
  target_official_full_name text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  if auth.uid() <> target_user_id then
    raise exception 'Users can only update their own full name';
  end if;

  update public.users
  set full_name = nullif(trim(target_full_name), ''),
      official_full_name = nullif(trim(target_official_full_name), '')
  where id = target_user_id
  returning * into updated_user;

  return updated_user;
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
