alter table public.locations
add column if not exists temperature_value numeric(5, 2),
add column if not exists temperature_unit text;

alter table public.locations
drop constraint if exists locations_temperature_unit_check;

alter table public.locations
add constraint locations_temperature_unit_check
check (
  temperature_unit is null
  or temperature_unit in ('celsius', 'fahrenheit')
);
