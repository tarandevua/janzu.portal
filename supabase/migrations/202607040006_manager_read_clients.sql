drop policy if exists "Managers can read clients for operations" on public.clients;
create policy "Managers can read clients for operations"
on public.clients
for select
to authenticated
using (public.user_has_role(auth.uid(), 'manager'));
