alter table public.locations
add column if not exists is_deleted boolean not null default false;

create index if not exists locations_is_deleted_idx
on public.locations(is_deleted);

drop policy if exists "Approved locations are public" on public.locations;
create policy "Approved locations are public"
on public.locations
for select
to anon, authenticated
using (status = 'approved' and is_deleted = false);

drop policy if exists "Approved location media is public" on public.location_media;
create policy "Approved location media is public"
on public.location_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.locations
    where locations.id = location_media.location_id
      and locations.status = 'approved'
      and locations.is_deleted = false
  )
);

drop policy if exists "Approved location reviews are public" on public.location_reviews;
drop policy if exists "Community can read approved location reviews" on public.location_reviews;
create policy "Approved location reviews are public"
on public.location_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.locations
    where locations.id = location_reviews.location_id
      and locations.status = 'approved'
      and locations.is_deleted = false
  )
);

drop policy if exists "Reviewers can update their own location reviews" on public.location_reviews;
create policy "Reviewers can update their own location reviews"
on public.location_reviews
for update
to authenticated
using (reviewer_id = auth.uid())
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.locations
    where locations.id = location_reviews.location_id
      and locations.status = 'approved'
      and locations.is_deleted = false
  )
);

drop policy if exists "Authenticated users can review approved locations" on public.location_reviews;
create policy "Authenticated users can review approved locations"
on public.location_reviews
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.locations
    where locations.id = location_reviews.location_id
      and locations.status = 'approved'
      and locations.is_deleted = false
  )
);

drop policy if exists "Community can read helpful review votes" on public.location_review_helpful_votes;
create policy "Community can read helpful review votes"
on public.location_review_helpful_votes
for select
to authenticated
using (
  exists (
    select 1
    from public.location_reviews
    join public.locations
      on locations.id = location_reviews.location_id
    where location_reviews.id = location_review_helpful_votes.review_id
      and locations.status = 'approved'
      and locations.is_deleted = false
  )
);

drop policy if exists "Community can mark reviews helpful" on public.location_review_helpful_votes;
create policy "Community can mark reviews helpful"
on public.location_review_helpful_votes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.location_reviews
    join public.locations
      on locations.id = location_reviews.location_id
    where location_reviews.id = location_review_helpful_votes.review_id
      and location_reviews.reviewer_id <> auth.uid()
      and locations.status = 'approved'
      and locations.is_deleted = false
  )
);

create or replace function public.list_location_community_reviews(actor_user_id uuid)
returns table (
  review_id uuid,
  location_id uuid,
  reviewer_id uuid,
  rating integer,
  review_text text,
  created_at timestamptz,
  updated_at timestamptz,
  helpful_count bigint,
  viewer_marked_helpful boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    location_reviews.id as review_id,
    location_reviews.location_id,
    location_reviews.reviewer_id,
    location_reviews.rating,
    location_reviews.review_text,
    location_reviews.created_at,
    location_reviews.updated_at,
    count(location_review_helpful_votes.id) as helpful_count,
    exists (
      select 1
      from public.location_review_helpful_votes as viewer_votes
      where viewer_votes.review_id = location_reviews.id
        and viewer_votes.user_id = actor_user_id
    ) as viewer_marked_helpful
  from public.location_reviews
  join public.locations
    on locations.id = location_reviews.location_id
  left join public.location_review_helpful_votes
    on location_review_helpful_votes.review_id = location_reviews.id
  where actor_user_id is not null
    and exists (select 1 from public.users where users.id = actor_user_id)
    and locations.status = 'approved'
    and locations.is_deleted = false
  group by location_reviews.id;
$$;

create or replace function public.soft_delete_location(
  target_location_id uuid,
  actor_user_id uuid
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_location public.locations;
begin
  if not (
    public.user_has_role(actor_user_id, 'admin')
    or exists (
      select 1
      from public.locations
      join public.practitioners
        on practitioners.id = locations.submitted_by
      where locations.id = target_location_id
        and practitioners.user_id = actor_user_id
    )
  ) then
    raise exception 'Only the submitter or an admin can delete this location';
  end if;

  update public.locations
  set is_deleted = true,
      updated_at = now()
  where id = target_location_id
  returning * into deleted_location;

  if deleted_location.id is null then
    raise exception 'Location not found';
  end if;

  return deleted_location;
end;
$$;

create or replace function public.restore_deleted_location(
  target_location_id uuid,
  actor_user_id uuid
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  restored_location public.locations;
begin
  if not public.user_has_role(actor_user_id, 'admin') then
    raise exception 'Only admins can restore deleted locations';
  end if;

  update public.locations
  set is_deleted = false,
      updated_at = now()
  where id = target_location_id
  returning * into restored_location;

  if restored_location.id is null then
    raise exception 'Location not found';
  end if;

  return restored_location;
end;
$$;

grant execute on function public.soft_delete_location(uuid, uuid) to authenticated;
grant execute on function public.restore_deleted_location(uuid, uuid) to authenticated;
grant execute on function public.list_location_community_reviews(uuid) to authenticated;
