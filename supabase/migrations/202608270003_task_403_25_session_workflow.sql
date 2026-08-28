-- TASK-403: idempotent 25-session milestone and audited Level 2 readiness review.

do $$
begin
  create type public.level_2_readiness_status as enum (
    'pending',
    'approved',
    'rejected',
    'revision_required',
    'invalidated'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.certification_milestone_attainments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.certification_journeys(id) on delete restrict,
  milestone integer not null check (milestone in (25, 50)),
  trainee_user_id uuid not null references public.users(id) on delete restrict,
  assignment_id uuid references public.supervision_assignments(id) on delete restrict,
  counted_sessions_count integer not null check (counted_sessions_count >= milestone),
  attained_at timestamptz not null default now(),
  unique (journey_id, milestone)
);

create index if not exists certification_milestone_attainments_trainee_idx
on public.certification_milestone_attainments(trainee_user_id, attained_at desc);

create table if not exists public.level_2_readiness_requests (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.certification_journeys(id) on delete restrict,
  trainee_user_id uuid not null references public.users(id) on delete restrict,
  assignment_id uuid not null references public.supervision_assignments(id) on delete restrict,
  status public.level_2_readiness_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_by uuid references public.users(id) on delete restrict,
  decided_at timestamptz,
  decision_reason text,
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint level_2_readiness_decision_shape check (
    (status = 'pending' and decided_by is null and decided_at is null and invalidated_at is null)
    or (status in ('approved', 'rejected', 'revision_required') and decided_by is not null and decided_at is not null and invalidated_at is null)
    or (status = 'invalidated' and invalidated_at is not null)
  ),
  constraint level_2_readiness_reason_length check (
    char_length(coalesce(decision_reason, '')) <= 1000
  )
);

create unique index if not exists level_2_readiness_one_pending_idx
on public.level_2_readiness_requests(journey_id)
where status = 'pending';

create index if not exists level_2_readiness_journey_idx
on public.level_2_readiness_requests(journey_id, requested_at desc, id desc);

create index if not exists level_2_readiness_assignment_idx
on public.level_2_readiness_requests(assignment_id, status, requested_at desc);

drop trigger if exists level_2_readiness_requests_set_updated_at
on public.level_2_readiness_requests;
create trigger level_2_readiness_requests_set_updated_at
before update on public.level_2_readiness_requests
for each row execute function public.set_updated_at();

create table if not exists public.level_2_readiness_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.level_2_readiness_requests(id) on delete restrict,
  actor_user_id uuid references public.users(id) on delete restrict,
  action text not null check (action in ('requested', 'approved', 'rejected', 'revision_required', 'invalidated')),
  previous_status public.level_2_readiness_status,
  resulting_status public.level_2_readiness_status not null,
  reason text,
  occurred_at timestamptz not null default now()
);

create index if not exists level_2_readiness_audit_request_idx
on public.level_2_readiness_audit(request_id, occurred_at, id);

alter table public.certification_milestone_attainments enable row level security;
alter table public.level_2_readiness_requests enable row level security;
alter table public.level_2_readiness_audit enable row level security;

drop policy if exists "Authorized participants can read milestone attainments"
on public.certification_milestone_attainments;
create policy "Authorized participants can read milestone attainments"
on public.certification_milestone_attainments for select to authenticated
using (
  trainee_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or public.is_active_instructor_for(auth.uid(), trainee_user_id)
);

drop policy if exists "Authorized participants can read Level 2 readiness"
on public.level_2_readiness_requests;
create policy "Authorized participants can read Level 2 readiness"
on public.level_2_readiness_requests for select to authenticated
using (
  trainee_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or public.is_active_instructor_for(auth.uid(), trainee_user_id)
);

drop policy if exists "Authorized participants can read Level 2 readiness audit"
on public.level_2_readiness_audit;
create policy "Authorized participants can read Level 2 readiness audit"
on public.level_2_readiness_audit for select to authenticated
using (
  exists (
    select 1 from public.level_2_readiness_requests requests
    where requests.id = level_2_readiness_audit.request_id
      and (
        requests.trainee_user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
        or public.is_active_instructor_for(auth.uid(), requests.trainee_user_id)
      )
  )
);

grant select on public.certification_milestone_attainments,
  public.level_2_readiness_requests, public.level_2_readiness_audit to authenticated;
revoke insert, update, delete on public.certification_milestone_attainments,
  public.level_2_readiness_requests, public.level_2_readiness_audit from anon, authenticated;

create or replace function public.emit_25_session_milestone(
  target_journey public.certification_journeys
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  attainment public.certification_milestone_attainments;
  active_assignment public.supervision_assignments;
  recipient record;
  recipient_locale text;
  recipient_href text;
  event_key text;
begin
  if target_journey.counted_sessions_count < 25
    or target_journey.level_1_training_record_id is null then
    return;
  end if;

  select * into active_assignment
  from public.supervision_assignments
  where trainee_user_id = target_journey.trainee_user_id and status = 'active'
  limit 1;

  insert into public.certification_milestone_attainments (
    journey_id, milestone, trainee_user_id, assignment_id, counted_sessions_count
  ) values (
    target_journey.id, 25, target_journey.trainee_user_id,
    active_assignment.id, target_journey.counted_sessions_count
  )
  on conflict (journey_id, milestone) do nothing
  returning * into attainment;

  if attainment.id is null then return; end if;

  event_key := 'certification.milestone_25_reached:' || target_journey.id::text;

  for recipient in
    select target_journey.trainee_user_id as user_id, false as is_instructor
    union all
    select active_assignment.instructor_user_id, true
    where active_assignment.instructor_user_id is not null
  loop
    select case when preferred_locale = 'es' then 'es' else 'en' end
    into recipient_locale from public.users where id = recipient.user_id;

    recipient_href := case when recipient.is_instructor
      then '/dashboard/certification?traineeId=' || target_journey.trainee_user_id::text
      else '/dashboard/certification?journeyId=' || target_journey.id::text
    end;

    insert into public.notifications (user_id, type, title, body, href, event_key)
    values (
      recipient.user_id,
      'certification_milestone_25_reached',
      case when recipient_locale = 'es' then 'Hito de 25 sesiones alcanzado' else '25-session milestone reached' end,
      case when recipient_locale = 'es'
        then 'Ya se puede solicitar la revisión de preparación para Nivel 2.'
        else 'A Level 2 readiness review can now be requested.' end,
      recipient_href,
      event_key || ':' || recipient.user_id::text
    ) on conflict (event_key) where event_key is not null do nothing;

    perform public.enqueue_transactional_email(
      'certification.milestone_25_reached',
      event_key,
      jsonb_build_object(
        'journeyId', target_journey.id,
        'traineeUserId', target_journey.trainee_user_id,
        'assignmentId', active_assignment.id,
        'countedTotal', target_journey.counted_sessions_count,
        'milestoneTimestamp', attainment.attained_at,
        'nextAction', 'request_level_2_review'
      ),
      attainment.attained_at,
      recipient.user_id,
      recipient_locale,
      'certification.milestone_25_reached',
      'v1',
      '/' || recipient_locale || recipient_href,
      event_key || ':' || recipient.user_id::text,
      true,
      null
    );
  end loop;
end;
$$;

create or replace function public.invalidate_level_2_readiness(
  target_journey_id uuid,
  invalidation_actor uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare invalidated_request public.level_2_readiness_requests;
begin
  for invalidated_request in
    select * from public.level_2_readiness_requests
    where journey_id = target_journey_id and status in ('pending', 'approved')
    for update
  loop
    update public.level_2_readiness_requests
    set status = 'invalidated', invalidated_at = now()
    where id = invalidated_request.id;

    insert into public.level_2_readiness_audit (
      request_id, actor_user_id, action, previous_status, resulting_status, reason
    ) values (
      invalidated_request.id, invalidation_actor, 'invalidated',
      invalidated_request.status, 'invalidated',
      'Level 1, counted-session, or active-assignment eligibility changed.'
    );
  end loop;
end;
$$;

create or replace function public.recalculate_certification_journey(
  target_practitioner_id uuid,
  transition_actor_user_id uuid default null
)
returns public.certification_journeys
language plpgsql security definer set search_path = public
as $$
declare
  target_trainee_user_id uuid;
  level_1_record public.training_history;
  level_2_record public.training_history;
  active_assignment public.supervision_assignments;
  journey public.certification_journeys;
  desired_state public.certification_journey_state := 'level_1_in_progress';
  desired_rank integer := 1;
  current_rank integer;
  next_rank integer;
  qualifying_count integer := 0;
  readiness_approved boolean := false;
  previous_state public.certification_journey_state;
  previous_count integer;
begin
  select user_id into target_trainee_user_id from public.practitioners where id = target_practitioner_id;
  if target_trainee_user_id is null then
    raise exception 'Certification journey target was not found' using errcode = 'P0002';
  end if;

  select * into level_1_record from public.training_history
  where trainee_user_id = target_trainee_user_id and level = 'level_1'
    and status = 'verified' and coursework_complete = true
  order by completed_on, verified_at, id limit 1;

  if level_1_record.id is not null then
    select count(*)::integer into qualifying_count from public.sessions
    where practitioner_id = target_practitioner_id and is_validated = true
      and duration_minutes >= 40
      and session_date > level_1_record.completed_on
      and exists (
        select 1 from public.session_feedback
        where session_feedback.session_id = sessions.id
          and session_feedback.submitted_at is not null
      );

    select * into active_assignment from public.supervision_assignments
    where trainee_user_id = target_trainee_user_id and status = 'active' limit 1;

    desired_state := 'practicum_in_progress'; desired_rank := 3;
    if qualifying_count >= 25 then
      desired_state := 'sessions_25_reached'; desired_rank := 4;
    end if;
    if qualifying_count >= 25 and active_assignment.id is not null then
      desired_state := 'level_2_review_eligible'; desired_rank := 5;
    end if;

    select exists (
      select 1 from public.level_2_readiness_requests
      where journey_id = (select id from public.certification_journeys where practitioner_id = target_practitioner_id)
        and assignment_id = active_assignment.id and status = 'approved'
    ) into readiness_approved;

    select * into level_2_record from public.training_history
    where trainee_user_id = target_trainee_user_id and level = 'level_2'
      and status = 'verified' and coursework_complete = true
      and completed_on >= level_1_record.completed_on
    order by completed_on, verified_at, id limit 1;

    if level_2_record.id is not null and qualifying_count >= 25
      and active_assignment.id is not null and readiness_approved then
      desired_state := 'advanced_practicum_in_progress'; desired_rank := 7;
    end if;
    if level_2_record.id is not null and qualifying_count >= 50
      and active_assignment.id is not null and readiness_approved then
      desired_state := 'sessions_50_reached'; desired_rank := 8;
    end if;
  end if;

  insert into public.certification_journeys (
    trainee_user_id, practitioner_id, counted_sessions_count,
    level_1_training_record_id, level_2_training_record_id
  ) values (
    target_trainee_user_id, target_practitioner_id, qualifying_count,
    level_1_record.id, level_2_record.id
  ) on conflict (practitioner_id) do nothing;

  select * into journey from public.certification_journeys
  where practitioner_id = target_practitioner_id for update;
  previous_state := journey.state;
  previous_count := journey.counted_sessions_count;
  current_rank := public.certification_journey_state_rank(journey.state);

  update public.certification_journeys set
    counted_sessions_count = qualifying_count,
    level_1_training_record_id = level_1_record.id,
    level_2_training_record_id = level_2_record.id
  where id = journey.id returning * into journey;

  if qualifying_count < 25 or level_1_record.id is null or active_assignment.id is null then
    perform public.invalidate_level_2_readiness(journey.id, transition_actor_user_id);
  end if;

  if current_rank <= 8 then
    if desired_rank < current_rank then
      update public.certification_journeys set state = desired_state, state_changed_at = now()
      where id = journey.id returning * into journey;
      insert into public.certification_journey_audit (
        journey_id, actor_user_id, action, previous_state, resulting_state,
        previous_counted_sessions, resulting_counted_sessions, reason
      ) values (
        journey.id, transition_actor_user_id, 'eligibility_recalculated', previous_state,
        desired_state, previous_count, qualifying_count,
        'Source training, assignment, counted-session, or readiness eligibility changed.'
      );
    elsif desired_rank > current_rank then
      for next_rank in current_rank + 1..desired_rank loop
        insert into public.certification_journey_audit (
          journey_id, actor_user_id, action, previous_state, resulting_state,
          previous_counted_sessions, resulting_counted_sessions, reason
        ) values (
          journey.id, transition_actor_user_id, 'automatic_transition',
          public.certification_journey_state_at_rank(next_rank - 1),
          public.certification_journey_state_at_rank(next_rank), previous_count,
          qualifying_count, 'Rule-driven transition from verified source records.'
        ) on conflict (journey_id, resulting_state)
          where action = 'automatic_transition' do nothing;
      end loop;
      update public.certification_journeys set state = desired_state, state_changed_at = now()
      where id = journey.id returning * into journey;
    end if;
  end if;

  perform public.emit_25_session_milestone(journey);
  return journey;
end;
$$;

create or replace function public.request_level_2_readiness(
  actor_user_id uuid,
  target_journey_id uuid
)
returns public.level_2_readiness_requests
language plpgsql security definer set search_path = public
as $$
declare
  journey public.certification_journeys;
  active_assignment public.supervision_assignments;
  existing_request public.level_2_readiness_requests;
  created_request public.level_2_readiness_requests;
  trainee_name text;
  instructor_locale text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Readiness requests are limited to the authenticated user' using errcode = '42501';
  end if;

  select * into journey from public.certification_journeys where id = target_journey_id for update;
  if journey.id is null or journey.trainee_user_id <> actor_user_id then
    raise exception 'The certification journey is not available' using errcode = '42501';
  end if;

  journey := public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  select * into active_assignment from public.supervision_assignments
  where trainee_user_id = actor_user_id and status = 'active' limit 1;

  if journey.counted_sessions_count < 25 or journey.level_1_training_record_id is null
    or active_assignment.id is null
    or journey.state <> 'level_2_review_eligible' then
    raise exception 'Level 2 readiness requirements are not satisfied' using errcode = '23514';
  end if;

  select * into existing_request from public.level_2_readiness_requests
  where journey_id = journey.id and status in ('pending', 'approved')
  order by requested_at desc limit 1;
  if existing_request.id is not null then return existing_request; end if;

  insert into public.level_2_readiness_requests (journey_id, trainee_user_id, assignment_id)
  values (journey.id, actor_user_id, active_assignment.id)
  returning * into created_request;

  insert into public.level_2_readiness_audit (
    request_id, actor_user_id, action, resulting_status
  ) values (created_request.id, actor_user_id, 'requested', 'pending');

  select coalesce(nullif(full_name, ''), 'Janzu Trainee') into trainee_name
  from public.users where id = actor_user_id;
  select case when preferred_locale = 'es' then 'es' else 'en' end into instructor_locale
  from public.users where id = active_assignment.instructor_user_id;

  insert into public.notifications (user_id, type, title, body, href, event_key)
  values (
    active_assignment.instructor_user_id,
    'level_2_readiness_requested',
    case when instructor_locale = 'es' then 'Revisión de Nivel 2 solicitada' else 'Level 2 review requested' end,
    case when instructor_locale = 'es'
      then trainee_name || ' solicitó una revisión de preparación para Nivel 2.'
      else trainee_name || ' requested a Level 2 readiness review.' end,
    '/dashboard/certification?traineeId=' || actor_user_id::text,
    'certification.level_2_readiness_requested:' || created_request.id::text || ':' || active_assignment.instructor_user_id::text
  ) on conflict (event_key) where event_key is not null do nothing;

  return created_request;
end;
$$;

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
  event_key text;
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
  event_key := 'certification.level_2:' || readiness_request.id::text || ':' || target_status::text;
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
    event_key || ':' || readiness_request.trainee_user_id::text
  ) on conflict (event_key) where event_key is not null do nothing;

  perform public.enqueue_transactional_email(
    event_type, event_key,
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
    event_key || ':' || readiness_request.trainee_user_id::text,
    true,
    null
  );

  if target_status = 'approved' then
    perform public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  end if;
  return readiness_request;
end;
$$;

create or replace function public.get_certification_journey_context(
  actor_user_id uuid,
  target_trainee_user_id uuid
)
returns table (
  id uuid, trainee_user_id uuid, practitioner_id uuid, trainee_name text,
  state public.certification_journey_state, counted_sessions_count integer,
  level_1_training_record_id uuid, level_2_training_record_id uuid,
  state_changed_at timestamptz, created_at timestamptz, updated_at timestamptz,
  readiness_request_id uuid, readiness_status public.level_2_readiness_status,
  readiness_decision_reason text, can_request_level_2_review boolean,
  can_review_level_2_request boolean
)
language plpgsql security definer set search_path = public
as $$
declare journey public.certification_journeys;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Certification access is limited to the authenticated user' using errcode = '42501';
  end if;
  if not (actor_user_id = target_trainee_user_id
    or public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, target_trainee_user_id)) then
    raise exception 'Certification journey access is not authorized' using errcode = '42501';
  end if;

  journey := public.sync_certification_journey(actor_user_id, target_trainee_user_id);
  return query
  select journey.id, journey.trainee_user_id, journey.practitioner_id,
    coalesce(nullif(users.official_full_name, ''), nullif(users.full_name, ''), users.email),
    journey.state, journey.counted_sessions_count, journey.level_1_training_record_id,
    journey.level_2_training_record_id, journey.state_changed_at, journey.created_at, journey.updated_at,
    request.id, request.status, request.decision_reason,
    actor_user_id = journey.trainee_user_id
      and journey.counted_sessions_count >= 25
      and journey.level_1_training_record_id is not null
      and journey.state = 'level_2_review_eligible'
      and not exists (
        select 1 from public.level_2_readiness_requests r
        where r.journey_id = journey.id and r.status in ('pending', 'approved')
      ),
    request.status = 'pending' and public.is_active_instructor_for(actor_user_id, journey.trainee_user_id)
  from public.users
  left join lateral (
    select * from public.level_2_readiness_requests
    where journey_id = journey.id order by requested_at desc, id desc limit 1
  ) request on true
  where users.id = journey.trainee_user_id;
end;
$$;

drop function if exists public.list_certification_journeys(uuid);

create function public.list_certification_journeys(actor_user_id uuid)
returns table (
  id uuid, trainee_user_id uuid, practitioner_id uuid, trainee_name text,
  state public.certification_journey_state, counted_sessions_count integer,
  level_1_training_record_id uuid, level_2_training_record_id uuid,
  state_changed_at timestamptz, created_at timestamptz, updated_at timestamptz,
  readiness_request_id uuid, readiness_status public.level_2_readiness_status,
  readiness_decision_reason text, can_request_level_2_review boolean,
  can_review_level_2_request boolean
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Certification access is limited to the authenticated user' using errcode = '42501';
  end if;
  if not (public.user_has_role(actor_user_id, 'admin') or public.user_has_role(actor_user_id, 'instructor')) then
    raise exception 'Certification review access is required' using errcode = '42501';
  end if;

  return query
  select journeys.id, journeys.trainee_user_id, journeys.practitioner_id,
    coalesce(nullif(users.official_full_name, ''), nullif(users.full_name, ''), users.email),
    journeys.state, journeys.counted_sessions_count, journeys.level_1_training_record_id,
    journeys.level_2_training_record_id, journeys.state_changed_at, journeys.created_at, journeys.updated_at,
    request.id, request.status, request.decision_reason, false,
    request.status = 'pending' and public.is_active_instructor_for(actor_user_id, journeys.trainee_user_id)
  from public.certification_journeys journeys
  join public.users on users.id = journeys.trainee_user_id
  left join lateral (
    select * from public.level_2_readiness_requests
    where journey_id = journeys.id order by requested_at desc, id desc limit 1
  ) request on true
  where public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, journeys.trainee_user_id)
  order by journeys.updated_at desc, journeys.id;
end;
$$;

revoke all on function public.emit_25_session_milestone(public.certification_journeys) from public, anon, authenticated;
revoke all on function public.invalidate_level_2_readiness(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_certification_journey_context(uuid, uuid) from public, anon;
revoke all on function public.request_level_2_readiness(uuid, uuid) from public, anon;
revoke all on function public.decide_level_2_readiness(uuid, uuid, public.level_2_readiness_status, text) from public, anon;
revoke all on function public.list_certification_journeys(uuid) from public, anon;
grant execute on function public.get_certification_journey_context(uuid, uuid) to authenticated;
grant execute on function public.request_level_2_readiness(uuid, uuid) to authenticated;
grant execute on function public.decide_level_2_readiness(uuid, uuid, public.level_2_readiness_status, text) to authenticated;
grant execute on function public.list_certification_journeys(uuid) to authenticated;

-- Existing eligible journeys get one deterministic first-attainment event.
do $$ declare journey public.certification_journeys;
begin
  for journey in select * from public.certification_journeys where counted_sessions_count >= 25 loop
    perform public.emit_25_session_milestone(journey);
  end loop;
end $$;
