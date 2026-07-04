alter table public.users
add column if not exists is_deleted boolean not null default false;

create index if not exists users_is_deleted_idx
on public.users(is_deleted);

drop function if exists public.list_user_role_management(uuid, integer, integer, text, public.app_role, text);

create or replace function public.list_user_role_management(
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
declare
  safe_page integer := greatest(coalesce(page_number, 1), 1);
  safe_page_size integer := least(greatest(coalesce(page_size, 10), 1), 100);
  normalized_search text := nullif(trim(coalesce(search_query, '')), '');
  normalized_profile_filter text := nullif(trim(coalesce(profile_filter, '')), '');
begin
  if not (
    public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can manage users';
  end if;

  return query
  with managed_users as (
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
    where users.is_deleted = false
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
  ),
  filtered_users as (
    select *
    from managed_users
    where (
      normalized_search is null
      or managed_users.email ilike '%' || normalized_search || '%'
      or managed_users.full_name ilike '%' || normalized_search || '%'
    )
    and (
      role_filter is null
      or role_filter = any(managed_users.roles)
    )
    and (
      normalized_profile_filter is null
      or (normalized_profile_filter = 'with_profile' and managed_users.practitioner_id is not null)
      or (normalized_profile_filter = 'without_profile' and managed_users.practitioner_id is null)
      or (normalized_profile_filter = 'public_profile' and managed_users.practitioner_is_public = true)
      or (normalized_profile_filter = 'private_profile' and managed_users.practitioner_id is not null and managed_users.practitioner_is_public = false)
    )
  )
  select
    filtered_users.*,
    count(*) over ()::integer as total_count
  from filtered_users
  order by filtered_users.created_at desc
  limit safe_page_size
  offset (safe_page - 1) * safe_page_size;
end;
$$;
