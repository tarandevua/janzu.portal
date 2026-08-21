drop function if exists public.list_user_role_management(
  uuid,
  integer,
  integer,
  text,
  public.app_role,
  text
);

create function public.list_user_role_management(
  actor_user_id uuid,
  page_number integer default 1,
  page_size integer default 10,
  search_query text default null,
  role_filter public.app_role default null,
  profile_filter text default null
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  can_resend_invite boolean,
  roles public.app_role[],
  practitioner_id uuid,
  practitioner_is_public boolean,
  practitioner_country text,
  practitioner_city text,
  practitioner_languages text[],
  clients_count integer,
  sessions_count integer,
  validated_sessions_count integer,
  session_requests_count integer,
  submitted_locations_count integer,
  approved_locations_count integer,
  event_rsvps_count integer,
  total_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  return query
  select
    managed.user_id,
    managed.email,
    managed.full_name,
    managed.created_at,
    portal_user.activated_at is null and auth_user.last_sign_in_at is null,
    managed.roles,
    managed.practitioner_id,
    managed.practitioner_is_public,
    managed.practitioner_country,
    managed.practitioner_city,
    managed.practitioner_languages,
    managed.clients_count,
    managed.sessions_count,
    managed.validated_sessions_count,
    managed.session_requests_count,
    managed.submitted_locations_count,
    managed.approved_locations_count,
    managed.event_rsvps_count,
    managed.total_count
  from public.list_user_role_management_unbound(
    actor_user_id,
    page_number,
    page_size,
    search_query,
    role_filter,
    profile_filter
  ) managed
  join public.users portal_user on portal_user.id = managed.user_id
  join auth.users auth_user on auth_user.id = managed.user_id;
end;
$$;

revoke all on function public.list_user_role_management(
  uuid, integer, integer, text, public.app_role, text
) from public, anon;

grant execute on function public.list_user_role_management(
  uuid, integer, integer, text, public.app_role, text
) to authenticated;
