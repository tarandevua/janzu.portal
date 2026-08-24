\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('14010000-0000-4000-8000-000000000001', 'task-401-trainee@example.test', '{"full_name":"Trainee 401"}'::jsonb),
  ('14010000-0000-4000-8000-000000000002', 'task-401-instructor@example.test', '{"full_name":"Instructor 401"}'::jsonb),
  ('14010000-0000-4000-8000-000000000003', 'task-401-unrelated@example.test', '{"full_name":"Unrelated 401"}'::jsonb),
  ('14010000-0000-4000-8000-000000000004', 'task-401-admin@example.test', '{"full_name":"Administrator 401"}'::jsonb);

insert into public.user_roles (user_id, role_id)
select users.id, roles.id
from public.users
cross join public.roles
where users.id in (
  '14010000-0000-4000-8000-000000000002',
  '14010000-0000-4000-8000-000000000003'
)
and roles.name = 'instructor'
on conflict do nothing;

insert into public.user_roles (user_id, role_id)
select '14010000-0000-4000-8000-000000000004', roles.id
from public.roles
where roles.name = 'admin'
on conflict do nothing;

insert into public.practitioners (id, user_id)
values ('24010000-0000-4000-8000-000000000001', '14010000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '14010000-0000-4000-8000-000000000001', true);

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
  evidence_reference,
  notes
) values
  (
    '34010000-0000-4000-8000-000000000001',
    '14010000-0000-4000-8000-000000000001',
    'level_1',
    'TASK-401 Level 1',
    'Chisinau',
    '2026-01-10',
    '2026-01-15',
    'Instructor 401',
    true,
    'Official cohort register 401-L1',
    'Private Level 1 note'
  ),
  (
    '34010000-0000-4000-8000-000000000002',
    '14010000-0000-4000-8000-000000000001',
    'level_2',
    'TASK-401 Level 2',
    'Madrid',
    '2026-06-10',
    '2026-06-15',
    'Instructor Two',
    true,
    'Official cohort register 401-L2',
    null
  );

do $$
begin
  if public.current_verified_training_level(
    '14010000-0000-4000-8000-000000000001'
  ) is not null then
    raise exception 'Unverified training changed the derived current level';
  end if;

  if (
    select count(*)
    from public.list_training_history(
      '14010000-0000-4000-8000-000000000001',
      '14010000-0000-4000-8000-000000000001'
    )
  ) <> 2 then
    raise exception 'Trainee could not read their complete structured history';
  end if;

  begin
    perform public.list_training_history(
      '14010000-0000-4000-8000-000000000004',
      '14010000-0000-4000-8000-000000000001'
    );
    raise exception 'A caller changed the actor identifier';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select public.request_supervision(
  '14010000-0000-4000-8000-000000000001',
  '14010000-0000-4000-8000-000000000002'
);

select set_config('request.jwt.claim.sub', '14010000-0000-4000-8000-000000000002', true);
select public.respond_to_supervision(
  '14010000-0000-4000-8000-000000000002',
  (
    select id from public.supervision_assignments
    where trainee_user_id = '14010000-0000-4000-8000-000000000001'
      and instructor_user_id = '14010000-0000-4000-8000-000000000002'
      and status = 'pending'
  ),
  true
);

select public.review_training_record(
  '14010000-0000-4000-8000-000000000002',
  '34010000-0000-4000-8000-000000000001',
  true,
  null
);

do $$
begin
  if public.current_verified_training_level(
    '14010000-0000-4000-8000-000000000001'
  ) <> 'level_1' then
    raise exception 'Verified Level 1 was not derived as the current level';
  end if;

  if not exists (
    select 1
    from public.list_training_history(
      '14010000-0000-4000-8000-000000000002',
      '14010000-0000-4000-8000-000000000001'
    )
    where id = '34010000-0000-4000-8000-000000000001'
      and verified_by = '14010000-0000-4000-8000-000000000002'
      and verified_by_name = 'Instructor 401'
      and evidence_reference = 'Official cohort register 401-L1'
      and notes = 'Private Level 1 note'
  ) then
    raise exception 'Authorized read model omitted required training or verifier data';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '14010000-0000-4000-8000-000000000003', true);
do $$
begin
  begin
    perform public.list_training_history(
      '14010000-0000-4000-8000-000000000003',
      '14010000-0000-4000-8000-000000000001'
    );
    raise exception 'An unrelated Instructor read private training history';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.current_verified_training_level(
      '14010000-0000-4000-8000-000000000001'
    );
    raise exception 'An unrelated Instructor read the derived training level';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '14010000-0000-4000-8000-000000000002', true);
select public.end_supervision(
  '14010000-0000-4000-8000-000000000002',
  (
    select id from public.supervision_assignments
    where trainee_user_id = '14010000-0000-4000-8000-000000000001'
      and instructor_user_id = '14010000-0000-4000-8000-000000000002'
      and status = 'active'
  ),
  'TASK-401 ended-relationship boundary'
);

do $$
begin
  begin
    perform public.list_training_history(
      '14010000-0000-4000-8000-000000000002',
      '14010000-0000-4000-8000-000000000001'
    );
    raise exception 'A former Instructor retained training-history access';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '14010000-0000-4000-8000-000000000004', true);
do $$
begin
  if (
    select count(*)
    from public.list_training_history(
      '14010000-0000-4000-8000-000000000004',
      '14010000-0000-4000-8000-000000000001'
    )
  ) <> 2 then
    raise exception 'Administrator could not read the Trainee training history';
  end if;
end;
$$;

select public.review_training_record(
  '14010000-0000-4000-8000-000000000004',
  '34010000-0000-4000-8000-000000000002',
  true,
  null
);

do $$
begin
  if public.current_verified_training_level(
    '14010000-0000-4000-8000-000000000001'
  ) <> 'level_2' then
    raise exception 'Highest verified record was not derived as the current level';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  begin
    perform public.list_training_history(
      '14010000-0000-4000-8000-000000000001',
      '14010000-0000-4000-8000-000000000001'
    );
    raise exception 'Anonymous caller read private training history';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
rollback;
