-- Authenticated community projection. Exact coordinates remain private.

create or replace function public.list_community_practitioner_profiles(actor_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Community profiles are limited to the authenticated user'
      using errcode = '42501';
  end if;

  return query
  select
    practitioners.id,
    practitioners.user_id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant'
    end,
    case when practitioners.display_name_visibility in ('community', 'public')
      then coalesce(nullif(users.full_name, ''), 'Janzu member') else 'Janzu member' end,
    case when practitioners.bio_visibility in ('community', 'public') then practitioners.bio end,
    case when practitioners.location_visibility in ('community', 'public') then practitioners.country end,
    case when practitioners.location_visibility in ('community', 'public') then practitioners.city end,
    null::double precision,
    null::double precision,
    case when practitioners.languages_visibility in ('community', 'public')
      then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility in ('community', 'public') then practitioners.website end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.instagram_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.facebook_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.youtube_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility in ('community', 'public') then practitioners.profile_image_url end,
    practitioners.directory_visibility = 'public',
    practitioners.created_at,
    practitioners.updated_at
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.directory_visibility in ('community', 'public')
    and users.is_deleted = false
  order by practitioners.updated_at desc
  limit 100;
end;
$$;

create or replace function public.get_public_practitioner_profile(target_profile_id uuid)
returns table (
  id uuid,
  user_id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    practitioners.id,
    practitioners.user_id,
    case when public.user_has_role(practitioners.user_id, 'facilitator')
      then 'facilitator' else 'instructor' end,
    case when practitioners.display_name_visibility = 'public'
      then coalesce(nullif(users.full_name, ''), 'Janzu member') else 'Janzu member' end,
    case when practitioners.bio_visibility = 'public' then practitioners.bio end,
    case when practitioners.location_visibility = 'public' then practitioners.country end,
    case when practitioners.location_visibility = 'public' then practitioners.city end,
    null::double precision,
    null::double precision,
    case when practitioners.languages_visibility = 'public' then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility = 'public' then practitioners.website end,
    case when practitioners.social_links_visibility = 'public' then practitioners.instagram_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.facebook_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.youtube_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility = 'public' then practitioners.profile_image_url end,
    true,
    practitioners.created_at,
    practitioners.updated_at
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.id = target_profile_id
    and practitioners.directory_visibility = 'public'
    and users.is_deleted = false
    and (
      public.user_has_role(practitioners.user_id, 'facilitator')
      or public.user_has_role(practitioners.user_id, 'instructor')
    )
  limit 1;
$$;

create or replace function public.current_verified_training_level(target_trainee_user_id uuid)
returns public.training_level
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  current_level public.training_level;
begin
  if auth.uid() is null or not (
    target_trainee_user_id = auth.uid()
    or public.user_has_role(auth.uid(), 'admin')
    or public.is_active_instructor_for(auth.uid(), target_trainee_user_id)
  ) then
    raise exception 'Training level access is not authorized' using errcode = '42501';
  end if;

  select level into current_level
  from public.training_history
  where trainee_user_id = target_trainee_user_id and status = 'verified'
  order by case level when 'level_2' then 2 else 1 end desc, verified_at desc
  limit 1;

  return current_level;
end;
$$;

grant execute on function public.list_community_practitioner_profiles(uuid) to authenticated;
