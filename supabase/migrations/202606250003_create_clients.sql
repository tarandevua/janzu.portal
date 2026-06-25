create table public.clients (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_practitioner_id_idx on public.clients(practitioner_id);
create index clients_email_idx on public.clients(email);

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "Practitioners can read their own clients"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = clients.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can create their own clients"
on public.clients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = clients.practitioner_id
      and practitioners.user_id = auth.uid()
  )
);

create policy "Practitioners can update their own clients"
on public.clients
for update
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = clients.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = clients.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can delete their own clients"
on public.clients
for delete
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = clients.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);
