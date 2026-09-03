\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('14050000-0000-4000-8000-000000000001', 'task-405-member@example.test', '{"full_name":"Member 405"}'::jsonb),
  ('14050000-0000-4000-8000-000000000002', 'task-405-instructor@example.test', '{"full_name":"Instructor 405"}'::jsonb),
  ('14050000-0000-4000-8000-000000000003', 'task-405-assessor@example.test', '{"full_name":"Assessor 405"}'::jsonb),
  ('14050000-0000-4000-8000-000000000004', 'task-405-admin-one@example.test', '{"full_name":"Administrator One 405"}'::jsonb),
  ('14050000-0000-4000-8000-000000000005', 'task-405-admin-two@example.test', '{"full_name":"Administrator Two 405"}'::jsonb),
  ('14050000-0000-4000-8000-000000000006', 'task-405-unrelated@example.test', '{"full_name":"Unrelated 405"}'::jsonb);

insert into public.users (id, email, full_name, official_full_name, preferred_locale) values
  ('14050000-0000-4000-8000-000000000001', 'task-405-member@example.test', 'Member 405', 'Official Member 405', 'es'),
  ('14050000-0000-4000-8000-000000000002', 'task-405-instructor@example.test', 'Instructor 405', 'Instructor 405', 'en'),
  ('14050000-0000-4000-8000-000000000003', 'task-405-assessor@example.test', 'Assessor 405', 'Assessor 405', 'en'),
  ('14050000-0000-4000-8000-000000000004', 'task-405-admin-one@example.test', 'Administrator One 405', 'Administrator One 405', 'en'),
  ('14050000-0000-4000-8000-000000000005', 'task-405-admin-two@example.test', 'Administrator Two 405', 'Administrator Two 405', 'es'),
  ('14050000-0000-4000-8000-000000000006', 'task-405-unrelated@example.test', 'Unrelated 405', 'Unrelated 405', 'en')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name,
  official_full_name = excluded.official_full_name, preferred_locale = excluded.preferred_locale;

insert into public.user_roles (user_id, role_id)
select '14050000-0000-4000-8000-000000000001', id from public.roles where name = 'apprentice' on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select user_id, roles.id from (values
  ('14050000-0000-4000-8000-000000000002'::uuid),
  ('14050000-0000-4000-8000-000000000003'::uuid)
) instructors(user_id) cross join public.roles where roles.name = 'instructor' on conflict do nothing;
insert into public.user_roles (user_id, role_id)
select user_id, roles.id from (values
  ('14050000-0000-4000-8000-000000000004'::uuid),
  ('14050000-0000-4000-8000-000000000005'::uuid)
) administrators(user_id) cross join public.roles where roles.name = 'admin' on conflict do nothing;

select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000004', true);

insert into public.practitioners (id, user_id, directory_visibility, display_name_visibility)
values ('24050000-0000-4000-8000-000000000001', '14050000-0000-4000-8000-000000000001', 'private', 'private');
insert into public.supervision_assignments (
  id, trainee_user_id, instructor_user_id, status, requested_by, responded_by, responded_at
) values (
  '44050000-0000-4000-8000-000000000001', '14050000-0000-4000-8000-000000000001',
  '14050000-0000-4000-8000-000000000002', 'active', '14050000-0000-4000-8000-000000000001',
  '14050000-0000-4000-8000-000000000002', now()
);
insert into public.training_history (
  id, trainee_user_id, level, cohort, location, started_on, completed_on,
  teaching_instructor_name, coursework_complete, status, verified_by, verified_under_assignment_id, verified_at
) values
  ('54050000-0000-4000-8000-000000000001', '14050000-0000-4000-8000-000000000001', 'level_1',
   'Level 1 405', 'Chisinau', '2026-01-01', '2026-01-05', 'Instructor 405', true, 'verified',
   '14050000-0000-4000-8000-000000000002', '44050000-0000-4000-8000-000000000001', now()),
  ('54050000-0000-4000-8000-000000000002', '14050000-0000-4000-8000-000000000001', 'level_2',
   'Level 2 405', 'Chisinau', '2026-05-01', '2026-05-05', 'Instructor 405', true, 'verified',
   '14050000-0000-4000-8000-000000000002', '44050000-0000-4000-8000-000000000001', now());
insert into public.sessions (id, practitioner_id, session_date, duration_minutes, is_validated)
select ('64050000-0000-4000-8000-' || lpad(series::text, 12, '0'))::uuid,
  '24050000-0000-4000-8000-000000000001', date '2026-02-01' + series, 60, true
from generate_series(1, 50) series;

insert into public.level_2_readiness_requests (
  id, journey_id, trainee_user_id, assignment_id, status, decided_by, decided_at
) select '74050000-0000-4000-8000-000000000001', id, trainee_user_id,
  '44050000-0000-4000-8000-000000000001', 'approved', '14050000-0000-4000-8000-000000000002', now()
from public.certification_journeys where trainee_user_id = '14050000-0000-4000-8000-000000000001';
select public.recalculate_certification_journey('24050000-0000-4000-8000-000000000001', '14050000-0000-4000-8000-000000000004');
insert into public.assessment_readiness_requests (
  id, journey_id, trainee_user_id, assignment_id, status, decided_by, decided_at
) select '84050000-0000-4000-8000-000000000001', id, trainee_user_id,
  '44050000-0000-4000-8000-000000000001', 'approved', '14050000-0000-4000-8000-000000000002', now()
from public.certification_journeys where trainee_user_id = '14050000-0000-4000-8000-000000000001';
insert into public.assessor_designations (
  id, user_id, active, designated_by, designation_reason
) values ('94050000-0000-4000-8000-000000000001', '14050000-0000-4000-8000-000000000003', true,
  '14050000-0000-4000-8000-000000000004', 'Authorized TASK-405 test Assessor.');
insert into public.assessments (
  id, journey_id, readiness_request_id, trainee_user_id, revision_number,
  assessor_designation_id, assessor_user_id, scheduled_at, status, assessed_at
) select 'a4050000-0000-4000-8000-000000000001', journeys.id,
  '84050000-0000-4000-8000-000000000001', journeys.trainee_user_id, 1,
  '94050000-0000-4000-8000-000000000001', '14050000-0000-4000-8000-000000000003',
  now() - interval '1 day', 'passed', now()
from public.certification_journeys journeys where trainee_user_id = '14050000-0000-4000-8000-000000000001';
update public.certification_journeys set state = 'assessment_passed'
where trainee_user_id = '14050000-0000-4000-8000-000000000001';
select set_config('task.task_405_journey_id',
  (select id::text from public.certification_journeys where trainee_user_id = '14050000-0000-4000-8000-000000000001'), false);

update public.certificate_templates set
  signatory_one_object_path = 'certificate-signatures/test/maria.png',
  signatory_one_sha256 = repeat('a', 64),
  signatory_two_object_path = 'certificate-signatures/test/ivan.png',
  signatory_two_sha256 = repeat('b', 64),
  production_ready = true
where version = 'v1';
select set_config('task.task_405_template_id',
  (select id::text from public.certificate_templates where version = 'v1'), false);

set local role authenticated;
select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000006', true);
do $$
begin
  begin
    perform public.issue_certificate(
      '14050000-0000-4000-8000-000000000006', 'b4050000-0000-4000-8000-000000000001',
      current_setting('task.task_405_journey_id')::uuid,
      'JZ-2026-AAAA-BBBB-CCCC', current_setting('task.task_405_template_id')::uuid,
      'certificates/14050000-0000-4000-8000-000000000001/b4050000-0000-4000-8000-000000000001.pdf',
      repeat('c', 64), 1000, repeat('a', 64), repeat('b', 64)
    );
    raise exception 'An unrelated member issued a certificate';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000004', true);
select public.issue_certificate(
  '14050000-0000-4000-8000-000000000004', 'b4050000-0000-4000-8000-000000000001',
  current_setting('task.task_405_journey_id')::uuid,
  'JZ-2026-AAAA-BBBB-CCCC', current_setting('task.task_405_template_id')::uuid,
  'certificates/14050000-0000-4000-8000-000000000001/b4050000-0000-4000-8000-000000000001.pdf',
  repeat('c', 64), 1000, repeat('a', 64), repeat('b', 64)
);

reset role;
do $$
begin
  if (select state from public.certification_journeys where trainee_user_id = '14050000-0000-4000-8000-000000000001') <> 'facilitator_activated'
    or (select certification_status from public.certification_journeys where trainee_user_id = '14050000-0000-4000-8000-000000000001') <> 'active'
    or not public.user_has_role('14050000-0000-4000-8000-000000000001', 'facilitator') then
    raise exception 'Issuance did not atomically activate certification and Facilitator access';
  end if;
  if (select count(*) from public.certificates where member_user_id = '14050000-0000-4000-8000-000000000001' and status = 'active') <> 1 then
    raise exception 'Issuance did not enforce one active certificate';
  end if;
  if exists (select 1 from public.verify_certificate('JZ-2026-AAAA-BBBB-CCCC') where public_display_name is not null) then
    raise exception 'Public verification exposed a private member name';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000006', true);
do $$
begin
  begin
    perform public.authorize_certificate_download(
      '14050000-0000-4000-8000-000000000006', 'b4050000-0000-4000-8000-000000000001'
    );
    raise exception 'An unrelated member downloaded a private certificate';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000001', true);
select * from public.authorize_certificate_download(
  '14050000-0000-4000-8000-000000000001', 'b4050000-0000-4000-8000-000000000001'
);
select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000004', true);
select public.replace_certificate(
  '14050000-0000-4000-8000-000000000004', 'b4050000-0000-4000-8000-000000000002',
  'b4050000-0000-4000-8000-000000000001', 'Correcting an immutable certificate artifact.', null,
  'JZ-2026-DDDD-EEEE-FFFF', current_setting('task.task_405_template_id')::uuid,
  'certificates/14050000-0000-4000-8000-000000000001/b4050000-0000-4000-8000-000000000002.pdf',
  repeat('d', 64), 1100, repeat('a', 64), repeat('b', 64)
);

select public.revoke_certificate(
  '14050000-0000-4000-8000-000000000004', 'b4050000-0000-4000-8000-000000000002',
  'Documented certification revocation for the integration test.', 'private-evidence-405'
);

reset role;
do $$
begin
  if (select status from public.certificates where id = 'b4050000-0000-4000-8000-000000000001') <> 'replaced'
    or (select status from public.certificates where id = 'b4050000-0000-4000-8000-000000000002') <> 'revoked' then
    raise exception 'Replacement and revocation did not preserve lifecycle history';
  end if;
  if public.user_has_role('14050000-0000-4000-8000-000000000001', 'facilitator') then
    raise exception 'Revocation retained certification-derived Facilitator access';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000001', true);
do $$
begin
  begin
    perform public.authorize_certificate_download(
      '14050000-0000-4000-8000-000000000001', 'b4050000-0000-4000-8000-000000000002'
    );
    raise exception 'A member downloaded a revoked certificate as an active credential';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select public.submit_certificate_appeal(
  '14050000-0000-4000-8000-000000000001', 'b4050000-0000-4000-8000-000000000002',
  'The member requests documented review of the revocation.', 'member-evidence-reference'
);

reset role;
select set_config('task.task_405_appeal_id',
  (select id::text from public.certificate_appeals where status = 'pending'), false);
set local role authenticated;
select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000004', true);
do $$
begin
  begin
    perform public.uphold_certificate_appeal(
      '14050000-0000-4000-8000-000000000004',
      current_setting('task.task_405_appeal_id')::uuid,
      'The revoking Administrator should not decide while another Administrator is active.'
    );
    raise exception 'The revoking Administrator decided the appeal despite separation of duties';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '14050000-0000-4000-8000-000000000005', true);
select public.reinstate_certificate_from_appeal(
  '14050000-0000-4000-8000-000000000005',
  current_setting('task.task_405_appeal_id')::uuid,
  'Independent review approved reinstatement with a newly issued document.',
  'b4050000-0000-4000-8000-000000000003', 'JZ-2026-GGGG-HHHH-JJJJ',
  current_setting('task.task_405_template_id')::uuid,
  'certificates/14050000-0000-4000-8000-000000000001/b4050000-0000-4000-8000-000000000003.pdf',
  repeat('e', 64), 1200, repeat('a', 64), repeat('b', 64)
);

reset role;
do $$
begin
  if (select status from public.certificate_appeals order by submitted_at desc limit 1) <> 'reinstated'
    or (select count(*) from public.certificates where member_user_id = '14050000-0000-4000-8000-000000000001' and status = 'active') <> 1
    or not public.user_has_role('14050000-0000-4000-8000-000000000001', 'facilitator') then
    raise exception 'Appeal reinstatement did not issue one new active certificate and restore access';
  end if;
  if exists (
    select 1 from public.transactional_email_events
    where metadata ? 'reason' or metadata ? 'evidence' or metadata ? 'signature'
  ) then raise exception 'Private certificate lifecycle data leaked into email metadata'; end if;
end;
$$;

rollback;
