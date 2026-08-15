\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11000000-0000-4000-8000-000000000001', 'task-101-trainee@example.test', '{"full_name":"Trainee One"}'::jsonb),
  ('11000000-0000-4000-8000-000000000002', 'task-101-instructor@example.test', '{"full_name":"Instructor One"}'::jsonb),
  ('11000000-0000-4000-8000-000000000003', 'task-101-unrelated@example.test', '{"full_name":"Unrelated Instructor"}'::jsonb),
  ('11000000-0000-4000-8000-000000000004', 'task-101-admin@example.test', '{"full_name":"Administrator"}'::jsonb);

insert into public.user_roles (user_id, role_id)
select users.id, roles.id
from public.users
cross join public.roles
where users.id in (
  '11000000-0000-4000-8000-000000000002',
  '11000000-0000-4000-8000-000000000003'
)
and roles.name = 'instructor'
on conflict do nothing;

insert into public.user_roles (user_id, role_id)
select '11000000-0000-4000-8000-000000000004', roles.id
from public.roles
where roles.name = 'admin'
on conflict do nothing;

insert into public.practitioners (id, user_id)
values ('21000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);

select public.record_learning_alliance_action(
  '11000000-0000-4000-8000-000000000001',
  '2026-08-15-v1',
  'en',
  'accepted'
);

select public.request_supervision(
  '11000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000002'
);

do $$
begin
  if (
    select count(*) from public.supervision_assignments
    where trainee_user_id = '11000000-0000-4000-8000-000000000001'
      and status = 'pending'
  ) <> 1 then
    raise exception 'Trainee request did not remain pending for Instructor acceptance';
  end if;

  begin
    perform public.update_my_profile_visibility(
      '11000000-0000-4000-8000-000000000001',
      'public', 'public', 'private', 'private', 'private', 'private', 'private', 'private'
    );
    raise exception 'Trainee was allowed to expose a public profile';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select public.update_my_profile_visibility(
  '11000000-0000-4000-8000-000000000001',
  'community', 'community', 'private', 'private', 'community', 'private', 'private', 'private'
);

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000002', true);

select public.respond_to_supervision(
  '11000000-0000-4000-8000-000000000002',
  (select id from public.supervision_assignments
   where trainee_user_id = '11000000-0000-4000-8000-000000000001' and status = 'pending'),
  true
);

do $$
begin
  if not public.is_active_instructor_for(
    '11000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Accepted supervision relationship is not active';
  end if;

  if public.user_has_role('11000000-0000-4000-8000-000000000002', 'admin') then
    raise exception 'Instructor gained Administrator access';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);

insert into public.training_history (
  id,
  trainee_user_id,
  level,
  cohort,
  location,
  started_on,
  completed_on,
  teaching_instructor_name,
  coursework_complete,
  evidence_reference
) values (
  '31000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  'level_1',
  'Task 101 cohort',
  'Chisinau',
  '2026-05-01',
  '2026-05-05',
  'Instructor One',
  true,
  'Register 42'
);

update public.training_history
set cohort = 'Task 101 corrected cohort'
where id = '31000000-0000-4000-8000-000000000001';

do $$
begin
  if not exists (
    select 1 from public.training_history_audit
    where training_record_id = '31000000-0000-4000-8000-000000000001'
      and action = 'corrected'
      and previous_record ->> 'cohort' = 'Task 101 cohort'
      and resulting_record ->> 'cohort' = 'Task 101 corrected cohort'
  ) then
    raise exception 'Training correction did not preserve before and after snapshots';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000003', true);

do $$
begin
  begin
    perform public.review_training_record(
      '11000000-0000-4000-8000-000000000003',
      '31000000-0000-4000-8000-000000000001',
      true,
      null
    );
    raise exception 'Unrelated Instructor verified training';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000002', true);

select public.review_training_record(
  '11000000-0000-4000-8000-000000000002',
  '31000000-0000-4000-8000-000000000001',
  true,
  null
);

do $$
begin
  if (
    select status from public.training_history
    where id = '31000000-0000-4000-8000-000000000001'
  ) <> 'verified' then
    raise exception 'Active Instructor could not verify training';
  end if;

  if (
    select count(*) from public.training_history_audit
    where training_record_id = '31000000-0000-4000-8000-000000000001'
  ) < 2 then
    raise exception 'Training submission and review were not audited';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);

select public.request_supervision(
  '11000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000003'
);

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000004', true);

select public.admin_assign_instructor(
  '11000000-0000-4000-8000-000000000004',
  '11000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000002',
  'Administrative reassignment test'
);

do $$
begin
  if (
    select count(*) from public.supervision_assignments
    where trainee_user_id = '11000000-0000-4000-8000-000000000001'
      and status = 'pending'
  ) <> 0 then
    raise exception 'Administrative assignment left a stale pending request';
  end if;

  if (
    select count(*) from public.supervision_assignments
    where trainee_user_id = '11000000-0000-4000-8000-000000000001'
      and status = 'active'
  ) <> 1 then
    raise exception 'Administrative assignment did not preserve exactly one active Instructor';
  end if;

  if (
    select count(*) from public.notifications
    where user_id in (
      '11000000-0000-4000-8000-000000000001',
      '11000000-0000-4000-8000-000000000002',
      '11000000-0000-4000-8000-000000000003'
    )
      and type in ('supervision_accepted', 'supervision_ended')
  ) < 3 then
    raise exception 'Administrative assignment did not notify affected participants';
  end if;
end;
$$;

rollback;
