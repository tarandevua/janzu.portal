alter table public.practitioner_locations
add column if not exists city text,
add column if not exists country text;
