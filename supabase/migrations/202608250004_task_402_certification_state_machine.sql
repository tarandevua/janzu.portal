-- TASK-402: replace the legacy count/approval flags with an auditable,
-- relationship-scoped certification journey. Later workflow tasks extend the
-- states beyond the 25/50-session readiness boundaries established here.

create type public.certification_journey_state as enum (
  'level_1_in_progress',
  'level_1_completed',
  'practicum_in_progress',
  'sessions_25_reached',
  'level_2_review_eligible',
  'level_2_completed',
  'advanced_practicum_in_progress',
  'sessions_50_reached',
  'assessment_available',
  'assessment_in_progress',
  'revision_required',
  'assessment_passed',
  'certification_approved',
  'facilitator_activated'
);

create table public.certification_journeys (
  id uuid primary key default gen_random_uuid(),
  trainee_user_id uuid not null unique references public.users(id) on delete restrict,
  practitioner_id uuid not null unique references public.practitioners(id) on delete restrict,
  state public.certification_journey_state not null default 'level_1_in_progress',
  counted_sessions_count integer not null default 0,
  level_1_training_record_id uuid references public.training_history(id) on delete restrict,
  level_2_training_record_id uuid references public.training_history(id) on delete restrict,
  state_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certification_journey_count_nonnegative check (counted_sessions_count >= 0)
);

create index certification_journeys_state_idx
on public.certification_journeys(state, updated_at desc);

create trigger certification_journeys_set_updated_at
before update on public.certification_journeys
for each row execute function public.set_updated_at();

create table public.certification_journey_audit (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.certification_journeys(id) on delete restrict,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null check (action in ('automatic_transition', 'eligibility_recalculated', 'manual_override', 'legacy_migration')),
  previous_state public.certification_journey_state,
  resulting_state public.certification_journey_state not null,
  previous_counted_sessions integer,
  resulting_counted_sessions integer not null,
  reason text,
  evidence_reference text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint certification_audit_reason_length check (char_length(coalesce(reason, '')) <= 1000),
  constraint certification_audit_evidence_length check (char_length(coalesce(evidence_reference, '')) <= 1000)
);

create index certification_journey_audit_journey_idx
on public.certification_journey_audit(journey_id, occurred_at, id);

create unique index certification_journey_automatic_state_once_idx
on public.certification_journey_audit(journey_id, resulting_state)
where action = 'automatic_transition';

create or replace function public.certification_journey_state_rank(
  target_state public.certification_journey_state
)
returns integer
language sql
immutable
strict
set search_path = public
as $$
  select case target_state
    when 'level_1_in_progress' then 1
    when 'level_1_completed' then 2
    when 'practicum_in_progress' then 3
    when 'sessions_25_reached' then 4
    when 'level_2_review_eligible' then 5
    when 'level_2_completed' then 6
    when 'advanced_practicum_in_progress' then 7
    when 'sessions_50_reached' then 8
    when 'assessment_available' then 9
    when 'assessment_in_progress' then 10
    when 'revision_required' then 11
    when 'assessment_passed' then 12
    when 'certification_approved' then 13
    when 'facilitator_activated' then 14
  end;
$$;

create or replace function public.certification_journey_state_at_rank(target_rank integer)
returns public.certification_journey_state
language sql
immutable
strict
set search_path = public
as $$
  select case target_rank
    when 1 then 'level_1_in_progress'::public.certification_journey_state
    when 2 then 'level_1_completed'::public.certification_journey_state
    when 3 then 'practicum_in_progress'::public.certification_journey_state
    when 4 then 'sessions_25_reached'::public.certification_journey_state
    when 5 then 'level_2_review_eligible'::public.certification_journey_state
    when 6 then 'level_2_completed'::public.certification_journey_state
    when 7 then 'advanced_practicum_in_progress'::public.certification_journey_state
    when 8 then 'sessions_50_reached'::public.certification_journey_state
    when 9 then 'assessment_available'::public.certification_journey_state
    when 10 then 'assessment_in_progress'::public.certification_journey_state
    when 11 then 'revision_required'::public.certification_journey_state
    when 12 then 'assessment_passed'::public.certification_journey_state
    when 13 then 'certification_approved'::public.certification_journey_state
    when 14 then 'facilitator_activated'::public.certification_journey_state
  end;
$$;

create or replace function public.recalculate_certification_journey(
  target_practitioner_id uuid,
  transition_actor_user_id uuid default null
)
returns public.certification_journeys
language plpgsql
security definer
set search_path = public
as $$
declare
  target_trainee_user_id uuid;
  level_1_record public.training_history;
  level_2_record public.training_history;
  journey public.certification_journeys;
  desired_state public.certification_journey_state := 'level_1_in_progress';
  desired_rank integer := 1;
  current_rank integer;
  next_rank integer;
  qualifying_count integer := 0;
  has_active_instructor boolean := false;
  previous_state public.certification_journey_state;
  previous_count integer;
begin
  select user_id into target_trainee_user_id
  from public.practitioners
  where id = target_practitioner_id;

  if target_trainee_user_id is null then
    raise exception 'Certification journey target was not found' using errcode = 'P0002';
  end if;

  select * into level_1_record
  from public.training_history
  where trainee_user_id = target_trainee_user_id
    and level = 'level_1'
    and status = 'verified'
    and coursework_complete = true
  order by completed_on, verified_at, id
  limit 1;

  if level_1_record.id is not null then
    select count(*)::integer into qualifying_count
    from public.sessions
    where practitioner_id = target_practitioner_id
      and is_validated = true
      and client_id is not null
      and duration_minutes >= 60
      and session_date > level_1_record.completed_on;

    select exists (
      select 1 from public.supervision_assignments
      where trainee_user_id = target_trainee_user_id
        and status = 'active'
    ) into has_active_instructor;

    desired_state := 'practicum_in_progress';
    desired_rank := 3;

    if qualifying_count >= 25 then
      desired_state := 'sessions_25_reached';
      desired_rank := 4;
    end if;

    if qualifying_count >= 25 and has_active_instructor then
      desired_state := 'level_2_review_eligible';
      desired_rank := 5;
    end if;

    select * into level_2_record
    from public.training_history
    where trainee_user_id = target_trainee_user_id
      and level = 'level_2'
      and status = 'verified'
      and coursework_complete = true
      and completed_on >= level_1_record.completed_on
    order by completed_on, verified_at, id
    limit 1;

    if level_2_record.id is not null and qualifying_count >= 25 and has_active_instructor then
      desired_state := 'advanced_practicum_in_progress';
      desired_rank := 7;
    end if;

    if level_2_record.id is not null and qualifying_count >= 50 and has_active_instructor then
      desired_state := 'sessions_50_reached';
      desired_rank := 8;
    end if;
  end if;

  insert into public.certification_journeys (
    trainee_user_id,
    practitioner_id,
    counted_sessions_count,
    level_1_training_record_id,
    level_2_training_record_id
  ) values (
    target_trainee_user_id,
    target_practitioner_id,
    qualifying_count,
    level_1_record.id,
    level_2_record.id
  )
  on conflict (practitioner_id) do nothing;

  select * into journey
  from public.certification_journeys
  where practitioner_id = target_practitioner_id
  for update;

  previous_state := journey.state;
  previous_count := journey.counted_sessions_count;
  current_rank := public.certification_journey_state_rank(journey.state);

  update public.certification_journeys
  set counted_sessions_count = qualifying_count,
      level_1_training_record_id = level_1_record.id,
      level_2_training_record_id = level_2_record.id
  where id = journey.id;

  -- Later workflow states are controlled by TASK-403/404/405. Recalculation in
  -- this slice never fabricates or rewinds assessment/certification decisions.
  if current_rank <= 8 then
    if desired_rank < current_rank then
      update public.certification_journeys
      set state = desired_state,
          state_changed_at = now()
      where id = journey.id;

      insert into public.certification_journey_audit (
        journey_id, actor_user_id, action, previous_state, resulting_state,
        previous_counted_sessions, resulting_counted_sessions, reason
      ) values (
        journey.id, transition_actor_user_id, 'eligibility_recalculated',
        previous_state, desired_state, previous_count, qualifying_count,
        'Source training, assignment, or counted-session eligibility changed.'
      );
    elsif desired_rank > current_rank then
      for next_rank in current_rank + 1..desired_rank loop
        insert into public.certification_journey_audit (
          journey_id, actor_user_id, action, previous_state, resulting_state,
          previous_counted_sessions, resulting_counted_sessions, reason
        ) values (
          journey.id,
          transition_actor_user_id,
          'automatic_transition',
          public.certification_journey_state_at_rank(next_rank - 1),
          public.certification_journey_state_at_rank(next_rank),
          previous_count,
          qualifying_count,
          'Rule-driven transition from verified source records.'
        )
        on conflict (journey_id, resulting_state)
          where action = 'automatic_transition'
          do nothing;
      end loop;

      update public.certification_journeys
      set state = desired_state,
          state_changed_at = now()
      where id = journey.id;
    end if;
  end if;

  select * into journey
  from public.certification_journeys
  where id = journey.id;

  return journey;
end;
$$;

create or replace function public.sync_certification_journey(
  actor_user_id uuid,
  target_trainee_user_id uuid
)
returns public.certification_journeys
language plpgsql
security definer
set search_path = public
as $$
declare
  target_practitioner_id uuid;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Certification access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not (
    actor_user_id = target_trainee_user_id
    or public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, target_trainee_user_id)
  ) then
    raise exception 'Certification journey access is not authorized'
      using errcode = '42501';
  end if;

  select id into target_practitioner_id
  from public.practitioners
  where user_id = target_trainee_user_id;

  if target_practitioner_id is null then
    raise exception 'Practitioner profile is required before tracking certification'
      using errcode = 'P0002';
  end if;

  return public.recalculate_certification_journey(target_practitioner_id, actor_user_id);
end;
$$;

create or replace function public.list_certification_journeys(actor_user_id uuid)
returns table (
  id uuid,
  trainee_user_id uuid,
  practitioner_id uuid,
  trainee_name text,
  state public.certification_journey_state,
  counted_sessions_count integer,
  level_1_training_record_id uuid,
  level_2_training_record_id uuid,
  state_changed_at timestamptz,
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
    raise exception 'Certification access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not (
    public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'instructor')
  ) then
    raise exception 'Certification review access is required' using errcode = '42501';
  end if;

  return query
  select
    journeys.id,
    journeys.trainee_user_id,
    journeys.practitioner_id,
    coalesce(nullif(users.official_full_name, ''), nullif(users.full_name, ''), users.email),
    journeys.state,
    journeys.counted_sessions_count,
    journeys.level_1_training_record_id,
    journeys.level_2_training_record_id,
    journeys.state_changed_at,
    journeys.created_at,
    journeys.updated_at
  from public.certification_journeys journeys
  join public.users on users.id = journeys.trainee_user_id
  where public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, journeys.trainee_user_id)
  order by journeys.updated_at desc, journeys.id;
end;
$$;

create or replace function public.override_certification_journey_state(
  actor_user_id uuid,
  target_journey_id uuid,
  expected_state public.certification_journey_state,
  resulting_state public.certification_journey_state,
  override_reason text,
  supporting_evidence_reference text
)
returns public.certification_journeys
language plpgsql
security definer
set search_path = public
as $$
declare
  journey public.certification_journeys;
  previous_rank integer;
  resulting_rank integer;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Certification overrides are limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not public.user_has_role(actor_user_id, 'admin') then
    raise exception 'Only Administrators may override certification state'
      using errcode = '42501';
  end if;

  if nullif(trim(coalesce(override_reason, '')), '') is null then
    raise exception 'An override reason is required' using errcode = '23514';
  end if;

  if nullif(trim(coalesce(supporting_evidence_reference, '')), '') is null then
    raise exception 'A supporting evidence reference is required' using errcode = '23514';
  end if;

  select * into journey
  from public.certification_journeys
  where id = target_journey_id
  for update;

  if journey.id is null then
    raise exception 'Certification journey was not found' using errcode = 'P0002';
  end if;

  -- Retrying an already committed request is safe and creates no duplicate audit.
  if journey.state = resulting_state then
    return journey;
  end if;

  if journey.state <> expected_state then
    raise exception 'Certification state changed; refresh before retrying'
      using errcode = '40001';
  end if;

  previous_rank := public.certification_journey_state_rank(journey.state);
  resulting_rank := public.certification_journey_state_rank(resulting_state);

  if abs(resulting_rank - previous_rank) <> 1 then
    raise exception 'Certification overrides cannot skip required states'
      using errcode = '23514';
  end if;

  if resulting_state in ('assessment_passed', 'certification_approved', 'facilitator_activated') then
    raise exception 'An override cannot fabricate assessment, certification, or activation approval'
      using errcode = '42501';
  end if;

  update public.certification_journeys
  set state = resulting_state,
      state_changed_at = now()
  where id = journey.id
  returning * into journey;

  insert into public.certification_journey_audit (
    journey_id, actor_user_id, action, previous_state, resulting_state,
    previous_counted_sessions, resulting_counted_sessions, reason, evidence_reference
  ) values (
    journey.id, actor_user_id, 'manual_override', expected_state, resulting_state,
    journey.counted_sessions_count, journey.counted_sessions_count,
    trim(override_reason), trim(supporting_evidence_reference)
  );

  return journey;
end;
$$;

create or replace function public.sync_certification_journey_from_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_practitioner_id uuid;
begin
  changed_practitioner_id := case
    when tg_op = 'DELETE' then old.practitioner_id
    else new.practitioner_id
  end;
  perform public.recalculate_certification_journey(changed_practitioner_id, auth.uid());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists sessions_sync_certification_progress on public.sessions;
create trigger sessions_sync_certification_journey
after insert or update of practitioner_id, session_date, duration_minutes, client_id, is_validated or delete
on public.sessions
for each row execute function public.sync_certification_journey_from_session();

create or replace function public.sync_certification_journey_from_training()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_trainee_user_id uuid;
  changed_practitioner_id uuid;
begin
  changed_trainee_user_id := case
    when tg_op = 'DELETE' then old.trainee_user_id
    else new.trainee_user_id
  end;
  select id into changed_practitioner_id
  from public.practitioners
  where user_id = changed_trainee_user_id;

  if changed_practitioner_id is not null then
    perform public.recalculate_certification_journey(changed_practitioner_id, auth.uid());
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger training_history_sync_certification_journey
after insert or update of status, coursework_complete, completed_on or delete
on public.training_history
for each row execute function public.sync_certification_journey_from_training();

create or replace function public.sync_certification_journey_from_supervision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_trainee_user_id uuid;
  changed_practitioner_id uuid;
begin
  changed_trainee_user_id := case
    when tg_op = 'DELETE' then old.trainee_user_id
    else new.trainee_user_id
  end;
  select id into changed_practitioner_id
  from public.practitioners
  where user_id = changed_trainee_user_id;

  if changed_practitioner_id is not null then
    perform public.recalculate_certification_journey(changed_practitioner_id, auth.uid());
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger supervision_sync_certification_journey
after insert or update of status, instructor_user_id or delete
on public.supervision_assignments
for each row execute function public.sync_certification_journey_from_supervision();

alter table public.certification_journeys enable row level security;
alter table public.certification_journey_audit enable row level security;

create policy "Authorized participants can read certification journeys"
on public.certification_journeys
for select to authenticated
using (
  trainee_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or public.is_active_instructor_for(auth.uid(), trainee_user_id)
);

create policy "Authorized participants can read certification journey audit"
on public.certification_journey_audit
for select to authenticated
using (
  exists (
    select 1 from public.certification_journeys
    where certification_journeys.id = certification_journey_audit.journey_id
      and (
        certification_journeys.trainee_user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
        or public.is_active_instructor_for(auth.uid(), certification_journeys.trainee_user_id)
      )
  )
);

-- Retire the legacy security-definer mutation boundary. Existing rows remain
-- intact for compatibility until TASK-405 migrates certificate/role projection.
revoke all on function public.sync_certification_progress(uuid) from public, anon, authenticated;
revoke all on function public.approve_certification(uuid, uuid) from public, anon, authenticated;
revoke all on function public.list_certification_approval_candidates(uuid) from public, anon, authenticated;

drop policy if exists "Practitioners and reviewers can read certification progress"
on public.certification_progress;
create policy "Authorized participants can read legacy certification progress"
on public.certification_progress
for select to authenticated
using (
  exists (
    select 1 from public.practitioners
    where practitioners.id = certification_progress.practitioner_id
      and (
        practitioners.user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
        or public.is_active_instructor_for(auth.uid(), practitioners.user_id)
      )
  )
);

drop policy if exists "Admins and managers can update certification progress"
on public.certification_progress;

revoke all on function public.recalculate_certification_journey(uuid, uuid) from public, anon, authenticated;
revoke all on function public.certification_journey_state_rank(public.certification_journey_state) from public, anon, authenticated;
revoke all on function public.certification_journey_state_at_rank(integer) from public, anon, authenticated;
revoke all on function public.sync_certification_journey(uuid, uuid) from public, anon;
revoke all on function public.list_certification_journeys(uuid) from public, anon;
revoke all on function public.override_certification_journey_state(uuid, uuid, public.certification_journey_state, public.certification_journey_state, text, text) from public, anon;

grant execute on function public.sync_certification_journey(uuid, uuid) to authenticated;
grant execute on function public.list_certification_journeys(uuid) to authenticated;
grant execute on function public.override_certification_journey_state(uuid, uuid, public.certification_journey_state, public.certification_journey_state, text, text) to authenticated;

do $$
declare
  practitioner_record record;
  journey public.certification_journeys;
  legacy_progress public.certification_progress;
begin
  for practitioner_record in select id from public.practitioners loop
    journey := public.recalculate_certification_journey(practitioner_record.id, null);

    select * into legacy_progress
    from public.certification_progress
    where practitioner_id = practitioner_record.id;

    insert into public.certification_journey_audit (
      journey_id,
      action,
      resulting_state,
      resulting_counted_sessions,
      reason,
      metadata
    ) values (
      journey.id,
      'legacy_migration',
      journey.state,
      journey.counted_sessions_count,
      'Legacy certification progress was preserved and re-derived under DEC-02 rules.',
      jsonb_build_object(
        'legacy_status', legacy_progress.status,
        'legacy_validated_sessions_count', legacy_progress.validated_sessions_count,
        'legacy_approved_by', legacy_progress.approved_by,
        'legacy_approved_at', legacy_progress.approved_at
      )
    );
  end loop;
end;
$$;
