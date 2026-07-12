alter table public.clients
add column if not exists country text,
add column if not exists city text;
