create unique index if not exists location_reviews_location_reviewer_uidx
on public.location_reviews(location_id, reviewer_id);

create table if not exists public.location_review_helpful_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.location_reviews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create index if not exists location_review_helpful_votes_review_id_idx
on public.location_review_helpful_votes(review_id);

create index if not exists location_review_helpful_votes_user_id_idx
on public.location_review_helpful_votes(user_id);

alter table public.location_review_helpful_votes enable row level security;

drop policy if exists "Approved location reviews are public" on public.location_reviews;
create policy "Community can read approved location reviews"
on public.location_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.locations
    where locations.id = location_reviews.location_id
      and locations.status = 'approved'
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
  )
);

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
  )
);

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
  )
);

create policy "Community can remove own helpful votes"
on public.location_review_helpful_votes
for delete
to authenticated
using (user_id = auth.uid());

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
  group by location_reviews.id;
$$;

grant execute on function public.list_location_community_reviews(uuid) to authenticated;
