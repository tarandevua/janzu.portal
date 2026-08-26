\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('12030000-0000-4000-8000-000000000001', 'task-203-trainee@example.test', '{"full_name":"Trainee 203"}'::jsonb),
  ('12030000-0000-4000-8000-000000000002', 'task-203-instructor@example.test', '{"full_name":"Instructor 203"}'::jsonb),
  ('12030000-0000-4000-8000-000000000003', 'task-203-unrelated@example.test', '{"full_name":"Unrelated 203"}'::jsonb);

insert into public.users (id, email, full_name)
values
  ('12030000-0000-4000-8000-000000000001', 'task-203-trainee@example.test', 'Trainee 203'),
  ('12030000-0000-4000-8000-000000000002', 'task-203-instructor@example.test', 'Instructor 203'),
  ('12030000-0000-4000-8000-000000000003', 'task-203-unrelated@example.test', 'Unrelated 203')
on conflict (id) do update set full_name = excluded.full_name;

insert into public.user_roles (user_id, role_id)
select target.id, roles.id
from (values
  ('12030000-0000-4000-8000-000000000001'::uuid, 'apprentice'::public.app_role),
  ('12030000-0000-4000-8000-000000000002'::uuid, 'instructor'::public.app_role),
  ('12030000-0000-4000-8000-000000000003'::uuid, 'instructor'::public.app_role)
) target(id, role_name)
join public.roles on roles.name = target.role_name
on conflict do nothing;

insert into public.practitioners (id, user_id)
values ('22030000-0000-4000-8000-000000000001', '12030000-0000-4000-8000-000000000001');

insert into public.clients (id, practitioner_id, name)
values (
  '32030000-0000-4000-8000-000000000001',
  '22030000-0000-4000-8000-000000000001',
  'Private Participant 203'
);

insert into public.supervision_assignments (
  id, trainee_user_id, instructor_user_id, status, requested_by, responded_by, responded_at
) values (
  '42030000-0000-4000-8000-000000000001',
  '12030000-0000-4000-8000-000000000001',
  '12030000-0000-4000-8000-000000000002',
  'active',
  '12030000-0000-4000-8000-000000000001',
  '12030000-0000-4000-8000-000000000002',
  now()
);

select set_config('request.jwt.claim.sub', '12030000-0000-4000-8000-000000000002', true);

insert into public.training_history (
  id, trainee_user_id, level, cohort, location, started_on, completed_on,
  teaching_instructor_name, coursework_complete, status, verified_by,
  verified_under_assignment_id, verified_at
) values (
  '52030000-0000-4000-8000-000000000001',
  '12030000-0000-4000-8000-000000000001',
  'level_1', 'TASK-203 Level 1', 'Chisinau', '2026-01-01', '2026-01-05',
  'Instructor 203', true, 'verified',
  '12030000-0000-4000-8000-000000000002',
  '42030000-0000-4000-8000-000000000001', now()
);

insert into public.sessions (
  id, practitioner_id, client_id, session_date, duration_minutes, is_validated
) values (
  '62030000-0000-4000-8000-000000000001',
  '22030000-0000-4000-8000-000000000001',
  '32030000-0000-4000-8000-000000000001',
  '2026-02-01', 60, true
);

insert into public.session_feedback (
  id, session_id, token, rating, experience_text, emotional_impact,
  participant_email, submitted_at
) values (
  '72030000-0000-4000-8000-000000000001',
  '62030000-0000-4000-8000-000000000001',
  'task-203-private-feedback-token', 5,
  'Private feedback text 203', 'Private emotional impact 203',
  'private-participant-203@example.test', now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '12030000-0000-4000-8000-000000000002', true);

do $$
declare
  summary record;
begin
  select * into summary
  from public.list_instructor_supervision_dashboard('12030000-0000-4000-8000-000000000002');

  if summary.trainee_user_id <> '12030000-0000-4000-8000-000000000001'
    or summary.current_level <> 'level_1'
    or summary.verified_training_count <> 1
    or summary.counted_sessions_count <> 1
    or summary.recent_feedback_rating <> 5
  then
    raise exception 'Assigned Instructor did not receive the dashboard summary';
  end if;

  begin
    perform public.list_instructor_supervision_dashboard('12030000-0000-4000-8000-000000000003');
    raise exception 'A caller changed the dashboard actor identifier';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '12030000-0000-4000-8000-000000000003', true);
do $$
begin
  if exists (
    select 1 from public.list_instructor_supervision_dashboard('12030000-0000-4000-8000-000000000003')
  ) then
    raise exception 'Unrelated Instructor received a dashboard summary';
  end if;
end;
$$;

reset role;
update public.supervision_assignments
set status = 'ended', ended_by = '12030000-0000-4000-8000-000000000002', ended_at = now()
where id = '42030000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '12030000-0000-4000-8000-000000000002', true);
do $$
begin
  if exists (
    select 1 from public.list_instructor_supervision_dashboard('12030000-0000-4000-8000-000000000002')
  ) then
    raise exception 'Former Instructor retained dashboard access';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  begin
    perform public.list_instructor_supervision_dashboard(
      '12030000-0000-4000-8000-000000000002'
    );
    raise exception 'Anonymous caller read the supervision dashboard';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
