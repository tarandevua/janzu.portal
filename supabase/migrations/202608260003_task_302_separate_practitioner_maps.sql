-- TASK-302: expose separate, least-privilege public and authenticated-community
-- practitioner map projections. Stored coordinates and location notes remain
-- private; map coordinates are deterministic 0.1-degree grid-cell centers.

create function public.list_public_practitioner_map_markers()
returns table (
  marker_id uuid,
  profile_id uuid,
  public_group text,
  display_name text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  profile_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    locations.id,
    practitioners.id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      else 'instructor'
    end,
    case when practitioners.display_name_visibility = 'public'
      then coalesce(nullif(users.full_name, ''), 'Janzu member')
      else 'Janzu member'
    end,
    coalesce(locations.city, practitioners.city),
    coalesce(locations.country, practitioners.country),
    round(locations.latitude::numeric, 1)::double precision,
    round(locations.longitude::numeric, 1)::double precision,
    case when practitioners.profile_image_visibility = 'public'
      then practitioners.profile_image_url
    end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  join public.practitioner_locations locations
    on locations.practitioner_id = practitioners.id
  where practitioners.directory_visibility = 'public'
    and practitioners.location_visibility = 'public'
    and users.is_deleted = false
    and (
      public.user_has_role(practitioners.user_id, 'facilitator')
      or public.user_has_role(practitioners.user_id, 'instructor')
    )
  order by practitioners.updated_at desc, locations.sort_order, locations.id
  limit 200;
$$;

create function public.list_community_practitioner_map_markers(actor_user_id uuid)
returns table (
  marker_id uuid,
  profile_id uuid,
  public_group text,
  display_name text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  profile_image_url text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null
    or actor_user_id is distinct from auth.uid()
    or not exists (
      select 1
      from public.users
      join public.user_roles on user_roles.user_id = users.id
      where users.id = actor_user_id
        and users.is_deleted = false
    )
  then
    raise exception 'Community maps require an active authenticated member'
      using errcode = '42501';
  end if;

  return query
  select
    locations.id,
    practitioners.id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant'
    end,
    case when practitioners.display_name_visibility in ('community', 'public')
      then coalesce(nullif(users.full_name, ''), 'Janzu member')
      else 'Janzu member'
    end,
    coalesce(locations.city, practitioners.city),
    coalesce(locations.country, practitioners.country),
    round(locations.latitude::numeric, 1)::double precision,
    round(locations.longitude::numeric, 1)::double precision,
    case when practitioners.profile_image_visibility in ('community', 'public')
      then practitioners.profile_image_url
    end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  join public.practitioner_locations locations
    on locations.practitioner_id = practitioners.id
  where practitioners.directory_visibility in ('community', 'public')
    and practitioners.location_visibility in ('community', 'public')
    and users.is_deleted = false
    and (
      public.user_has_role(practitioners.user_id, 'facilitator')
      or public.user_has_role(practitioners.user_id, 'instructor')
      or public.user_has_role(practitioners.user_id, 'apprentice')
      or public.user_has_role(practitioners.user_id, 'practitioner')
      or exists (
        select 1
        from public.certification_progress
        where certification_progress.practitioner_id = practitioners.id
          and certification_progress.status = 'approved'
      )
    )
  order by practitioners.updated_at desc, locations.sort_order, locations.id
  limit 400;
end;
$$;

create function public.preview_my_practitioner_map_markers(
  actor_user_id uuid,
  target_audience public.profile_visibility
)
returns table (
  marker_id uuid,
  profile_id uuid,
  public_group text,
  display_name text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  profile_image_url text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Map previews are limited to the authenticated profile owner'
      using errcode = '42501';
  end if;

  if target_audience not in ('community', 'public') then
    raise exception 'Map preview audience must be community or public'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.users
    join public.user_roles on user_roles.user_id = users.id
    where users.id = actor_user_id
      and users.is_deleted = false
  ) then
    raise exception 'Map previews require an active authenticated member'
      using errcode = '42501';
  end if;

  return query
  select
    locations.id,
    practitioners.id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant'
    end,
    case
      when target_audience = 'public' and practitioners.display_name_visibility = 'public'
        then coalesce(nullif(users.full_name, ''), 'Janzu member')
      when target_audience = 'community'
        and practitioners.display_name_visibility in ('community', 'public')
        then coalesce(nullif(users.full_name, ''), 'Janzu member')
      else 'Janzu member'
    end,
    coalesce(locations.city, practitioners.city),
    coalesce(locations.country, practitioners.country),
    round(locations.latitude::numeric, 1)::double precision,
    round(locations.longitude::numeric, 1)::double precision,
    case
      when target_audience = 'public' and practitioners.profile_image_visibility = 'public'
        then practitioners.profile_image_url
      when target_audience = 'community'
        and practitioners.profile_image_visibility in ('community', 'public')
        then practitioners.profile_image_url
    end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  join public.practitioner_locations locations
    on locations.practitioner_id = practitioners.id
  where practitioners.user_id = actor_user_id
    and (
      (
        target_audience = 'public'
        and practitioners.directory_visibility = 'public'
        and practitioners.location_visibility = 'public'
        and (
          public.user_has_role(practitioners.user_id, 'facilitator')
          or public.user_has_role(practitioners.user_id, 'instructor')
        )
      )
      or (
        target_audience = 'community'
        and practitioners.directory_visibility in ('community', 'public')
        and practitioners.location_visibility in ('community', 'public')
        and (
          public.user_has_role(practitioners.user_id, 'facilitator')
          or public.user_has_role(practitioners.user_id, 'instructor')
          or public.user_has_role(practitioners.user_id, 'apprentice')
          or public.user_has_role(practitioners.user_id, 'practitioner')
          or exists (
            select 1
            from public.certification_progress
            where certification_progress.practitioner_id = practitioners.id
              and certification_progress.status = 'approved'
          )
        )
      )
    )
  order by locations.sort_order, locations.id;
end;
$$;

revoke all on function public.list_public_practitioner_map_markers() from public;
revoke all on function public.list_community_practitioner_map_markers(uuid) from public;
revoke all on function public.preview_my_practitioner_map_markers(
  uuid, public.profile_visibility
) from public;

grant execute on function public.list_public_practitioner_map_markers() to anon, authenticated;
grant execute on function public.list_community_practitioner_map_markers(uuid) to authenticated;
grant execute on function public.preview_my_practitioner_map_markers(
  uuid, public.profile_visibility
) to authenticated;
