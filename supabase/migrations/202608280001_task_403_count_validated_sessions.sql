-- TASK-403 correction: use the canonical validation projection for milestone counts.

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
      and duration_minutes >= 40
      and session_date > level_1_record.completed_on;

    select * into active_assignment
    from public.supervision_assignments
    where trainee_user_id = target_trainee_user_id
      and status = 'active'
    limit 1;

    desired_state := 'practicum_in_progress';
    desired_rank := 3;

    if qualifying_count >= 25 then
      desired_state := 'sessions_25_reached';
      desired_rank := 4;
    end if;

    if qualifying_count >= 25 and active_assignment.id is not null then
      desired_state := 'level_2_review_eligible';
      desired_rank := 5;
    end if;

    select exists (
      select 1
      from public.level_2_readiness_requests
      where journey_id = (
        select id from public.certification_journeys
        where practitioner_id = target_practitioner_id
      )
        and assignment_id = active_assignment.id
        and status = 'approved'
    ) into readiness_approved;

    select * into level_2_record
    from public.training_history
    where trainee_user_id = target_trainee_user_id
      and level = 'level_2'
      and status = 'verified'
      and coursework_complete = true
      and completed_on >= level_1_record.completed_on
    order by completed_on, verified_at, id
    limit 1;

    if level_2_record.id is not null
      and qualifying_count >= 25
      and active_assignment.id is not null
      and readiness_approved then
      desired_state := 'advanced_practicum_in_progress';
      desired_rank := 7;
    end if;

    if level_2_record.id is not null
      and qualifying_count >= 50
      and active_assignment.id is not null
      and readiness_approved then
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
  ) on conflict (practitioner_id) do nothing;

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
  where id = journey.id
  returning * into journey;

  if qualifying_count < 25
    or level_1_record.id is null
    or active_assignment.id is null then
    perform public.invalidate_level_2_readiness(journey.id, transition_actor_user_id);
  end if;

  if current_rank <= 8 then
    if desired_rank < current_rank then
      update public.certification_journeys
      set state = desired_state,
          state_changed_at = now()
      where id = journey.id
      returning * into journey;

      insert into public.certification_journey_audit (
        journey_id, actor_user_id, action, previous_state, resulting_state,
        previous_counted_sessions, resulting_counted_sessions, reason
      ) values (
        journey.id, transition_actor_user_id, 'eligibility_recalculated',
        previous_state, desired_state, previous_count, qualifying_count,
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
          public.certification_journey_state_at_rank(next_rank),
          previous_count, qualifying_count,
          'Rule-driven transition from verified source records.'
        ) on conflict (journey_id, resulting_state)
          where action = 'automatic_transition'
          do nothing;
      end loop;

      update public.certification_journeys
      set state = desired_state,
          state_changed_at = now()
      where id = journey.id
      returning * into journey;
    end if;
  end if;

  perform public.emit_25_session_milestone(journey);
  return journey;
end;
$$;

-- Correct existing projections immediately; later source changes remain trigger-driven.
do $$
declare practitioner_record record;
begin
  for practitioner_record in select id from public.practitioners loop
    perform public.recalculate_certification_journey(practitioner_record.id, null);
  end loop;
end;
$$;
