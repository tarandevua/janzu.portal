-- Fix Level 2 readiness decisions failing when PostgreSQL resolves `event_key`
-- as both the local PL/pgSQL variable and the notifications column.

create or replace function public.decide_level_2_readiness(
  actor_user_id uuid,
  target_request_id uuid,
  target_status public.level_2_readiness_status,
  target_reason text default null
)
returns public.level_2_readiness_requests
language plpgsql security definer set search_path = public
as $$
declare
  readiness_request public.level_2_readiness_requests;
  journey public.certification_journeys;
  trainee_locale text;
  event_type public.transactional_email_event_type;
  decision_event_key text;
  next_action text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Readiness decisions are limited to the authenticated user' using errcode = '42501';
  end if;
  if target_status not in ('approved', 'rejected', 'revision_required') then
    raise exception 'A supported readiness decision is required' using errcode = '23514';
  end if;
  if target_status <> 'approved' and nullif(trim(coalesce(target_reason, '')), '') is null then
    raise exception 'A reason is required for this decision' using errcode = '23514';
  end if;

  select * into readiness_request from public.level_2_readiness_requests
  where id = target_request_id for update;
  if readiness_request.id is null then
    raise exception 'The readiness request was not found' using errcode = 'P0002';
  end if;
  if not exists (
      select 1 from public.supervision_assignments
      where id = readiness_request.assignment_id and status = 'active'
        and instructor_user_id = actor_user_id
        and trainee_user_id = readiness_request.trainee_user_id
    ) then
    raise exception 'Only the active assigned Instructor may decide this request' using errcode = '42501';
  end if;
  if readiness_request.status = target_status and readiness_request.decided_by = actor_user_id then
    return readiness_request;
  end if;
  if readiness_request.status <> 'pending' then
    raise exception 'The Level 2 readiness request is no longer pending' using errcode = '23514';
  end if;

  select * into journey from public.certification_journeys
  where id = readiness_request.journey_id for update;
  journey := public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  if journey.counted_sessions_count < 25 or journey.level_1_training_record_id is null then
    raise exception 'Level 2 readiness requirements are no longer satisfied' using errcode = '23514';
  end if;

  update public.level_2_readiness_requests set
    status = target_status, decided_by = actor_user_id, decided_at = now(),
    decision_reason = nullif(trim(coalesce(target_reason, '')), '')
  where id = readiness_request.id returning * into readiness_request;

  insert into public.level_2_readiness_audit (
    request_id, actor_user_id, action, previous_status, resulting_status, reason
  ) values (
    readiness_request.id, actor_user_id, target_status::text, 'pending', target_status,
    readiness_request.decision_reason
  );

  event_type := case target_status
    when 'approved' then 'certification.level_2_readiness_approved'::public.transactional_email_event_type
    when 'rejected' then 'certification.level_2_readiness_rejected'::public.transactional_email_event_type
    else 'certification.level_2_readiness_revision_required'::public.transactional_email_event_type
  end;
  next_action := case target_status
    when 'approved' then 'attend_level_2'
    when 'rejected' then 'contact_instructor'
    else 'revise_and_request_again'
  end;
  decision_event_key := 'certification.level_2:' || readiness_request.id::text || ':' || target_status::text;
  select case when preferred_locale = 'es' then 'es' else 'en' end into trainee_locale
  from public.users where id = readiness_request.trainee_user_id;

  insert into public.notifications (user_id, type, title, body, href, event_key)
  values (
    readiness_request.trainee_user_id,
    'level_2_readiness_decided',
    case target_status
      when 'approved' then case when trainee_locale = 'es' then 'Preparación para Nivel 2 aprobada' else 'Level 2 readiness approved' end
      when 'rejected' then case when trainee_locale = 'es' then 'Preparación para Nivel 2 rechazada' else 'Level 2 readiness rejected' end
      else case when trainee_locale = 'es' then 'Revisión de Nivel 2 requerida' else 'Level 2 revision required' end
    end,
    case when trainee_locale = 'es'
      then 'Consulta la decisión y el siguiente paso en tu recorrido de certificación.'
      else 'View the decision and next action in your certification journey.' end,
    '/dashboard/certification?decisionId=' || readiness_request.id::text,
    decision_event_key || ':' || readiness_request.trainee_user_id::text
  ) on conflict (event_key) where event_key is not null do nothing;

  perform public.enqueue_transactional_email(
    event_type, decision_event_key,
    jsonb_build_object(
      'journeyId', readiness_request.journey_id,
      'decisionId', readiness_request.id,
      'traineeUserId', readiness_request.trainee_user_id,
      'decisionState', target_status,
      'decidingRole', 'Instructor',
      'decisionTimestamp', readiness_request.decided_at,
      'nextAction', next_action
    ),
    readiness_request.decided_at,
    readiness_request.trainee_user_id,
    trainee_locale,
    event_type,
    'v1',
    '/' || trainee_locale || '/dashboard/certification?decisionId=' || readiness_request.id::text,
    decision_event_key || ':' || readiness_request.trainee_user_id::text,
    true,
    null
  );

  if target_status = 'approved' then
    perform public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  end if;
  return readiness_request;
end;
$$;
