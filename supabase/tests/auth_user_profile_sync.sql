\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values (
  '21000000-0000-4000-8000-000000000001',
  'auth-profile-sync@example.test',
  '{"full_name":"Auth Profile Sync","preferred_locale":"es"}'::jsonb
);

do $$
declare
  portal_user public.users;
  apprentice_role_count integer;
begin
  select * into portal_user
  from public.users
  where id = '21000000-0000-4000-8000-000000000001';

  if portal_user.id is null
    or portal_user.email <> 'auth-profile-sync@example.test'
    or portal_user.full_name <> 'Auth Profile Sync'
    or portal_user.official_full_name <> 'Auth Profile Sync'
    or portal_user.preferred_locale <> 'es'
  then
    raise exception 'Auth user trigger did not create the expected portal user';
  end if;

  select count(*)::integer into apprentice_role_count
  from public.user_roles
  join public.roles on roles.id = user_roles.role_id
  where user_roles.user_id = '21000000-0000-4000-8000-000000000001'
    and roles.name = 'apprentice';

  if apprentice_role_count <> 1 then
    raise exception 'Auth user trigger did not assign exactly one apprentice role';
  end if;
end;
$$;

rollback;

