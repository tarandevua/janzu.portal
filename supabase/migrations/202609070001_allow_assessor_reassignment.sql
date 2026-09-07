-- Allow administrators to cancel or replace an Assessor before scheduling.

alter table public.assessment_audit
  drop constraint if exists assessment_audit_action_check;

alter table public.assessment_audit
  add constraint assessment_audit_action_check check (action in (
    'created', 'assessor_assigned', 'assessor_assignment_cancelled', 'scheduled',
    'incomplete', 'revision_required', 'failed', 'passed', 'remediation_verified'
  ));

create or replace function public.assign_assessment_assessor(
  actor_user_id uuid, target_assessment_id uuid, target_assessor_user_id uuid
)
returns public.assessments language plpgsql security definer set search_path = public
as $$
declare assessment public.assessments;
declare designation public.assessor_designations;
declare assignment public.supervision_assignments;
declare recipient_id uuid;
declare event_key text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() or not public.user_has_role(actor_user_id, 'admin') then
    raise exception 'Only an authenticated Administrator may assign an Assessor' using errcode = '42501';
  end if;
  select * into assessment from public.assessments where id = target_assessment_id for update;
  if assessment.id is null or assessment.status <> 'awaiting_assessor' then
    raise exception 'The assessment is not awaiting assignment' using errcode = '23514';
  end if;
  select * into designation from public.assessor_designations where user_id = target_assessor_user_id and active;
  if designation.id is null or not public.user_has_role(target_assessor_user_id, 'instructor') then
    raise exception 'The selected Instructor is not an authorized Assessor' using errcode = '42501';
  end if;
  select * into assignment from public.supervision_assignments
  where trainee_user_id = assessment.trainee_user_id and status = 'active' limit 1;
  if assignment.instructor_user_id = target_assessor_user_id then
    raise exception 'The active Instructor cannot assess their assigned Trainee' using errcode = '23514';
  end if;
  if assessment.assessor_user_id = target_assessor_user_id then return assessment; end if;

  update public.assessments set
    assessor_designation_id = designation.id,
    assessor_user_id = target_assessor_user_id,
    updated_at = now()
  where id = assessment.id returning * into assessment;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, previous_status, resulting_status)
  values (assessment.id, actor_user_id, 'assessor_assigned', 'awaiting_assessor', 'awaiting_assessor');

  event_key := 'assessment:' || assessment.id::text || ':assessor_assigned:' || target_assessor_user_id::text;
  foreach recipient_id in array array[assessment.trainee_user_id, target_assessor_user_id] loop
    perform public.task_404_deliver(recipient_id, 'assessment.assessor_assigned', 'assessment_assigned', event_key,
      'Assessor assigned', 'Persona evaluadora asignada', 'An authorized Assessor was assigned in the portal.',
      'Se asignó una persona evaluadora autorizada en el portal.', '/dashboard/certification?assessmentId=' || assessment.id::text,
      jsonb_build_object('assessmentId', assessment.id, 'journeyId', assessment.journey_id,
        'traineeUserId', assessment.trainee_user_id, 'state', 'assessor_assigned',
        'assessorUserId', target_assessor_user_id, 'transitionTimestamp', now(), 'nextAction', 'schedule_assessment'));
  end loop;
  return assessment;
end;
$$;

create or replace function public.cancel_assessment_assessor(
  actor_user_id uuid, target_assessment_id uuid
)
returns public.assessments language plpgsql security definer set search_path = public
as $$
declare assessment public.assessments;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() or not public.user_has_role(actor_user_id, 'admin') then
    raise exception 'Only an authenticated Administrator may cancel an Assessor assignment' using errcode = '42501';
  end if;
  select * into assessment from public.assessments where id = target_assessment_id for update;
  if assessment.id is null or assessment.status <> 'awaiting_assessor' then
    raise exception 'Only an assessment awaiting scheduling can have its Assessor assignment cancelled' using errcode = '23514';
  end if;
  if assessment.assessor_user_id is null then return assessment; end if;

  update public.assessments set
    assessor_designation_id = null,
    assessor_user_id = null,
    updated_at = now()
  where id = assessment.id returning * into assessment;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, previous_status, resulting_status)
  values (assessment.id, actor_user_id, 'assessor_assignment_cancelled', 'awaiting_assessor', 'awaiting_assessor');
  return assessment;
end;
$$;

create or replace function public.list_assessment_queue(actor_user_id uuid)
returns table (
  journey_id uuid, trainee_user_id uuid, trainee_name text, journey_state public.certification_journey_state,
  counted_sessions_count integer, readiness_request_id uuid, readiness_status public.assessment_readiness_status,
  readiness_decision_reason text, assessment_id uuid, revision_number integer, assessor_user_id uuid,
  assessor_name text, scheduled_at timestamptz, assessment_status public.assessment_status,
  assessed_at timestamptz, notes text, next_action text, remediation_verified_at timestamptz,
  can_request_readiness boolean, can_decide_readiness boolean, can_assign_assessor boolean,
  can_schedule boolean, can_record_outcome boolean, can_verify_remediation boolean
)
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Assessment access is limited to the authenticated user' using errcode = '42501';
  end if;
  return query
  select journeys.id, journeys.trainee_user_id,
    coalesce(nullif(trainees.official_full_name, ''), nullif(trainees.full_name, ''), trainees.email),
    journeys.state, journeys.counted_sessions_count, readiness.id, readiness.status, readiness.decision_reason,
    assessment.id, assessment.revision_number, assessment.assessor_user_id,
    coalesce(nullif(assessors.official_full_name, ''), nullif(assessors.full_name, ''), assessors.email),
    assessment.scheduled_at, assessment.status, assessment.assessed_at, assessment.notes, assessment.next_action,
    assessment.remediation_verified_at,
    actor_user_id = journeys.trainee_user_id and journeys.state = 'sessions_50_reached'
      and (readiness.id is null or readiness.status in ('rejected', 'invalidated')),
    readiness.status = 'pending' and public.is_active_instructor_for(actor_user_id, journeys.trainee_user_id),
    public.user_has_role(actor_user_id, 'admin') and readiness.status = 'approved'
      and assessment.status = 'awaiting_assessor',
    assessment.assessor_user_id = actor_user_id and public.is_authorized_assessor(actor_user_id)
      and assessment.status in ('awaiting_assessor', 'scheduled'),
    assessment.assessor_user_id = actor_user_id and public.is_authorized_assessor(actor_user_id)
      and assessment.status = 'scheduled',
    public.is_active_instructor_for(actor_user_id, journeys.trainee_user_id)
      and assessment.status in ('incomplete', 'revision_required', 'failed') and assessment.remediation_verified_at is null
  from public.certification_journeys journeys
  join public.users trainees on trainees.id = journeys.trainee_user_id
  left join lateral (select * from public.assessment_readiness_requests
    where assessment_readiness_requests.journey_id = journeys.id order by requested_at desc, id desc limit 1) readiness on true
  left join lateral (select * from public.assessments where assessments.journey_id = journeys.id
    order by revision_number desc, id desc limit 1) assessment on true
  left join public.users assessors on assessors.id = assessment.assessor_user_id
  where journeys.trainee_user_id = actor_user_id or public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, journeys.trainee_user_id)
    or assessment.assessor_user_id = actor_user_id
  order by coalesce(assessment.scheduled_at, assessment.created_at, readiness.requested_at) desc nulls last, journeys.id;
end;
$$;

revoke all on function public.cancel_assessment_assessor(uuid, uuid) from public, anon;
grant execute on function public.cancel_assessment_assessor(uuid, uuid) to authenticated;
