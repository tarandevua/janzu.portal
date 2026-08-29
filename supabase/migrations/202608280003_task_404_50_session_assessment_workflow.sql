-- TASK-404: auditable 50-session milestone, assessment readiness, assessor queue,
-- outcomes, and reassessment. All mutations are actor-bound RPCs.

do $$
begin
  create type public.assessment_readiness_status as enum (
    'pending', 'approved', 'rejected', 'invalidated'
  );
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.assessment_status as enum (
    'awaiting_assessor', 'scheduled', 'incomplete',
    'revision_required', 'failed', 'passed'
  );
exception when duplicate_object then null;
end;
$$;

create table if not exists public.assessor_designations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete restrict,
  active boolean not null default true,
  designated_by uuid not null references public.users(id) on delete restrict,
  designation_reason text not null check (char_length(trim(designation_reason)) between 10 and 1000),
  designated_at timestamptz not null default now(),
  revoked_by uuid references public.users(id) on delete restrict,
  revocation_reason text check (revocation_reason is null or char_length(trim(revocation_reason)) between 10 and 1000),
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint assessor_designation_state check (
    (active and revoked_by is null and revoked_at is null and revocation_reason is null)
    or (not active and revoked_by is not null and revoked_at is not null and revocation_reason is not null)
  )
);

create table if not exists public.assessor_designation_audit (
  id uuid primary key default gen_random_uuid(),
  designation_id uuid not null references public.assessor_designations(id) on delete restrict,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null check (action in ('designated', 'revoked', 'redesignated')),
  reason text not null check (char_length(trim(reason)) between 10 and 1000),
  occurred_at timestamptz not null default now()
);

create table if not exists public.assessment_readiness_requests (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.certification_journeys(id) on delete restrict,
  trainee_user_id uuid not null references public.users(id) on delete restrict,
  assignment_id uuid not null references public.supervision_assignments(id) on delete restrict,
  status public.assessment_readiness_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_by uuid references public.users(id) on delete restrict,
  decided_at timestamptz,
  decision_reason text check (decision_reason is null or char_length(trim(decision_reason)) between 10 and 1000),
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_readiness_shape check (
    (status = 'pending' and decided_by is null and decided_at is null and invalidated_at is null)
    or (status in ('approved', 'rejected') and decided_by is not null and decided_at is not null and invalidated_at is null)
    or (status = 'invalidated' and invalidated_at is not null)
  )
);

create unique index if not exists assessment_readiness_one_pending_idx
on public.assessment_readiness_requests(journey_id) where status = 'pending';
create index if not exists assessment_readiness_journey_idx
on public.assessment_readiness_requests(journey_id, requested_at desc, id desc);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.certification_journeys(id) on delete restrict,
  readiness_request_id uuid not null references public.assessment_readiness_requests(id) on delete restrict,
  trainee_user_id uuid not null references public.users(id) on delete restrict,
  revision_number integer not null default 1 check (revision_number > 0),
  previous_assessment_id uuid references public.assessments(id) on delete restrict,
  assessor_designation_id uuid references public.assessor_designations(id) on delete restrict,
  assessor_user_id uuid references public.users(id) on delete restrict,
  scheduled_at timestamptz,
  status public.assessment_status not null default 'awaiting_assessor',
  assessed_at timestamptz,
  notes text check (notes is null or char_length(trim(notes)) between 1 and 4000),
  next_action text check (next_action is null or char_length(trim(next_action)) between 10 and 1000),
  remediation_verified_by uuid references public.users(id) on delete restrict,
  remediation_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (journey_id, revision_number),
  constraint assessment_assessor_shape check (
    (assessor_designation_id is null and assessor_user_id is null)
    or (assessor_designation_id is not null and assessor_user_id is not null)
  ),
  constraint assessment_outcome_shape check (
    (status = 'awaiting_assessor' and assessed_at is null and notes is null and next_action is null)
    or (status = 'scheduled' and scheduled_at is not null and assessed_at is null and notes is null and next_action is null)
    or (status = 'passed' and assessed_at is not null and next_action is null)
    or (status in ('incomplete', 'revision_required', 'failed') and assessed_at is not null and next_action is not null)
  ),
  constraint assessment_remediation_shape check (
    (remediation_verified_by is null and remediation_verified_at is null)
    or (status in ('incomplete', 'revision_required', 'failed') and remediation_verified_by is not null and remediation_verified_at is not null)
  )
);

create index if not exists assessments_queue_idx
on public.assessments(status, scheduled_at, created_at);
create index if not exists assessments_assessor_idx
on public.assessments(assessor_user_id, status, scheduled_at);
create index if not exists assessments_trainee_idx
on public.assessments(trainee_user_id, revision_number desc);

create table if not exists public.assessment_audit (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null check (action in (
    'created', 'assessor_assigned', 'scheduled', 'incomplete',
    'revision_required', 'failed', 'passed', 'remediation_verified'
  )),
  previous_status public.assessment_status,
  resulting_status public.assessment_status not null,
  occurred_at timestamptz not null default now()
);

create table if not exists public.assessment_readiness_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.assessment_readiness_requests(id) on delete restrict,
  actor_user_id uuid references public.users(id) on delete restrict,
  action text not null check (action in ('requested', 'approved', 'rejected', 'invalidated')),
  previous_status public.assessment_readiness_status,
  resulting_status public.assessment_readiness_status not null,
  reason text,
  occurred_at timestamptz not null default now()
);

drop trigger if exists assessor_designations_set_updated_at on public.assessor_designations;
create trigger assessor_designations_set_updated_at before update on public.assessor_designations
for each row execute function public.set_updated_at();
drop trigger if exists assessment_readiness_requests_set_updated_at on public.assessment_readiness_requests;
create trigger assessment_readiness_requests_set_updated_at before update on public.assessment_readiness_requests
for each row execute function public.set_updated_at();
drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at before update on public.assessments
for each row execute function public.set_updated_at();

create or replace function public.is_authorized_assessor(candidate_user_id uuid)
returns boolean language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.assessor_designations designations
    where designations.user_id = candidate_user_id and designations.active
  ) and public.user_has_role(candidate_user_id, 'instructor');
$$;

alter table public.assessor_designations enable row level security;
alter table public.assessor_designation_audit enable row level security;
alter table public.assessment_readiness_requests enable row level security;
alter table public.assessment_readiness_audit enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_audit enable row level security;

create policy "Administrators and designated assessor can read designations"
on public.assessor_designations for select to authenticated
using (public.user_has_role(auth.uid(), 'admin') or user_id = auth.uid());
create policy "Administrators can read assessor designation audit"
on public.assessor_designation_audit for select to authenticated
using (public.user_has_role(auth.uid(), 'admin'));
create policy "Authorized participants can read assessment readiness"
on public.assessment_readiness_requests for select to authenticated
using (
  trainee_user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin')
  or public.is_active_instructor_for(auth.uid(), trainee_user_id)
  or exists (select 1 from public.assessments where assessments.readiness_request_id = assessment_readiness_requests.id and assessments.assessor_user_id = auth.uid())
);
create policy "Authorized participants can read assessment readiness audit"
on public.assessment_readiness_audit for select to authenticated
using (exists (
  select 1 from public.assessment_readiness_requests requests
  where requests.id = assessment_readiness_audit.request_id and (
    requests.trainee_user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin')
    or public.is_active_instructor_for(auth.uid(), requests.trainee_user_id)
    or exists (select 1 from public.assessments where assessments.readiness_request_id = requests.id and assessments.assessor_user_id = auth.uid())
  )
));
create policy "Authorized participants can read assessments"
on public.assessments for select to authenticated
using (
  trainee_user_id = auth.uid() or assessor_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or public.is_active_instructor_for(auth.uid(), trainee_user_id)
);
create policy "Authorized participants can read assessment audit"
on public.assessment_audit for select to authenticated
using (exists (
  select 1 from public.assessments
  where assessments.id = assessment_audit.assessment_id and (
    assessments.trainee_user_id = auth.uid() or assessments.assessor_user_id = auth.uid()
    or public.user_has_role(auth.uid(), 'admin')
    or public.is_active_instructor_for(auth.uid(), assessments.trainee_user_id)
  )
));

grant select on public.assessor_designations, public.assessor_designation_audit,
  public.assessment_readiness_requests, public.assessment_readiness_audit,
  public.assessments, public.assessment_audit to authenticated;
revoke insert, update, delete on public.assessor_designations, public.assessor_designation_audit,
  public.assessment_readiness_requests, public.assessment_readiness_audit,
  public.assessments, public.assessment_audit from anon, authenticated;

create or replace function public.task_404_deliver(
  recipient_user_id uuid,
  target_event_type public.transactional_email_event_type,
  target_notification_type public.notification_type,
  target_event_key text,
  target_title_en text,
  target_title_es text,
  target_body_en text,
  target_body_es text,
  target_href text,
  target_metadata jsonb,
  target_occurred_at timestamptz default now()
)
returns void language plpgsql security definer set search_path = public
as $$
declare recipient_locale text;
begin
  if recipient_user_id is null then return; end if;
  select case when preferred_locale = 'es' then 'es' else 'en' end into recipient_locale
  from public.users where id = recipient_user_id;

  insert into public.notifications (user_id, type, title, body, href, event_key)
  values (
    recipient_user_id, target_notification_type,
    case when recipient_locale = 'es' then target_title_es else target_title_en end,
    case when recipient_locale = 'es' then target_body_es else target_body_en end,
    target_href, target_event_key || ':' || recipient_user_id::text
  ) on conflict (event_key) where event_key is not null do nothing;

  perform public.enqueue_transactional_email(
    target_event_type, target_event_key, target_metadata, target_occurred_at,
    recipient_user_id, recipient_locale, target_event_type, 'v1',
    '/' || recipient_locale || target_href,
    target_event_key || ':' || recipient_user_id::text, true, null
  );
end;
$$;

-- TASK-403 compatibility: avoid a PL/pgSQL variable collision with the
-- notifications(event_key) partial unique-index predicate.
create or replace function public.emit_25_session_milestone(
  target_journey public.certification_journeys
)
returns void language plpgsql security definer set search_path = public
as $$
declare
  attainment public.certification_milestone_attainments;
  active_assignment public.supervision_assignments;
  recipient record;
  recipient_locale text;
  recipient_href text;
  milestone_event_key text;
begin
  if target_journey.counted_sessions_count < 25 or target_journey.level_1_training_record_id is null then return; end if;
  select * into active_assignment from public.supervision_assignments
  where trainee_user_id = target_journey.trainee_user_id and status = 'active' limit 1;
  insert into public.certification_milestone_attainments (
    journey_id, milestone, trainee_user_id, assignment_id, counted_sessions_count
  ) values (target_journey.id, 25, target_journey.trainee_user_id, active_assignment.id, target_journey.counted_sessions_count)
  on conflict (journey_id, milestone) do nothing returning * into attainment;
  if attainment.id is null then return; end if;
  milestone_event_key := 'certification.milestone_25_reached:' || target_journey.id::text;
  for recipient in
    select target_journey.trainee_user_id as user_id, false as is_instructor
    union all select active_assignment.instructor_user_id, true where active_assignment.instructor_user_id is not null
  loop
    select case when preferred_locale = 'es' then 'es' else 'en' end into recipient_locale
    from public.users where id = recipient.user_id;
    recipient_href := case when recipient.is_instructor
      then '/dashboard/certification?traineeId=' || target_journey.trainee_user_id::text
      else '/dashboard/certification?journeyId=' || target_journey.id::text end;
    insert into public.notifications (user_id, type, title, body, href, event_key)
    values (recipient.user_id, 'certification_milestone_25_reached',
      case when recipient_locale = 'es' then 'Hito de 25 sesiones alcanzado' else '25-session milestone reached' end,
      case when recipient_locale = 'es' then 'Ya se puede solicitar la revisión de preparación para Nivel 2.'
        else 'A Level 2 readiness review can now be requested.' end,
      recipient_href, milestone_event_key || ':' || recipient.user_id::text)
    on conflict (event_key) where event_key is not null do nothing;
    perform public.enqueue_transactional_email(
      'certification.milestone_25_reached', milestone_event_key,
      jsonb_build_object('journeyId', target_journey.id, 'traineeUserId', target_journey.trainee_user_id,
        'assignmentId', active_assignment.id, 'countedTotal', target_journey.counted_sessions_count,
        'milestoneTimestamp', attainment.attained_at, 'nextAction', 'request_level_2_review'),
      attainment.attained_at, recipient.user_id, recipient_locale,
      'certification.milestone_25_reached', 'v1', '/' || recipient_locale || recipient_href,
      milestone_event_key || ':' || recipient.user_id::text, true, null);
  end loop;
end;
$$;

create or replace function public.emit_50_session_milestone(target_journey public.certification_journeys)
returns void language plpgsql security definer set search_path = public
as $$
declare attainment public.certification_milestone_attainments;
declare active_assignment public.supervision_assignments;
declare recipient record;
declare event_key text;
begin
  if target_journey.counted_sessions_count < 50 or target_journey.level_2_training_record_id is null
    or public.certification_journey_state_rank(target_journey.state) < 7 then return; end if;
  select * into active_assignment from public.supervision_assignments
  where trainee_user_id = target_journey.trainee_user_id and status = 'active' limit 1;
  if active_assignment.id is null then return; end if;
  if not exists (
    select 1 from public.level_2_readiness_requests
    where journey_id = target_journey.id and assignment_id = active_assignment.id and status = 'approved'
  ) then return; end if;

  insert into public.certification_milestone_attainments (
    journey_id, milestone, trainee_user_id, assignment_id, counted_sessions_count
  ) values (target_journey.id, 50, target_journey.trainee_user_id, active_assignment.id, target_journey.counted_sessions_count)
  on conflict (journey_id, milestone) do nothing returning * into attainment;
  if attainment.id is null then return; end if;
  event_key := 'certification.milestone_50_reached:' || target_journey.id::text;

  for recipient in
    select target_journey.trainee_user_id user_id, false reviewer
    union
    select active_assignment.instructor_user_id, true
    union
    select user_roles.user_id, true from public.user_roles
      join public.roles on roles.id = user_roles.role_id where roles.name = 'admin'
  loop
    perform public.task_404_deliver(
      recipient.user_id, 'certification.milestone_50_reached', 'certification_milestone_50_reached', event_key,
      '50-session milestone reached', 'Hito de 50 sesiones alcanzado',
      'Assessment readiness can now be reviewed in the portal.',
      'La preparación para la evaluación ya puede revisarse en el portal.',
      case when recipient.reviewer then '/dashboard/certification?traineeId=' || target_journey.trainee_user_id::text
           else '/dashboard/certification?journeyId=' || target_journey.id::text end,
      jsonb_build_object('journeyId', target_journey.id, 'traineeUserId', target_journey.trainee_user_id,
        'assignmentId', active_assignment.id, 'countedTotal', target_journey.counted_sessions_count,
        'milestoneTimestamp', attainment.attained_at, 'nextAction', 'request_assessment_readiness'),
      attainment.attained_at
    );
  end loop;
end;
$$;

create or replace function public.invalidate_assessment_readiness(target_journey_id uuid, transition_actor_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare target_request public.assessment_readiness_requests;
begin
  for target_request in select * from public.assessment_readiness_requests
    where journey_id = target_journey_id and status in ('pending', 'approved') for update
  loop
    update public.assessment_readiness_requests set status = 'invalidated', invalidated_at = now()
    where id = target_request.id;
    insert into public.assessment_readiness_audit (
      request_id, actor_user_id, action, previous_status, resulting_status, reason
    ) values (target_request.id, transition_actor_user_id, 'invalidated', target_request.status,
      'invalidated', 'Training, practice, or active-Instructor eligibility changed.');
  end loop;
end;
$$;

-- Correct the source projection to DEC-02's 60-minute rule and extend it through readiness.
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
  level_2_readiness_approved boolean := false;
  assessment_readiness_approved boolean := false;
  previous_state public.certification_journey_state;
  previous_count integer;
begin
  select user_id into target_trainee_user_id from public.practitioners where id = target_practitioner_id;
  if target_trainee_user_id is null then raise exception 'Certification journey target was not found' using errcode = 'P0002'; end if;

  select * into level_1_record from public.training_history
  where trainee_user_id = target_trainee_user_id and level = 'level_1'
    and status = 'verified' and coursework_complete = true
  order by completed_on, verified_at, id limit 1;

  if level_1_record.id is not null then
    select count(*)::integer into qualifying_count from public.sessions
    where practitioner_id = target_practitioner_id and is_validated = true
      and duration_minutes >= 60 and session_date > level_1_record.completed_on;
    select * into active_assignment from public.supervision_assignments
    where trainee_user_id = target_trainee_user_id and status = 'active' limit 1;
    desired_state := 'practicum_in_progress'; desired_rank := 3;
    if qualifying_count >= 25 then desired_state := 'sessions_25_reached'; desired_rank := 4; end if;
    if qualifying_count >= 25 and active_assignment.id is not null then desired_state := 'level_2_review_eligible'; desired_rank := 5; end if;

    select exists (select 1 from public.level_2_readiness_requests
      where journey_id = (select id from public.certification_journeys where practitioner_id = target_practitioner_id)
        and assignment_id = active_assignment.id and status = 'approved') into level_2_readiness_approved;
    select * into level_2_record from public.training_history
    where trainee_user_id = target_trainee_user_id and level = 'level_2'
      and status = 'verified' and coursework_complete = true and completed_on >= level_1_record.completed_on
    order by completed_on, verified_at, id limit 1;
    if level_2_record.id is not null and qualifying_count >= 25 and active_assignment.id is not null and level_2_readiness_approved then
      desired_state := 'advanced_practicum_in_progress'; desired_rank := 7;
    end if;
    if level_2_record.id is not null and qualifying_count >= 50 and active_assignment.id is not null and level_2_readiness_approved then
      desired_state := 'sessions_50_reached'; desired_rank := 8;
    end if;
    select exists (select 1 from public.assessment_readiness_requests
      where journey_id = (select id from public.certification_journeys where practitioner_id = target_practitioner_id)
        and assignment_id = active_assignment.id and status = 'approved') into assessment_readiness_approved;
    if desired_rank = 8 and assessment_readiness_approved then desired_state := 'assessment_available'; desired_rank := 9; end if;
  end if;

  insert into public.certification_journeys (trainee_user_id, practitioner_id, counted_sessions_count,
    level_1_training_record_id, level_2_training_record_id)
  values (target_trainee_user_id, target_practitioner_id, qualifying_count, level_1_record.id, level_2_record.id)
  on conflict (practitioner_id) do nothing;
  select * into journey from public.certification_journeys where practitioner_id = target_practitioner_id for update;
  previous_state := journey.state; previous_count := journey.counted_sessions_count;
  current_rank := public.certification_journey_state_rank(journey.state);
  update public.certification_journeys set counted_sessions_count = qualifying_count,
    level_1_training_record_id = level_1_record.id, level_2_training_record_id = level_2_record.id
  where id = journey.id returning * into journey;

  if qualifying_count < 25 or level_1_record.id is null or active_assignment.id is null then
    perform public.invalidate_level_2_readiness(journey.id, transition_actor_user_id);
  end if;
  if qualifying_count < 50 or level_2_record.id is null or active_assignment.id is null then
    perform public.invalidate_assessment_readiness(journey.id, transition_actor_user_id);
  end if;
  if current_rank <= 9 then
    if desired_rank < current_rank then
      update public.certification_journeys set state = desired_state, state_changed_at = now() where id = journey.id returning * into journey;
      insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state,
        resulting_state, previous_counted_sessions, resulting_counted_sessions, reason)
      values (journey.id, transition_actor_user_id, 'eligibility_recalculated', previous_state,
        desired_state, previous_count, qualifying_count, 'Source eligibility changed.');
    elsif desired_rank > current_rank then
      for next_rank in current_rank + 1..desired_rank loop
        insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state,
          resulting_state, previous_counted_sessions, resulting_counted_sessions, reason)
        values (journey.id, transition_actor_user_id, 'automatic_transition',
          public.certification_journey_state_at_rank(next_rank - 1), public.certification_journey_state_at_rank(next_rank),
          previous_count, qualifying_count, 'Rule-driven transition from verified source records.')
        on conflict (journey_id, resulting_state) where action = 'automatic_transition' do nothing;
      end loop;
      update public.certification_journeys set state = desired_state, state_changed_at = now() where id = journey.id returning * into journey;
    end if;
  end if;
  perform public.emit_25_session_milestone(journey);
  perform public.emit_50_session_milestone(journey);
  return journey;
end;
$$;

create or replace function public.set_assessor_designation(
  actor_user_id uuid, target_user_id uuid, target_active boolean, target_reason text
)
returns public.assessor_designations language plpgsql security definer set search_path = public
as $$
declare designation public.assessor_designations;
declare audit_action text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() or not public.user_has_role(actor_user_id, 'admin') then
    raise exception 'Only an authenticated Administrator may manage assessor designations' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(target_reason, ''))) < 10 then raise exception 'A designation reason is required' using errcode = '23514'; end if;
  if not public.user_has_role(target_user_id, 'instructor') then raise exception 'An Assessor must hold the Instructor role' using errcode = '23514'; end if;
  select * into designation from public.assessor_designations where user_id = target_user_id for update;
  if designation.id is null then
    if not target_active then raise exception 'The Instructor is not designated as an Assessor' using errcode = '23514'; end if;
    insert into public.assessor_designations (user_id, designated_by, designation_reason)
    values (target_user_id, actor_user_id, trim(target_reason)) returning * into designation;
    audit_action := 'designated';
  elsif designation.active = target_active then return designation;
  elsif target_active then
    update public.assessor_designations set active = true, designated_by = actor_user_id,
      designation_reason = trim(target_reason), designated_at = now(), revoked_by = null,
      revocation_reason = null, revoked_at = null where id = designation.id returning * into designation;
    audit_action := 'redesignated';
  else
    update public.assessor_designations set active = false, revoked_by = actor_user_id,
      revocation_reason = trim(target_reason), revoked_at = now() where id = designation.id returning * into designation;
    audit_action := 'revoked';
  end if;
  insert into public.assessor_designation_audit (designation_id, actor_user_id, action, reason)
  values (designation.id, actor_user_id, audit_action, trim(target_reason));
  return designation;
end;
$$;

create or replace function public.request_assessment_readiness(actor_user_id uuid, target_journey_id uuid)
returns public.assessment_readiness_requests language plpgsql security definer set search_path = public
as $$
declare journey public.certification_journeys;
declare active_assignment public.supervision_assignments;
declare request public.assessment_readiness_requests;
declare trainee_name text;
declare event_key text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'Assessment requests are limited to the authenticated user' using errcode = '42501'; end if;
  select * into journey from public.certification_journeys where id = target_journey_id for update;
  if journey.id is null or journey.trainee_user_id <> actor_user_id then raise exception 'The certification journey is not available' using errcode = '42501'; end if;
  journey := public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  select * into active_assignment from public.supervision_assignments where trainee_user_id = actor_user_id and status = 'active' limit 1;
  if journey.state <> 'sessions_50_reached' or journey.counted_sessions_count < 50
    or journey.level_1_training_record_id is null or journey.level_2_training_record_id is null or active_assignment.id is null then
    raise exception 'Assessment readiness requirements are not satisfied' using errcode = '23514';
  end if;
  select * into request from public.assessment_readiness_requests
  where journey_id = journey.id and status in ('pending', 'approved') order by requested_at desc limit 1;
  if request.id is not null then return request; end if;
  insert into public.assessment_readiness_requests (journey_id, trainee_user_id, assignment_id)
  values (journey.id, actor_user_id, active_assignment.id) returning * into request;
  insert into public.assessment_readiness_audit (request_id, actor_user_id, action, resulting_status)
  values (request.id, actor_user_id, 'requested', 'pending');
  select coalesce(nullif(official_full_name, ''), nullif(full_name, ''), email) into trainee_name from public.users where id = actor_user_id;
  event_key := 'assessment:' || request.id::text || ':readiness_requested';
  perform public.task_404_deliver(active_assignment.instructor_user_id, 'assessment.readiness_requested',
    'assessment_readiness_requested', event_key, 'Assessment readiness requested', 'Preparación para evaluación solicitada',
    trainee_name || ' requested an assessment-readiness review.', trainee_name || ' solicitó una revisión de preparación para la evaluación.',
    '/dashboard/certification?assessmentId=' || request.id::text,
    jsonb_build_object('assessmentId', request.id, 'journeyId', journey.id, 'traineeUserId', actor_user_id,
      'state', 'readiness_requested', 'assignmentId', active_assignment.id, 'transitionTimestamp', request.requested_at,
      'nextAction', 'review_assessment_readiness'), request.requested_at);
  return request;
end;
$$;

create or replace function public.decide_assessment_readiness(
  actor_user_id uuid, target_request_id uuid, approve_request boolean, target_reason text default null
)
returns public.assessment_readiness_requests language plpgsql security definer set search_path = public
as $$
declare request public.assessment_readiness_requests;
declare journey public.certification_journeys;
declare assessment public.assessments;
declare target_status public.assessment_readiness_status;
declare event_type public.transactional_email_event_type;
declare event_key text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'Assessment decisions are limited to the authenticated user' using errcode = '42501'; end if;
  if not approve_request and char_length(trim(coalesce(target_reason, ''))) < 10 then raise exception 'A rejection reason is required' using errcode = '23514'; end if;
  select * into request from public.assessment_readiness_requests where id = target_request_id for update;
  if request.id is null then raise exception 'The assessment readiness request was not found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.supervision_assignments where id = request.assignment_id and status = 'active'
    and instructor_user_id = actor_user_id and trainee_user_id = request.trainee_user_id) then
    raise exception 'Only the active assigned Instructor may decide this request' using errcode = '42501';
  end if;
  target_status := case when approve_request then 'approved' else 'rejected' end;
  if request.status = target_status and request.decided_by = actor_user_id then return request; end if;
  if request.status <> 'pending' then raise exception 'The assessment readiness request is no longer pending' using errcode = '23514'; end if;
  select * into journey from public.certification_journeys where id = request.journey_id for update;
  journey := public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  if journey.counted_sessions_count < 50 or journey.level_2_training_record_id is null or journey.state <> 'sessions_50_reached' then
    raise exception 'Assessment readiness requirements are no longer satisfied' using errcode = '23514';
  end if;
  update public.assessment_readiness_requests set status = target_status, decided_by = actor_user_id,
    decided_at = now(), decision_reason = nullif(trim(coalesce(target_reason, '')), '')
  where id = request.id returning * into request;
  insert into public.assessment_readiness_audit (request_id, actor_user_id, action, previous_status, resulting_status, reason)
  values (request.id, actor_user_id, target_status::text, 'pending', target_status, request.decision_reason);
  if approve_request then
    insert into public.assessments (journey_id, readiness_request_id, trainee_user_id)
    values (journey.id, request.id, request.trainee_user_id) returning * into assessment;
    insert into public.assessment_audit (assessment_id, actor_user_id, action, resulting_status)
    values (assessment.id, actor_user_id, 'created', 'awaiting_assessor');
    update public.certification_journeys set state = 'assessment_available', state_changed_at = now() where id = journey.id;
    insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state, resulting_state,
      previous_counted_sessions, resulting_counted_sessions, reason)
    values (journey.id, actor_user_id, 'automatic_transition', journey.state, 'assessment_available',
      journey.counted_sessions_count, journey.counted_sessions_count, 'Active Instructor approved assessment readiness.')
    on conflict (journey_id, resulting_state) where action = 'automatic_transition' do nothing;
  end if;
  event_type := case when approve_request then 'assessment.readiness_approved' else 'assessment.readiness_rejected' end;
  event_key := 'assessment:' || request.id::text || ':' || target_status::text;
  perform public.task_404_deliver(request.trainee_user_id, event_type, 'assessment_readiness_decided', event_key,
    case when approve_request then 'Assessment readiness approved' else 'Assessment readiness not approved' end,
    case when approve_request then 'Preparación para evaluación aprobada' else 'Preparación para evaluación no aprobada' end,
    'View the decision and next action in your certification journey.',
    'Consulta la decisión y el siguiente paso en tu recorrido de certificación.',
    '/dashboard/certification?assessmentId=' || coalesce(assessment.id, request.id)::text,
    jsonb_build_object('assessmentId', coalesce(assessment.id, request.id), 'journeyId', request.journey_id,
      'traineeUserId', request.trainee_user_id, 'state', target_status, 'assignmentId', request.assignment_id,
      'transitionTimestamp', request.decided_at,
      'nextAction', case when approve_request then 'await_assessor_assignment' else 'contact_instructor' end), request.decided_at);
  return request;
end;
$$;

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
  if assessment.id is null or assessment.status <> 'awaiting_assessor' then raise exception 'The assessment is not awaiting assignment' using errcode = '23514'; end if;
  select * into designation from public.assessor_designations where user_id = target_assessor_user_id and active;
  if designation.id is null or not public.user_has_role(target_assessor_user_id, 'instructor') then raise exception 'The selected Instructor is not an authorized Assessor' using errcode = '42501'; end if;
  select * into assignment from public.supervision_assignments where trainee_user_id = assessment.trainee_user_id and status = 'active' limit 1;
  if assignment.instructor_user_id = target_assessor_user_id then raise exception 'The active Instructor cannot assess their assigned Trainee' using errcode = '23514'; end if;
  update public.assessments set assessor_designation_id = designation.id, assessor_user_id = target_assessor_user_id
  where id = assessment.id returning * into assessment;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, previous_status, resulting_status)
  values (assessment.id, actor_user_id, 'assessor_assigned', 'awaiting_assessor', 'awaiting_assessor');
  event_key := 'assessment:' || assessment.id::text || ':assessor_assigned';
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

create or replace function public.schedule_assessment(
  actor_user_id uuid, target_assessment_id uuid, target_scheduled_at timestamptz
)
returns public.assessments language plpgsql security definer set search_path = public
as $$
declare assessment public.assessments;
declare recipient_id uuid;
declare event_key text;
declare previous_status public.assessment_status;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'Assessment scheduling is limited to the authenticated user' using errcode = '42501'; end if;
  select * into assessment from public.assessments where id = target_assessment_id for update;
  if assessment.assessor_user_id <> actor_user_id or not public.is_authorized_assessor(actor_user_id) then raise exception 'Only the assigned authorized Assessor may schedule this assessment' using errcode = '42501'; end if;
  if assessment.status not in ('awaiting_assessor', 'scheduled') then raise exception 'The assessment cannot be scheduled in its current state' using errcode = '23514'; end if;
  if target_scheduled_at < now() - interval '5 minutes' then raise exception 'The assessment date cannot be in the past' using errcode = '23514'; end if;
  previous_status := assessment.status;
  update public.assessments set scheduled_at = target_scheduled_at, status = 'scheduled' where id = assessment.id returning * into assessment;
  update public.certification_journeys set state = 'assessment_in_progress', state_changed_at = now() where id = assessment.journey_id;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, previous_status, resulting_status)
  values (assessment.id, actor_user_id, 'scheduled', previous_status, 'scheduled');
  event_key := 'assessment:' || assessment.id::text || ':scheduled:' || extract(epoch from target_scheduled_at)::bigint::text;
  foreach recipient_id in array array[assessment.trainee_user_id, assessment.assessor_user_id] loop
    perform public.task_404_deliver(recipient_id, 'assessment.scheduled', 'assessment_scheduled', event_key,
      'Assessment scheduled', 'Evaluación programada', 'The assessment date is available in the authorized portal record.',
      'La fecha de evaluación está disponible en el registro autorizado del portal.', '/dashboard/certification?assessmentId=' || assessment.id::text,
      jsonb_build_object('assessmentId', assessment.id, 'journeyId', assessment.journey_id,
        'traineeUserId', assessment.trainee_user_id, 'state', 'scheduled', 'assessorUserId', assessment.assessor_user_id,
        'transitionTimestamp', now(), 'scheduledAt', target_scheduled_at, 'nextAction', 'attend_assessment'));
  end loop;
  return assessment;
end;
$$;

create or replace function public.record_assessment_outcome(
  actor_user_id uuid, target_assessment_id uuid, target_status public.assessment_status,
  target_notes text default null, target_next_action text default null
)
returns public.assessments language plpgsql security definer set search_path = public
as $$
declare assessment public.assessments;
declare journey public.certification_journeys;
declare active_assignment public.supervision_assignments;
declare recipient_id uuid;
declare event_type public.transactional_email_event_type;
declare event_key text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'Assessment outcomes are limited to the authenticated user' using errcode = '42501'; end if;
  if target_status not in ('incomplete', 'revision_required', 'failed', 'passed') then raise exception 'A supported assessment outcome is required' using errcode = '23514'; end if;
  if target_status <> 'passed' and char_length(trim(coalesce(target_next_action, ''))) < 10 then raise exception 'An explicit next action is required' using errcode = '23514'; end if;
  select * into assessment from public.assessments where id = target_assessment_id for update;
  if assessment.assessor_user_id <> actor_user_id or not public.is_authorized_assessor(actor_user_id) then raise exception 'Only the assigned authorized Assessor may record the outcome' using errcode = '42501'; end if;
  if assessment.status = target_status and assessment.assessed_at is not null then return assessment; end if;
  if assessment.status <> 'scheduled' then raise exception 'Only a scheduled assessment can receive an outcome' using errcode = '23514'; end if;
  if assessment.scheduled_at > now() then raise exception 'The scheduled assessment has not occurred yet' using errcode = '23514'; end if;
  select * into journey from public.certification_journeys where id = assessment.journey_id for update;
  journey := public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  if journey.counted_sessions_count < 50 or journey.level_2_training_record_id is null
    or not exists (select 1 from public.supervision_assignments where trainee_user_id = assessment.trainee_user_id and status = 'active') then
    raise exception 'Assessment eligibility is no longer satisfied' using errcode = '23514';
  end if;
  update public.assessments set status = target_status, assessed_at = now(),
    notes = nullif(trim(coalesce(target_notes, '')), ''),
    next_action = case when target_status = 'passed' then null else trim(target_next_action) end
  where id = assessment.id returning * into assessment;
  update public.certification_journeys set state = case when target_status = 'passed'
      then 'assessment_passed'::public.certification_journey_state
      else 'revision_required'::public.certification_journey_state end,
    state_changed_at = now() where id = journey.id;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, previous_status, resulting_status)
  values (assessment.id, actor_user_id, target_status::text, 'scheduled', target_status);
  if target_status = 'incomplete' then return assessment; end if;
  event_type := case target_status when 'passed' then 'assessment.passed'
    when 'failed' then 'assessment.failed' else 'assessment.revision_required' end;
  event_key := 'assessment:' || assessment.id::text || ':' || target_status::text;
  select * into active_assignment from public.supervision_assignments where trainee_user_id = assessment.trainee_user_id and status = 'active' limit 1;
  for recipient_id in
    select assessment.trainee_user_id union select active_assignment.instructor_user_id
    union select user_roles.user_id from public.user_roles join public.roles on roles.id = user_roles.role_id where roles.name = 'admin'
  loop
    perform public.task_404_deliver(recipient_id, event_type, 'assessment_outcome_recorded', event_key,
      case when target_status = 'passed' then 'Assessment passed' when target_status = 'failed' then 'Assessment not passed' else 'Assessment revision required' end,
      case when target_status = 'passed' then 'Evaluación aprobada' when target_status = 'failed' then 'Evaluación no aprobada' else 'Revisión de evaluación requerida' end,
      'View the outcome and next action in the authorized portal record.',
      'Consulta el resultado y el siguiente paso en el registro autorizado del portal.',
      '/dashboard/certification?assessmentId=' || assessment.id::text,
      jsonb_build_object('assessmentId', assessment.id, 'journeyId', assessment.journey_id,
        'traineeUserId', assessment.trainee_user_id, 'state', target_status,
        'assessorUserId', assessment.assessor_user_id, 'transitionTimestamp', assessment.assessed_at,
        'nextAction', case when target_status = 'passed' then 'await_certification_approval' else 'complete_remediation' end), assessment.assessed_at);
  end loop;
  return assessment;
end;
$$;

create or replace function public.verify_assessment_remediation(actor_user_id uuid, target_assessment_id uuid)
returns public.assessments language plpgsql security definer set search_path = public
as $$
declare assessment public.assessments;
declare next_assessment public.assessments;
declare recipient_id uuid;
declare event_key text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'Remediation verification is limited to the authenticated user' using errcode = '42501'; end if;
  select * into assessment from public.assessments where id = target_assessment_id for update;
  if assessment.status not in ('incomplete', 'revision_required', 'failed') or assessment.remediation_verified_at is not null then raise exception 'This assessment is not awaiting remediation verification' using errcode = '23514'; end if;
  if not public.is_active_instructor_for(actor_user_id, assessment.trainee_user_id) then raise exception 'Only the active assigned Instructor may verify remediation' using errcode = '42501'; end if;
  update public.assessments set remediation_verified_by = actor_user_id, remediation_verified_at = now()
  where id = assessment.id returning * into assessment;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, previous_status, resulting_status)
  values (assessment.id, actor_user_id, 'remediation_verified', assessment.status, assessment.status);
  insert into public.assessments (journey_id, readiness_request_id, trainee_user_id, revision_number, previous_assessment_id)
  values (assessment.journey_id, assessment.readiness_request_id, assessment.trainee_user_id,
    assessment.revision_number + 1, assessment.id) returning * into next_assessment;
  insert into public.assessment_audit (assessment_id, actor_user_id, action, resulting_status)
  values (next_assessment.id, actor_user_id, 'created', 'awaiting_assessor');
  update public.certification_journeys set state = 'assessment_available', state_changed_at = now() where id = assessment.journey_id;
  event_key := 'assessment:' || assessment.id::text || ':remediation_verified';
  foreach recipient_id in array array[assessment.trainee_user_id, assessment.assessor_user_id] loop
    perform public.task_404_deliver(recipient_id, 'assessment.remediation_verified', 'assessment_remediation_verified', event_key,
      'Assessment remediation verified', 'Remediación de evaluación verificada',
      'A new reassessment is ready for Assessor assignment.', 'Una nueva reevaluación está lista para asignar una persona evaluadora.',
      '/dashboard/certification?assessmentId=' || next_assessment.id::text,
      jsonb_build_object('assessmentId', next_assessment.id, 'journeyId', assessment.journey_id,
        'traineeUserId', assessment.trainee_user_id, 'state', 'remediation_verified',
        'assessorUserId', assessment.assessor_user_id, 'transitionTimestamp', assessment.remediation_verified_at,
        'nextAction', 'assign_reassessment_assessor'), assessment.remediation_verified_at);
  end loop;
  return next_assessment;
end;
$$;

create or replace function public.list_assessor_candidates(actor_user_id uuid)
returns table (user_id uuid, display_name text, active boolean)
language plpgsql security definer stable set search_path = public
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() or not public.user_has_role(actor_user_id, 'admin') then raise exception 'Administrator access is required' using errcode = '42501'; end if;
  return query select users.id, coalesce(nullif(users.official_full_name, ''), nullif(users.full_name, ''), users.email),
    coalesce(designations.active, false)
  from public.users join public.user_roles on user_roles.user_id = users.id
  join public.roles on roles.id = user_roles.role_id and roles.name = 'instructor'
  left join public.assessor_designations designations on designations.user_id = users.id
  order by 2, users.id;
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
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'Assessment access is limited to the authenticated user' using errcode = '42501'; end if;
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
      and assessment.status = 'awaiting_assessor' and assessment.assessor_user_id is null,
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

revoke all on function public.is_authorized_assessor(uuid) from public, anon, authenticated;
revoke all on function public.task_404_deliver(uuid, public.transactional_email_event_type, public.notification_type, text, text, text, text, text, text, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.emit_50_session_milestone(public.certification_journeys) from public, anon, authenticated;
revoke all on function public.invalidate_assessment_readiness(uuid, uuid) from public, anon, authenticated;
revoke all on function public.set_assessor_designation(uuid, uuid, boolean, text) from public, anon;
revoke all on function public.request_assessment_readiness(uuid, uuid) from public, anon;
revoke all on function public.decide_assessment_readiness(uuid, uuid, boolean, text) from public, anon;
revoke all on function public.assign_assessment_assessor(uuid, uuid, uuid) from public, anon;
revoke all on function public.schedule_assessment(uuid, uuid, timestamptz) from public, anon;
revoke all on function public.record_assessment_outcome(uuid, uuid, public.assessment_status, text, text) from public, anon;
revoke all on function public.verify_assessment_remediation(uuid, uuid) from public, anon;
revoke all on function public.list_assessor_candidates(uuid) from public, anon;
revoke all on function public.list_assessment_queue(uuid) from public, anon;
grant execute on function public.set_assessor_designation(uuid, uuid, boolean, text) to authenticated;
grant execute on function public.request_assessment_readiness(uuid, uuid) to authenticated;
grant execute on function public.decide_assessment_readiness(uuid, uuid, boolean, text) to authenticated;
grant execute on function public.assign_assessment_assessor(uuid, uuid, uuid) to authenticated;
grant execute on function public.schedule_assessment(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.record_assessment_outcome(uuid, uuid, public.assessment_status, text, text) to authenticated;
grant execute on function public.verify_assessment_remediation(uuid, uuid) to authenticated;
grant execute on function public.list_assessor_candidates(uuid) to authenticated;
grant execute on function public.list_assessment_queue(uuid) to authenticated;

-- Recalculate representative existing data and emit one immutable first attainment.
do $$
declare practitioner_record record;
begin
  for practitioner_record in select id from public.practitioners loop
    perform public.recalculate_certification_journey(practitioner_record.id, null);
  end loop;
end;
$$;
