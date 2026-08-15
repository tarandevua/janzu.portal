create or replace function public.list_supervision_assignments(actor_user_id uuid)
returns table (
  id uuid,
  trainee_user_id uuid,
  trainee_name text,
  instructor_user_id uuid,
  instructor_name text,
  status public.supervision_status,
  requested_at timestamptz,
  responded_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Supervision access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  return query
  select
    assignments.id,
    assignments.trainee_user_id,
    coalesce(nullif(trainees.full_name, ''), 'Janzu Trainee'),
    assignments.instructor_user_id,
    coalesce(nullif(instructors.full_name, ''), 'Janzu Instructor'),
    assignments.status,
    assignments.requested_at,
    assignments.responded_at,
    assignments.ended_at,
    assignments.end_reason,
    assignments.updated_at
  from public.supervision_assignments assignments
  join public.users trainees on trainees.id = assignments.trainee_user_id
  join public.users instructors on instructors.id = assignments.instructor_user_id
  where actor_user_id in (assignments.trainee_user_id, assignments.instructor_user_id)
    or public.user_has_role(actor_user_id, 'admin')
  order by
    case assignments.status when 'active' then 0 when 'pending' then 1 else 2 end,
    assignments.updated_at desc;
end;
$$;

create or replace function public.list_available_trainees(actor_user_id uuid)
returns table (
  user_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  return query
  select distinct users.id, coalesce(nullif(users.full_name, ''), 'Janzu Trainee')
  from public.users
  join public.user_roles on user_roles.user_id = users.id
  join public.roles on roles.id = user_roles.role_id
  where roles.name = 'apprentice'
    and users.is_deleted = false
  order by coalesce(nullif(users.full_name, ''), 'Janzu Trainee');
end;
$$;

grant execute on function public.list_supervision_assignments(uuid) to authenticated;
grant execute on function public.list_available_trainees(uuid) to authenticated;
