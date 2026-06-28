drop function if exists public.list_user_role_management(uuid);

create or replace function public.list_user_role_management(actor_user_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
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
  event_rsvps_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can manage users';
  end if;

  return query
  select
    users.id as user_id,
    users.email,
    users.full_name,
    users.created_at,
    coalesce(
      array_agg(distinct roles.name order by roles.name) filter (where roles.name is not null),
      '{}'::public.app_role[]
    ) as roles,
    practitioners.id as practitioner_id,
    practitioners.is_public as practitioner_is_public,
    practitioners.country as practitioner_country,
    practitioners.city as practitioner_city,
    coalesce(practitioners.languages, '{}'::text[]) as practitioner_languages,
    coalesce(count(distinct clients.id), 0)::integer as clients_count,
    coalesce(count(distinct sessions.id), 0)::integer as sessions_count,
    coalesce(count(distinct sessions.id) filter (where sessions.is_validated = true), 0)::integer as validated_sessions_count,
    coalesce(count(distinct session_requests.id), 0)::integer as session_requests_count,
    coalesce(count(distinct locations.id), 0)::integer as submitted_locations_count,
    coalesce(count(distinct locations.id) filter (where locations.status = 'approved'), 0)::integer as approved_locations_count,
    coalesce(count(distinct event_rsvps.id), 0)::integer as event_rsvps_count
  from public.users
  left join public.user_roles on user_roles.user_id = users.id
  left join public.roles on roles.id = user_roles.role_id
  left join public.practitioners on practitioners.user_id = users.id
  left join public.clients on clients.practitioner_id = practitioners.id
  left join public.sessions on sessions.practitioner_id = practitioners.id
  left join public.session_requests on session_requests.practitioner_id = practitioners.id
  left join public.locations on locations.submitted_by = practitioners.id
  left join public.event_rsvps on event_rsvps.user_id = users.id
  group by
    users.id,
    users.email,
    users.full_name,
    users.created_at,
    practitioners.id,
    practitioners.is_public,
    practitioners.country,
    practitioners.city,
    practitioners.languages
  order by users.created_at desc;
end;
$$;
