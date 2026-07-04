alter table public.practitioners
add column if not exists instagram_url text,
add column if not exists facebook_url text,
add column if not exists youtube_url text,
add column if not exists tiktok_url text;

drop function if exists public.get_public_practitioner_profile(uuid);
drop function if exists public.list_public_practitioner_profiles();

create or replace function public.list_public_practitioner_profiles()
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
    case
      when exists (
        select 1
        from public.user_roles
        join public.roles on roles.id = user_roles.role_id
        where user_roles.user_id = practitioners.user_id
          and roles.name = 'facilitator'
      ) then 'facilitator'
      when certification_progress.status = 'approved' then 'participant'
      else 'apprentice'
    end as public_group,
    coalesce(nullif(users.full_name, ''), 'Janzu Practitioner') as display_name,
    practitioners.bio,
    practitioners.country,
    practitioners.city,
    practitioners.latitude,
    practitioners.longitude,
    practitioners.languages,
    practitioners.website,
    practitioners.instagram_url,
    practitioners.facebook_url,
    practitioners.youtube_url,
    practitioners.tiktok_url,
    practitioners.profile_image_url,
    practitioners.is_public,
    practitioners.created_at,
    practitioners.updated_at
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  left join public.certification_progress
    on certification_progress.practitioner_id = practitioners.id
  where practitioners.is_public = true
  order by practitioners.updated_at desc
  limit 50;
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
    case
      when exists (
        select 1
        from public.user_roles
        join public.roles on roles.id = user_roles.role_id
        where user_roles.user_id = practitioners.user_id
          and roles.name = 'facilitator'
      ) then 'facilitator'
      when certification_progress.status = 'approved' then 'participant'
      else 'apprentice'
    end as public_group,
    coalesce(nullif(users.full_name, ''), 'Janzu Practitioner') as display_name,
    practitioners.bio,
    practitioners.country,
    practitioners.city,
    practitioners.latitude,
    practitioners.longitude,
    practitioners.languages,
    practitioners.website,
    practitioners.instagram_url,
    practitioners.facebook_url,
    practitioners.youtube_url,
    practitioners.tiktok_url,
    practitioners.profile_image_url,
    practitioners.is_public,
    practitioners.created_at,
    practitioners.updated_at
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  left join public.certification_progress
    on certification_progress.practitioner_id = practitioners.id
  where practitioners.id = target_profile_id
    and practitioners.is_public = true
  limit 1;
$$;

grant execute on function public.list_public_practitioner_profiles() to anon, authenticated;
grant execute on function public.get_public_practitioner_profile(uuid) to anon, authenticated;
