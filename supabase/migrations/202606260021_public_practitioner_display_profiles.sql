create or replace function public.list_public_practitioner_profiles()
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[],
  website text,
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
    coalesce(nullif(users.full_name, ''), 'Janzu Practitioner') as display_name,
    practitioners.bio,
    practitioners.country,
    practitioners.city,
    practitioners.latitude,
    practitioners.longitude,
    practitioners.languages,
    practitioners.website,
    practitioners.profile_image_url,
    practitioners.is_public,
    practitioners.created_at,
    practitioners.updated_at
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.is_public = true
  order by practitioners.updated_at desc
  limit 50;
$$;

create or replace function public.get_public_practitioner_profile(target_profile_id uuid)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[],
  website text,
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
    coalesce(nullif(users.full_name, ''), 'Janzu Practitioner') as display_name,
    practitioners.bio,
    practitioners.country,
    practitioners.city,
    practitioners.latitude,
    practitioners.longitude,
    practitioners.languages,
    practitioners.website,
    practitioners.profile_image_url,
    practitioners.is_public,
    practitioners.created_at,
    practitioners.updated_at
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.id = target_profile_id
    and practitioners.is_public = true
  limit 1;
$$;

grant execute on function public.list_public_practitioner_profiles() to anon, authenticated;
grant execute on function public.get_public_practitioner_profile(uuid) to anon, authenticated;
