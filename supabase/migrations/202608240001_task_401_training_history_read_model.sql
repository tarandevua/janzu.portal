-- TASK-401: authorized training-history read model with verifier display data.

create or replace function public.list_training_history(
  actor_user_id uuid,
  target_trainee_user_id uuid
)
returns table (
  id uuid,
  trainee_user_id uuid,
  level public.training_level,
  cohort text,
  location text,
  started_on date,
  completed_on date,
  teaching_instructor_name text,
  coursework_complete boolean,
  evidence_reference text,
  notes text,
  status public.training_record_status,
  verified_by uuid,
  verified_by_name text,
  verified_under_assignment_id uuid,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Training history access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not (
    target_trainee_user_id = actor_user_id
    or public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, target_trainee_user_id)
  ) then
    raise exception 'Training history access is not authorized'
      using errcode = '42501';
  end if;

  return query
  select
    training.id,
    training.trainee_user_id,
    training.level,
    training.cohort,
    training.location,
    training.started_on,
    training.completed_on,
    training.teaching_instructor_name,
    training.coursework_complete,
    training.evidence_reference,
    training.notes,
    training.status,
    training.verified_by,
    case
      when training.verified_by is null then null
      else coalesce(nullif(verifier.full_name, ''), 'Janzu reviewer')
    end,
    training.verified_under_assignment_id,
    training.verified_at,
    training.rejection_reason,
    training.created_at,
    training.updated_at
  from public.training_history as training
  left join public.users as verifier on verifier.id = training.verified_by
  where training.trainee_user_id = target_trainee_user_id
  order by training.created_at desc;
end;
$$;

revoke all on function public.list_training_history(uuid, uuid) from public, anon;
grant execute on function public.list_training_history(uuid, uuid) to authenticated;
