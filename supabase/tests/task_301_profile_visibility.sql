\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('13010000-0000-4000-8000-000000000001', 'task-301-trainee@example.test', '{"full_name":"Trainee 301"}'::jsonb),
  ('13010000-0000-4000-8000-000000000002', 'task-301-facilitator@example.test', '{"full_name":"Facilitator 301"}'::jsonb),
  ('13010000-0000-4000-8000-000000000003', 'task-301-admin@example.test', '{"full_name":"Administrator 301"}'::jsonb),
  ('13010000-0000-4000-8000-000000000004', 'task-301-deleted@example.test', '{"full_name":"Deleted 301"}'::jsonb);

insert into public.users (id, email, full_name, official_full_name)
values
  ('13010000-0000-4000-8000-000000000001', 'task-301-trainee@example.test', 'Trainee 301', 'Private Trainee Name'),
  ('13010000-0000-4000-8000-000000000002', 'task-301-facilitator@example.test', 'Facilitator 301', 'Private Facilitator Name'),
  ('13010000-0000-4000-8000-000000000003', 'task-301-admin@example.test', 'Administrator 301', 'Private Administrator Name'),
  ('13010000-0000-4000-8000-000000000004', 'task-301-deleted@example.test', 'Deleted 301', 'Private Deleted Name')
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  official_full_name = excluded.official_full_name;

insert into public.user_roles (user_id, role_id)
select target.user_id, roles.id
from (values
  ('13010000-0000-4000-8000-000000000001'::uuid, 'apprentice'::public.app_role),
  ('13010000-0000-4000-8000-000000000002'::uuid, 'facilitator'::public.app_role),
  ('13010000-0000-4000-8000-000000000003'::uuid, 'admin'::public.app_role),
  ('13010000-0000-4000-8000-000000000004'::uuid, 'apprentice'::public.app_role)
) target(user_id, role_name)
join public.roles on roles.name = target.role_name
on conflict do nothing;

insert into public.practitioners (
  id, user_id, bio, country, city, latitude, longitude, languages, website,
  instagram_url, profile_image_url
) values
  (
    '23010000-0000-4000-8000-000000000001',
    '13010000-0000-4000-8000-000000000001',
    'Private trainee biography', 'Moldova', 'Chisinau', 47.0105, 28.8638,
    array['Romanian'], 'https://trainee.example.test', 'private-trainee',
    'https://example.test/trainee.jpg'
  ),
  (
    '23010000-0000-4000-8000-000000000002',
    '13010000-0000-4000-8000-000000000002',
    'Community facilitator biography', 'Spain', 'Barcelona', 41.3874, 2.1686,
    array['English', 'Spanish'], 'https://facilitator.example.test', 'facilitator-301',
    'https://example.test/facilitator.jpg'
  );

insert into public.practitioner_locations (
  practitioner_id, latitude, longitude, city, country, note, sort_order
) values (
  '23010000-0000-4000-8000-000000000002', 41.3874, 2.1686,
  'Barcelona', 'Spain', 'Private home entrance', 0
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '13010000-0000-4000-8000-000000000001', true);

do $$
begin
  begin
    perform public.update_my_profile_visibility(
      '13010000-0000-4000-8000-000000000001',
      'public', 'public', 'private', 'private', 'private', 'private', 'private', 'private'
    );
    raise exception 'Trainee was allowed to publish a profile';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select public.update_my_profile_visibility(
  '13010000-0000-4000-8000-000000000001',
  'community', 'community', 'private', 'private', 'community', 'private', 'private', 'private'
);

select set_config('request.jwt.claim.sub', '13010000-0000-4000-8000-000000000002', true);
select public.update_my_profile_visibility(
  '13010000-0000-4000-8000-000000000002',
  'public', 'public', 'public', 'community', 'public', 'public', 'private', 'private'
);

do $$
declare
  public_profile jsonb;
  community_profile record;
begin
  select to_jsonb(profile) into public_profile
  from public.list_public_practitioner_profiles() profile
  where id = '23010000-0000-4000-8000-000000000002';

  if public_profile ->> 'display_name' <> 'Facilitator 301'
    or public_profile ->> 'bio' is not null
    or public_profile ->> 'city' <> 'Barcelona'
    or public_profile ?| array[
      'user_id', 'latitude', 'longitude', 'created_at', 'updated_at',
      'official_full_name', 'directory_visibility'
    ]
  then
    raise exception 'Public projection returned private, community-only, or operational fields: %', public_profile;
  end if;

  select * into community_profile
  from public.list_community_practitioner_profiles(
    '13010000-0000-4000-8000-000000000002'
  )
  where id = '23010000-0000-4000-8000-000000000002';

  if community_profile.bio <> 'Community facilitator biography'
    or community_profile.website is not null
  then
    raise exception 'Community projection did not apply field audiences';
  end if;

  if not exists (
    select 1 from public.profile_visibility_audit
    where practitioner_id = '23010000-0000-4000-8000-000000000002'
      and actor_user_id = '13010000-0000-4000-8000-000000000002'
      and previous_settings ->> 'directory' = 'private'
      and resulting_settings ->> 'directory' = 'public'
  ) then
    raise exception 'Member visibility update was not audited';
  end if;

  begin
    perform public.list_community_practitioner_profiles(
      '13010000-0000-4000-8000-000000000001'
    );
    raise exception 'Caller changed the community actor identifier';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.users
set is_deleted = true
where id = '13010000-0000-4000-8000-000000000004';

set local role authenticated;
select set_config('request.jwt.claim.sub', '13010000-0000-4000-8000-000000000004', true);
do $$
begin
  begin
    perform public.list_community_practitioner_profiles(
      '13010000-0000-4000-8000-000000000004'
    );
    raise exception 'Deleted member retained community directory access';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '13010000-0000-4000-8000-000000000003', true);
do $$
begin
  begin
    perform public.update_practitioner_public_visibility(
      '13010000-0000-4000-8000-000000000003',
      '13010000-0000-4000-8000-000000000002',
      true
    );
    raise exception 'Administrator opted another member into public visibility';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select public.update_practitioner_public_visibility(
  '13010000-0000-4000-8000-000000000003',
  '13010000-0000-4000-8000-000000000002',
  false
);

do $$
begin
  if exists (
    select 1 from public.list_public_practitioner_profiles()
    where id = '23010000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Administrative directory removal did not take effect immediately';
  end if;

  if not exists (
    select 1 from public.profile_visibility_audit
    where practitioner_id = '23010000-0000-4000-8000-000000000002'
      and actor_user_id = '13010000-0000-4000-8000-000000000003'
      and resulting_settings ->> 'directory' = 'private'
  ) then
    raise exception 'Administrative directory removal was not audited';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
do $$
begin
  begin
    perform public.list_community_practitioner_profiles(null);
    raise exception 'Anonymous caller read the community directory';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
