\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('13020000-0000-4000-8000-000000000001', 'task-302-trainee@example.test', '{"full_name":"Trainee 302"}'::jsonb),
  ('13020000-0000-4000-8000-000000000002', 'task-302-facilitator@example.test', '{"full_name":"Facilitator 302"}'::jsonb),
  ('13020000-0000-4000-8000-000000000003', 'task-302-outsider@example.test', '{"full_name":"Outsider 302"}'::jsonb);

insert into public.users (id, email, full_name, official_full_name)
values
  ('13020000-0000-4000-8000-000000000001', 'task-302-trainee@example.test', 'Trainee 302', 'Private Trainee 302'),
  ('13020000-0000-4000-8000-000000000002', 'task-302-facilitator@example.test', 'Facilitator 302', 'Private Facilitator 302'),
  ('13020000-0000-4000-8000-000000000003', 'task-302-outsider@example.test', 'Outsider 302', 'Private Outsider 302')
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  official_full_name = excluded.official_full_name;

insert into public.user_roles (user_id, role_id)
select target.user_id, roles.id
from (values
  ('13020000-0000-4000-8000-000000000001'::uuid, 'apprentice'::public.app_role),
  ('13020000-0000-4000-8000-000000000002'::uuid, 'facilitator'::public.app_role)
) target(user_id, role_name)
join public.roles on roles.name = target.role_name
on conflict do nothing;

insert into public.practitioners (
  id, user_id, country, city, latitude, longitude, profile_image_url
) values
  (
    '23020000-0000-4000-8000-000000000001',
    '13020000-0000-4000-8000-000000000001',
    'Moldova', 'Chisinau', 47.0105, 28.8638, 'https://example.test/trainee.jpg'
  ),
  (
    '23020000-0000-4000-8000-000000000002',
    '13020000-0000-4000-8000-000000000002',
    'Spain', 'Barcelona', 41.3874, 2.1686, 'https://example.test/facilitator.jpg'
  );

insert into public.practitioner_locations (
  id, practitioner_id, latitude, longitude, city, country, note, sort_order
) values
  (
    '33020000-0000-4000-8000-000000000001',
    '23020000-0000-4000-8000-000000000001',
    47.0105, 28.8638, 'Chisinau', 'Moldova', 'Private trainee entrance', 0
  ),
  (
    '33020000-0000-4000-8000-000000000002',
    '23020000-0000-4000-8000-000000000002',
    41.3874, 2.1686, 'Barcelona', 'Spain', 'Private facilitator entrance', 0
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '13020000-0000-4000-8000-000000000001', true);
select public.update_my_profile_visibility(
  '13020000-0000-4000-8000-000000000001',
  'community', 'community', 'community', 'private', 'private', 'community', 'private', 'private'
);

select set_config('request.jwt.claim.sub', '13020000-0000-4000-8000-000000000002', true);
select public.update_my_profile_visibility(
  '13020000-0000-4000-8000-000000000002',
  'public', 'public', 'community', 'private', 'private', 'public', 'private', 'private'
);

do $$
declare
  public_marker jsonb;
  community_trainee record;
begin
  select to_jsonb(marker) into public_marker
  from public.list_public_practitioner_map_markers() marker
  where profile_id = '23020000-0000-4000-8000-000000000002';

  if public_marker ->> 'public_group' <> 'facilitator'
    or public_marker ->> 'display_name' <> 'Facilitator 302'
    or (public_marker ->> 'latitude')::double precision <> 41.4
    or (public_marker ->> 'longitude')::double precision <> 2.2
    or public_marker ->> 'profile_image_url' is not null
    or public_marker ?| array['user_id', 'note', 'exact_address', 'official_full_name']
  then
    raise exception 'Public marker leaked or misrepresented protected data: %', public_marker;
  end if;

  if exists (
    select 1 from public.list_public_practitioner_map_markers()
    where profile_id = '23020000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Trainee appeared on the anonymous public map';
  end if;

  select * into community_trainee
  from public.list_community_practitioner_map_markers(
    '13020000-0000-4000-8000-000000000002'
  )
  where profile_id = '23020000-0000-4000-8000-000000000001';

  if community_trainee.public_group <> 'apprentice'
    or community_trainee.display_name <> 'Trainee 302'
    or community_trainee.latitude <> 47.0
    or community_trainee.longitude <> 28.9
  then
    raise exception 'Community marker did not use verified role and approximate location';
  end if;

  begin
    perform public.list_community_practitioner_map_markers(
      '13020000-0000-4000-8000-000000000001'
    );
    raise exception 'Caller changed the community-map actor identifier';
  exception when insufficient_privilege then null;
  end;

  if not exists (
    select 1 from public.preview_my_practitioner_map_markers(
      '13020000-0000-4000-8000-000000000002', 'public'
    )
  ) then
    raise exception 'Profile owner could not preview their public map view';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;

do $$
begin
  if not exists (select 1 from public.list_public_practitioner_map_markers()) then
    raise exception 'Anonymous public map projection returned no approved professional';
  end if;

  begin
    perform public.list_community_practitioner_map_markers(null);
    raise exception 'Anonymous caller read the community map';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
