\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('14020000-0000-4000-8000-000000000001', 'task-402-trainee@example.test', '{"full_name":"Trainee 402"}'::jsonb),
  ('14020000-0000-4000-8000-000000000002', 'task-402-instructor@example.test', '{"full_name":"Instructor 402"}'::jsonb),
  ('14020000-0000-4000-8000-000000000003', 'task-402-unrelated@example.test', '{"full_name":"Unrelated 402"}'::jsonb),
  ('14020000-0000-4000-8000-000000000004', 'task-402-admin@example.test', '{"full_name":"Administrator 402"}'::jsonb);

insert into public.users (id, email, full_name, official_full_name)
values
  ('14020000-0000-4000-8000-000000000001', 'task-402-trainee@example.test', 'Trainee 402', 'Trainee 402'),
  ('14020000-0000-4000-8000-000000000002', 'task-402-instructor@example.test', 'Instructor 402', 'Instructor 402'),
  ('14020000-0000-4000-8000-000000000003', 'task-402-unrelated@example.test', 'Unrelated 402', 'Unrelated 402'),
  ('14020000-0000-4000-8000-000000000004', 'task-402-admin@example.test', 'Administrator 402', 'Administrator 402')
on conflict (id) do update
set email = excluded.email, full_name = excluded.full_name, official_full_name = excluded.official_full_name;

insert into public.user_roles (user_id, role_id)
select '14020000-0000-4000-8000-000000000001', id from public.roles where name = 'apprentice'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '14020000-0000-4000-8000-000000000002', id from public.roles where name = 'instructor'
on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select '14020000-0000-4000-8000-000000000004', id from public.roles where name = 'admin'
on conflict do nothing;

select set_config('request.jwt.claim.sub', '14020000-0000-4000-8000-000000000004', true);

insert into public.practitioners (id, user_id)
values ('24020000-0000-4000-8000-000000000001', '14020000-0000-4000-8000-000000000001');

insert into public.clients (id, practitioner_id, name)
values (
  '34020000-0000-4000-8000-000000000001',
  '24020000-0000-4000-8000-000000000001',
  'Private Session Participant 402'
);

insert into public.supervision_assignments (
  id, trainee_user_id, instructor_user_id, status, requested_by, responded_by, responded_at
) values (
  '44020000-0000-4000-8000-000000000001',
  '14020000-0000-4000-8000-000000000001',
  '14020000-0000-4000-8000-000000000002',
  'active',
  '14020000-0000-4000-8000-000000000001',
  '14020000-0000-4000-8000-000000000002',
  now()
);

insert into public.training_history (
  id, trainee_user_id, level, cohort, location, started_on, completed_on,
  teaching_instructor_name, coursework_complete, status, verified_by,
  verified_under_assignment_id, verified_at
) values (
  '54020000-0000-4000-8000-000000000001',
  '14020000-0000-4000-8000-000000000001',
  'level_1',
  'TASK-402 Level 1',
  'Chisinau',
  '2026-01-01',
  '2026-01-05',
  'Instructor 402',
  true,
  'verified',
  '14020000-0000-4000-8000-000000000002',
  '44020000-0000-4000-8000-000000000001',
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '14020000-0000-4000-8000-000000000001', true);

do $$
declare
  journey public.certification_journeys;
begin
  journey := public.sync_certification_journey(
    '14020000-0000-4000-8000-000000000001',
    '14020000-0000-4000-8000-000000000001'
  );

  if journey.state <> 'practicum_in_progress' or journey.counted_sessions_count <> 0 then
    raise exception 'Verified Level 1 did not enter practicum safely';
  end if;

  begin
    perform public.sync_certification_journey(
      '14020000-0000-4000-8000-000000000004',
      '14020000-0000-4000-8000-000000000001'
    );
    raise exception 'A caller changed the actor identifier';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

insert into public.sessions (
  id, practitioner_id, client_id, session_date, duration_minutes, is_validated
)
select
  ('64020000-0000-4000-8000-' || lpad(series::text, 12, '0'))::uuid,
  '24020000-0000-4000-8000-000000000001',
  '34020000-0000-4000-8000-000000000001',
  date '2026-02-01' + series,
  60,
  true
from generate_series(1, 25) as series;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14020000-0000-4000-8000-000000000001', true);

do $$
declare
  journey public.certification_journeys;
  audit_count integer;
begin
  journey := public.sync_certification_journey(
    '14020000-0000-4000-8000-000000000001',
    '14020000-0000-4000-8000-000000000001'
  );

  if journey.state <> 'level_2_review_eligible' or journey.counted_sessions_count <> 25 then
    raise exception 'The 25-session rules did not produce Level 2 review eligibility';
  end if;

  select count(*) into audit_count
  from public.certification_journey_audit
  where journey_id = journey.id;

  perform public.sync_certification_journey(
    '14020000-0000-4000-8000-000000000001',
    '14020000-0000-4000-8000-000000000001'
  );

  if audit_count <> (
    select count(*) from public.certification_journey_audit where journey_id = journey.id
  ) then
    raise exception 'Idempotent synchronization created duplicate audit events';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '14020000-0000-4000-8000-000000000003', true);
do $$
begin
  begin
    perform public.sync_certification_journey(
      '14020000-0000-4000-8000-000000000003',
      '14020000-0000-4000-8000-000000000001'
    );
    raise exception 'An unrelated user read the certification journey';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.supervision_assignments
set status = 'ended', ended_by = '14020000-0000-4000-8000-000000000002', ended_at = now()
where id = '44020000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '14020000-0000-4000-8000-000000000002', true);
do $$
begin
  if exists (
    select 1 from public.list_certification_journeys('14020000-0000-4000-8000-000000000002')
    where trainee_user_id = '14020000-0000-4000-8000-000000000001'
  ) then
    raise exception 'A former Instructor retained certification access';
  end if;
end;
$$;

reset role;
update public.supervision_assignments
set status = 'active', ended_by = null, ended_at = null
where id = '44020000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '14020000-0000-4000-8000-000000000004', true);

do $$
declare
  journey public.certification_journeys;
  audit_count integer;
begin
  select * into journey from public.certification_journeys
  where trainee_user_id = '14020000-0000-4000-8000-000000000001';

  begin
    perform public.override_certification_journey_state(
      '14020000-0000-4000-8000-000000000004', journey.id, journey.state,
      'advanced_practicum_in_progress', 'Attempted skipped transition.', 'evidence-402'
    );
    raise exception 'An override skipped a required state';
  exception when check_violation then null;
  end;

  begin
    perform public.override_certification_journey_state(
      '14020000-0000-4000-8000-000000000004', journey.id, journey.state,
      'level_2_completed', '', 'evidence-402'
    );
    raise exception 'An override without a reason succeeded';
  exception when check_violation then null;
  end;

  journey := public.override_certification_journey_state(
    '14020000-0000-4000-8000-000000000004', journey.id, journey.state,
    'level_2_completed', 'Correcting an authenticated workflow failure.', 'decision-record-402'
  );

  if journey.state <> 'level_2_completed' then
    raise exception 'Authorized adjacent override did not commit';
  end if;

  select count(*) into audit_count
  from public.certification_journey_audit
  where journey_id = journey.id and action = 'manual_override';

  perform public.override_certification_journey_state(
    '14020000-0000-4000-8000-000000000004', journey.id,
    'level_2_review_eligible', 'level_2_completed',
    'Correcting an authenticated workflow failure.', 'decision-record-402'
  );

  if audit_count <> (
    select count(*) from public.certification_journey_audit
    where journey_id = journey.id and action = 'manual_override'
  ) then
    raise exception 'Idempotent override created a duplicate audit event';
  end if;

  if not exists (
    select 1 from public.certification_journey_audit
    where journey_id = journey.id
      and action = 'manual_override'
      and actor_user_id = '14020000-0000-4000-8000-000000000004'
      and reason = 'Correcting an authenticated workflow failure.'
      and evidence_reference = 'decision-record-402'
  ) then
    raise exception 'Manual override audit context is incomplete';
  end if;
end;
$$;

rollback;
