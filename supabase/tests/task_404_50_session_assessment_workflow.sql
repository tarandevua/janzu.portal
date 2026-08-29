\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('14040000-0000-4000-8000-000000000001', 'task-404-trainee@example.test', '{"full_name":"Trainee 404"}'::jsonb),
  ('14040000-0000-4000-8000-000000000002', 'task-404-instructor@example.test', '{"full_name":"Instructor 404"}'::jsonb),
  ('14040000-0000-4000-8000-000000000003', 'task-404-assessor@example.test', '{"full_name":"Assessor 404"}'::jsonb),
  ('14040000-0000-4000-8000-000000000004', 'task-404-admin@example.test', '{"full_name":"Administrator 404"}'::jsonb),
  ('14040000-0000-4000-8000-000000000005', 'task-404-unrelated@example.test', '{"full_name":"Unrelated 404"}'::jsonb);

insert into public.users (id, email, full_name, official_full_name, preferred_locale) values
  ('14040000-0000-4000-8000-000000000001', 'task-404-trainee@example.test', 'Trainee 404', 'Trainee 404', 'es'),
  ('14040000-0000-4000-8000-000000000002', 'task-404-instructor@example.test', 'Instructor 404', 'Instructor 404', 'en'),
  ('14040000-0000-4000-8000-000000000003', 'task-404-assessor@example.test', 'Assessor 404', 'Assessor 404', 'es'),
  ('14040000-0000-4000-8000-000000000004', 'task-404-admin@example.test', 'Administrator 404', 'Administrator 404', 'en'),
  ('14040000-0000-4000-8000-000000000005', 'task-404-unrelated@example.test', 'Unrelated 404', 'Unrelated 404', 'en')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name,
  official_full_name = excluded.official_full_name, preferred_locale = excluded.preferred_locale;

insert into public.user_roles (user_id, role_id)
select '14040000-0000-4000-8000-000000000001', id from public.roles where name = 'apprentice'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select user_id, roles.id from (values
  ('14040000-0000-4000-8000-000000000002'::uuid),
  ('14040000-0000-4000-8000-000000000003'::uuid)
) instructors(user_id) cross join public.roles where roles.name = 'instructor'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '14040000-0000-4000-8000-000000000004', id from public.roles where name = 'admin'
on conflict do nothing;

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000004', true);

insert into public.practitioners (id, user_id)
values ('24040000-0000-4000-8000-000000000001', '14040000-0000-4000-8000-000000000001');
insert into public.supervision_assignments (
  id, trainee_user_id, instructor_user_id, status, requested_by, responded_by, responded_at
) values (
  '44040000-0000-4000-8000-000000000001', '14040000-0000-4000-8000-000000000001',
  '14040000-0000-4000-8000-000000000002', 'active', '14040000-0000-4000-8000-000000000001',
  '14040000-0000-4000-8000-000000000002', now()
);
insert into public.training_history (
  id, trainee_user_id, level, cohort, location, started_on, completed_on,
  teaching_instructor_name, coursework_complete, status, verified_by, verified_under_assignment_id, verified_at
) values
  ('54040000-0000-4000-8000-000000000001', '14040000-0000-4000-8000-000000000001', 'level_1',
   'Level 1 404', 'Chisinau', '2026-01-01', '2026-01-05', 'Instructor 404', true, 'verified',
   '14040000-0000-4000-8000-000000000002', '44040000-0000-4000-8000-000000000001', now()),
  ('54040000-0000-4000-8000-000000000002', '14040000-0000-4000-8000-000000000001', 'level_2',
   'Level 2 404', 'Chisinau', '2026-05-01', '2026-05-05', 'Instructor 404', true, 'verified',
   '14040000-0000-4000-8000-000000000002', '44040000-0000-4000-8000-000000000001', now());

insert into public.sessions (id, practitioner_id, session_date, duration_minutes, is_validated)
select ('64040000-0000-4000-8000-' || lpad(series::text, 12, '0'))::uuid,
  '24040000-0000-4000-8000-000000000001', date '2026-02-01' + series, 60, true
from generate_series(1, 50) series;

insert into public.level_2_readiness_requests (
  id, journey_id, trainee_user_id, assignment_id, status, decided_by, decided_at
) select '84040000-0000-4000-8000-000000000001', journeys.id, journeys.trainee_user_id,
  '44040000-0000-4000-8000-000000000001', 'approved', '14040000-0000-4000-8000-000000000002', now()
from public.certification_journeys journeys where journeys.trainee_user_id = '14040000-0000-4000-8000-000000000001';

select public.recalculate_certification_journey('24040000-0000-4000-8000-000000000001', '14040000-0000-4000-8000-000000000004');

do $$
begin
  if (select state from public.certification_journeys where trainee_user_id = '14040000-0000-4000-8000-000000000001') <> 'sessions_50_reached' then
    raise exception 'All verified training and practice requirements did not unlock the 50-session state';
  end if;
  if (select count(*) from public.certification_milestone_attainments where milestone = 50) <> 1 then
    raise exception 'The 50-session attainment was not recorded exactly once';
  end if;
  if (select count(*) from public.notifications where event_key like 'certification.milestone_50_reached:%') <> 3 then
    raise exception 'Trainee, active Instructor, and Administrator did not receive one milestone notification';
  end if;
  if (select count(*) from public.transactional_email_deliveries where idempotency_key like 'certification.milestone_50_reached:%') <> 3 then
    raise exception 'Milestone required-email fanout was not idempotent';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000001', true);
select public.request_assessment_readiness(
  '14040000-0000-4000-8000-000000000001',
  (public.sync_certification_journey(
    '14040000-0000-4000-8000-000000000001',
    '14040000-0000-4000-8000-000000000001'
  )).id
);
select set_config(
  'task.task_404_request_id',
  (select id::text from public.assessment_readiness_requests where status = 'pending'),
  false
);

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000005', true);
do $$
begin
  begin
    perform public.decide_assessment_readiness(
      '14040000-0000-4000-8000-000000000005',
      current_setting('task.task_404_request_id')::uuid, true, null
    );
    raise exception 'An unrelated user approved assessment readiness';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000002', true);
select public.decide_assessment_readiness(
  '14040000-0000-4000-8000-000000000002',
  current_setting('task.task_404_request_id')::uuid, true, null
);

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000004', true);
select public.set_assessor_designation(
  '14040000-0000-4000-8000-000000000004', '14040000-0000-4000-8000-000000000003', true,
  'Authorized for final Janzu assessments.'
);
select public.assign_assessment_assessor(
  '14040000-0000-4000-8000-000000000004',
  (select id from public.assessments where revision_number = 1),
  '14040000-0000-4000-8000-000000000003'
);

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000003', true);
select public.schedule_assessment(
  '14040000-0000-4000-8000-000000000003',
  (select id from public.assessments where revision_number = 1), now()
);
do $$
begin
  begin
    perform public.record_assessment_outcome(
      '14040000-0000-4000-8000-000000000003',
      (select id from public.assessments where revision_number = 1), 'failed', 'Private notes', null
    );
    raise exception 'A failed assessment without an explicit next action succeeded';
  exception when check_violation then null;
  end;
end;
$$;
select public.record_assessment_outcome(
  '14040000-0000-4000-8000-000000000003',
  (select id from public.assessments where revision_number = 1), 'failed',
  'Private notes must stay in the portal.', 'Complete two supervised remediation sessions.'
);

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000002', true);
select public.verify_assessment_remediation(
  '14040000-0000-4000-8000-000000000002',
  (select id from public.assessments where revision_number = 1)
);

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000004', true);
select public.assign_assessment_assessor(
  '14040000-0000-4000-8000-000000000004',
  (select id from public.assessments where revision_number = 2),
  '14040000-0000-4000-8000-000000000003'
);

select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000003', true);
select public.schedule_assessment(
  '14040000-0000-4000-8000-000000000003',
  (select id from public.assessments where revision_number = 2), now()
);
select public.record_assessment_outcome(
  '14040000-0000-4000-8000-000000000003',
  (select id from public.assessments where revision_number = 2), 'passed',
  'The reassessment met the approved criteria.', null
);

reset role;
do $$
begin
  if (select count(*) from public.assessments where journey_id = (select id from public.certification_journeys where trainee_user_id = '14040000-0000-4000-8000-000000000001')) <> 2 then
    raise exception 'Reassessment did not preserve the first attempt and create a revision';
  end if;
  if exists (select 1 from public.transactional_email_events where metadata ? 'notes' or metadata ? 'reason' or metadata ? 'next_action') then
    raise exception 'Private assessment text leaked into email metadata';
  end if;
  if (select state from public.certification_journeys where trainee_user_id = '14040000-0000-4000-8000-000000000001') <> 'assessment_passed' then
    raise exception 'A passed reassessment did not stop at the TASK-404 assessment-passed boundary';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14040000-0000-4000-8000-000000000005', true);
do $$
begin
  if exists (select 1 from public.assessments where trainee_user_id = '14040000-0000-4000-8000-000000000001') then
    raise exception 'An unrelated user read private assessment records';
  end if;
end;
$$;

rollback;
