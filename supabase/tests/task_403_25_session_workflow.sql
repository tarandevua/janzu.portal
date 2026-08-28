\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('14030000-0000-4000-8000-000000000001', 'task-403-trainee@example.test', '{"full_name":"Trainee 403"}'::jsonb),
  ('14030000-0000-4000-8000-000000000002', 'task-403-instructor@example.test', '{"full_name":"Instructor 403"}'::jsonb),
  ('14030000-0000-4000-8000-000000000003', 'task-403-unrelated@example.test', '{"full_name":"Unrelated 403"}'::jsonb),
  ('14030000-0000-4000-8000-000000000004', 'task-403-admin@example.test', '{"full_name":"Administrator 403"}'::jsonb);

insert into public.users (id, email, full_name, official_full_name, preferred_locale)
values
  ('14030000-0000-4000-8000-000000000001', 'task-403-trainee@example.test', 'Trainee 403', 'Trainee 403', 'es'),
  ('14030000-0000-4000-8000-000000000002', 'task-403-instructor@example.test', 'Instructor 403', 'Instructor 403', 'en'),
  ('14030000-0000-4000-8000-000000000003', 'task-403-unrelated@example.test', 'Unrelated 403', 'Unrelated 403', 'en'),
  ('14030000-0000-4000-8000-000000000004', 'task-403-admin@example.test', 'Administrator 403', 'Administrator 403', 'en')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name,
  official_full_name = excluded.official_full_name, preferred_locale = excluded.preferred_locale;

insert into public.user_roles (user_id, role_id)
select '14030000-0000-4000-8000-000000000001', id from public.roles where name = 'apprentice'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '14030000-0000-4000-8000-000000000002', id from public.roles where name = 'instructor'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '14030000-0000-4000-8000-000000000004', id from public.roles where name = 'admin'
on conflict do nothing;

select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000004', true);

insert into public.practitioners (id, user_id)
values ('24030000-0000-4000-8000-000000000001', '14030000-0000-4000-8000-000000000001');

insert into public.clients (id, practitioner_id, name)
values ('34030000-0000-4000-8000-000000000001', '24030000-0000-4000-8000-000000000001', 'Private Participant 403');

insert into public.supervision_assignments (
  id, trainee_user_id, instructor_user_id, status, requested_by, responded_by, responded_at
) values (
  '44030000-0000-4000-8000-000000000001',
  '14030000-0000-4000-8000-000000000001',
  '14030000-0000-4000-8000-000000000002',
  'active',
  '14030000-0000-4000-8000-000000000001',
  '14030000-0000-4000-8000-000000000002',
  now()
);

insert into public.training_history (
  id, trainee_user_id, level, cohort, location, started_on, completed_on,
  teaching_instructor_name, coursework_complete, status, verified_by,
  verified_under_assignment_id, verified_at
) values (
  '54030000-0000-4000-8000-000000000001',
  '14030000-0000-4000-8000-000000000001',
  'level_1', 'TASK-403 Level 1', 'Chisinau', '2026-01-01', '2026-01-05',
  'Instructor 403', true, 'verified',
  '14030000-0000-4000-8000-000000000002',
  '44030000-0000-4000-8000-000000000001', now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000001', true);

do $$
declare journey public.certification_journeys;
begin
  journey := public.sync_certification_journey(
    '14030000-0000-4000-8000-000000000001',
    '14030000-0000-4000-8000-000000000001'
  );
  begin
    perform public.request_level_2_readiness('14030000-0000-4000-8000-000000000001', journey.id);
    raise exception 'A Trainee requested Level 2 review before meeting the requirements';
  exception when check_violation then null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000004', true);

insert into public.sessions (id, practitioner_id, client_id, session_date, duration_minutes, is_validated)
select
  ('64030000-0000-4000-8000-' || lpad(series::text, 12, '0'))::uuid,
  '24030000-0000-4000-8000-000000000001',
  case when series = 25 then null else '34030000-0000-4000-8000-000000000001'::uuid end,
  date '2026-02-01' + series,
  60,
  false
from generate_series(1, 25) series;

insert into public.session_feedback (
  id, session_id, token, rating, submitted_at
)
select
  ('74030000-0000-4000-8000-' || lpad(series::text, 12, '0'))::uuid,
  ('64030000-0000-4000-8000-' || lpad(series::text, 12, '0'))::uuid,
  'task-403-feedback-' || series::text,
  5,
  now()
from generate_series(1, 25) series;

do $$
begin
  if (select count(*) from public.certification_milestone_attainments
      where journey_id = (select id from public.certification_journeys where trainee_user_id = '14030000-0000-4000-8000-000000000001')
        and milestone = 25) <> 1 then
    raise exception 'The 25-session attainment was not recorded exactly once';
  end if;
  if (select counted_sessions_count from public.certification_journeys
      where trainee_user_id = '14030000-0000-4000-8000-000000000001') <> 25 then
    raise exception 'Submitted-feedback validation did not count the session without a linked client row';
  end if;
  if (select count(*) from public.notifications
      where event_key like 'certification.milestone_25_reached:%') <> 2 then
    raise exception 'The Trainee and active Instructor did not receive one milestone notification each';
  end if;
  if (select count(*) from public.transactional_email_deliveries
      where idempotency_key like 'certification.milestone_25_reached:%') <> 2 then
    raise exception 'The Trainee and active Instructor did not receive one milestone email each';
  end if;
  if not exists (
    select 1 from public.transactional_email_deliveries
    where recipient_user_id = '14030000-0000-4000-8000-000000000001'
      and locale = 'es' and destination_path like '/es/dashboard/certification?journeyId=%'
  ) then
    raise exception 'The Trainee milestone email was not localized or exact';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000001', true);

do $$
declare
  journey_id uuid;
  first_request public.level_2_readiness_requests;
  retry_request public.level_2_readiness_requests;
begin
  select id into journey_id from public.certification_journeys
  where trainee_user_id = '14030000-0000-4000-8000-000000000001';
  first_request := public.request_level_2_readiness(
    '14030000-0000-4000-8000-000000000001', journey_id
  );
  retry_request := public.request_level_2_readiness(
    '14030000-0000-4000-8000-000000000001', journey_id
  );
  if first_request.id <> retry_request.id then
    raise exception 'Retrying a readiness request created a duplicate';
  end if;
  if (select count(*) from public.notifications
      where event_key like 'certification.level_2_readiness_requested:%') <> 1 then
    raise exception 'The active Instructor did not receive one request notification';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000003', true);
do $$
declare request_id uuid;
begin
  select id into request_id from public.level_2_readiness_requests where status = 'pending';
  begin
    perform public.decide_level_2_readiness(
      '14030000-0000-4000-8000-000000000003', request_id, 'approved', null
    );
    raise exception 'An unrelated user approved Level 2 readiness';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000002', true);
do $$
declare
  request_id uuid;
  decision public.level_2_readiness_requests;
  journey public.certification_journeys;
begin
  select id into request_id from public.level_2_readiness_requests where status = 'pending';
  begin
    perform public.decide_level_2_readiness(
      '14030000-0000-4000-8000-000000000002', request_id, 'rejected', null
    );
    raise exception 'A negative decision without a reason succeeded';
  exception when check_violation then null;
  end;

  decision := public.decide_level_2_readiness(
    '14030000-0000-4000-8000-000000000002', request_id, 'approved', null
  );
  select * into journey from public.certification_journeys where id = decision.journey_id;
  if journey.state <> 'level_2_review_eligible' then
    raise exception 'Readiness approval automatically completed Level 2';
  end if;
  if (select count(*) from public.transactional_email_deliveries
      where idempotency_key like 'certification.level_2:%') <> 1 then
    raise exception 'The readiness decision did not enqueue exactly one required email';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000004', true);
update public.sessions set is_validated = false
where id = '64030000-0000-4000-8000-000000000025';

do $$
begin
  if not exists (
    select 1 from public.level_2_readiness_requests where status = 'invalidated'
  ) then
    raise exception 'Session invalidation did not invalidate the readiness approval';
  end if;
  if (select state from public.certification_journeys
      where trainee_user_id = '14030000-0000-4000-8000-000000000001') <> 'practicum_in_progress' then
    raise exception 'Session invalidation did not safely recalculate eligibility';
  end if;

  update public.sessions set is_validated = true
  where id = '64030000-0000-4000-8000-000000000025';

  if (select count(*) from public.certification_milestone_attainments where milestone = 25) <> 1
    or (select count(*) from public.transactional_email_deliveries
        where idempotency_key like 'certification.milestone_25_reached:%') <> 2 then
    raise exception 'Reattainment duplicated the milestone event';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14030000-0000-4000-8000-000000000003', true);
do $$
begin
  if exists (
    select 1 from public.level_2_readiness_requests
    where trainee_user_id = '14030000-0000-4000-8000-000000000001'
  ) then
    raise exception 'An unrelated user read private readiness records';
  end if;
end;
$$;

rollback;
