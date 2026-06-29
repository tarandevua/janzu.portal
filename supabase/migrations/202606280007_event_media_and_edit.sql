create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  storage_key text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index event_media_event_id_idx on public.event_media(event_id);
create index event_media_sort_order_idx on public.event_media(event_id, sort_order);

alter table public.event_media enable row level security;

create policy "Published event media is public"
on public.event_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_media.event_id
      and events.status = 'published'
  )
  or public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);

create policy "Event managers can manage event media"
on public.event_media
for all
to authenticated
using (
  public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
)
with check (
  public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);
