\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('13030000-0000-4000-8000-000000000001', 'owner-303@example.test', '{"full_name":"Owner 303"}'::jsonb),
  ('13030000-0000-4000-8000-000000000002', 'member-303@example.test', '{"full_name":"Member 303"}'::jsonb);
insert into public.users (id, email, full_name) values
  ('13030000-0000-4000-8000-000000000001', 'owner-303@example.test', 'Owner 303'),
  ('13030000-0000-4000-8000-000000000002', 'member-303@example.test', 'Member 303');
insert into public.user_roles (user_id, role_id)
select target.user_id, roles.id from (values
  ('13030000-0000-4000-8000-000000000001'::uuid, 'facilitator'::public.app_role),
  ('13030000-0000-4000-8000-000000000002'::uuid, 'apprentice'::public.app_role)
) target(user_id, role_name) join public.roles on roles.name = target.role_name;
insert into public.practitioners (id, user_id, country, city) values
  ('23030000-0000-4000-8000-000000000001', '13030000-0000-4000-8000-000000000001', 'Moldova', 'Chisinau');
insert into public.practitioner_locations
  (id, practitioner_id, latitude, longitude, city, country, sort_order) values
  ('33030000-0000-4000-8000-000000000001', '23030000-0000-4000-8000-000000000001',
   47.0105, 28.8638, 'Chisinau', 'Moldova', 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', '13030000-0000-4000-8000-000000000001', true);
select public.update_my_profile_visibility(
  '13030000-0000-4000-8000-000000000001',
  'public', 'public', 'private', 'private', 'private', 'public', 'private', 'private'
);
select public.update_my_whatsapp_consent(
  '13030000-0000-4000-8000-000000000001', '+37360123456', 'community', true, '2026-08-27.v1'
);

do $$
begin
  begin
    perform public.update_my_whatsapp_consent(
      '13030000-0000-4000-8000-000000000001', '+37360123456', 'public', true, '2026-08-27.v1'
    );
    raise exception 'WhatsApp was allowed to become public';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '13030000-0000-4000-8000-000000000002', true);
do $$
declare profile_number text; marker_number text;
begin
  select whatsapp_number into profile_number
  from public.list_community_practitioner_profiles('13030000-0000-4000-8000-000000000002')
  where id = '23030000-0000-4000-8000-000000000001';
  select whatsapp_number into marker_number
  from public.list_community_practitioner_map_markers('13030000-0000-4000-8000-000000000002')
  where profile_id = '23030000-0000-4000-8000-000000000001';
  if profile_number <> '+37360123456' or marker_number <> '+37360123456' then
    raise exception 'Affirmatively consented WhatsApp was not projected to the community';
  end if;
  if (select to_jsonb(profile) ? 'whatsapp_number'
      from public.list_public_practitioner_profiles() profile
      where id = '23030000-0000-4000-8000-000000000001') then
    raise exception 'Public profile contract contains WhatsApp';
  end if;
  if (select to_jsonb(marker) ? 'whatsapp_number'
      from public.list_public_practitioner_map_markers() marker
      where profile_id = '23030000-0000-4000-8000-000000000001') then
    raise exception 'Public map contract contains WhatsApp';
  end if;
  begin
    perform public.list_community_practitioner_profiles('13030000-0000-4000-8000-000000000001');
    raise exception 'Community actor spoofing was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '13030000-0000-4000-8000-000000000001', true);
select public.update_my_whatsapp_consent(
  '13030000-0000-4000-8000-000000000001', null, 'private', false, '2026-08-27.v1'
);
select set_config('request.jwt.claim.sub', '13030000-0000-4000-8000-000000000002', true);
do $$
begin
  if exists (select 1 from public.list_community_practitioner_profiles(
    '13030000-0000-4000-8000-000000000002') where whatsapp_number is not null)
    or exists (select 1 from public.list_community_practitioner_map_markers(
    '13030000-0000-4000-8000-000000000002') where whatsapp_number is not null)
  then raise exception 'Revoked WhatsApp remained in a community response'; end if;
  if not exists (select 1 from public.whatsapp_consent_audit
    where practitioner_id = '23030000-0000-4000-8000-000000000001'
      and action = 'revoked' and policy_version = '2026-08-27.v1')
  then raise exception 'Revocation audit was not recorded'; end if;
end;
$$;

rollback;
