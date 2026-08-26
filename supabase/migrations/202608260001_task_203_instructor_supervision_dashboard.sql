-- TASK-203: relationship-scoped Instructor supervision dashboard.
-- The projection intentionally excludes Session Participant identity, contact
-- details, session notes, and feedback free text.

create or replace function public.list_instructor_supervision_dashboard(actor_user_id uuid)
returns table (
  assignment_id uuid,
  trainee_user_id uuid,
  trainee_name text,
  practitioner_id uuid,
  current_level public.training_level,
  verified_training_count integer,
  latest_verified_training_id uuid,
  journey_id uuid,
  journey_state public.certification_journey_state,
  counted_sessions_count integer,
  next_session_milestone integer,
  recent_feedback_id uuid,
  recent_feedback_session_date date,
  recent_feedback_rating integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Supervision dashboard access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not public.user_has_role(actor_user_id, 'instructor') then
    raise exception 'Instructor access is required' using errcode = '42501';
  end if;

  return query
  select
    assignments.id,
    assignments.trainee_user_id,
    coalesce(nullif(trainees.full_name, ''), 'Janzu Trainee'),
    practitioners.id,
    public.current_verified_training_level(assignments.trainee_user_id),
    coalesce(training_summary.verified_count, 0),
    training_summary.latest_record_id,
    journeys.id,
    journeys.state,
    coalesce(journeys.counted_sessions_count, 0),
    case
      when journeys.state in (
        'level_2_completed',
        'advanced_practicum_in_progress',
        'sessions_50_reached',
        'assessment_available',
        'assessment_in_progress',
        'revision_required',
        'assessment_passed',
        'certification_approved',
        'facilitator_activated'
      ) then 50
      else 25
    end,
    recent_feedback.feedback_id,
    recent_feedback.session_date,
    recent_feedback.rating
  from public.supervision_assignments assignments
  join public.users trainees on trainees.id = assignments.trainee_user_id
  left join lateral (
    select practitioners.id
    from public.practitioners
    where practitioners.user_id = assignments.trainee_user_id
    order by practitioners.created_at desc
    limit 1
  ) practitioners on true
  left join lateral (
    select
      count(*)::integer as verified_count,
      (array_agg(training_history.id order by training_history.completed_on desc, training_history.created_at desc))[1]
        as latest_record_id
    from public.training_history
    where training_history.trainee_user_id = assignments.trainee_user_id
      and training_history.status = 'verified'
  ) training_summary on true
  left join public.certification_journeys journeys
    on journeys.trainee_user_id = assignments.trainee_user_id
  left join lateral (
    select
      session_feedback.id as feedback_id,
      sessions.session_date,
      session_feedback.rating
    from public.sessions
    join public.session_feedback on session_feedback.session_id = sessions.id
    where sessions.practitioner_id = practitioners.id
      and session_feedback.submitted_at is not null
    order by session_feedback.submitted_at desc
    limit 1
  ) recent_feedback on true
  where assignments.instructor_user_id = actor_user_id
    and assignments.status = 'active'
  order by coalesce(nullif(trainees.full_name, ''), 'Janzu Trainee');
end;
$$;

revoke all on function public.list_instructor_supervision_dashboard(uuid) from public, anon;
grant execute on function public.list_instructor_supervision_dashboard(uuid) to authenticated;

