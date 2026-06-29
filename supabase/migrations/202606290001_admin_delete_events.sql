create policy "Admins can delete events"
on public.events
for delete
to authenticated
using (public.user_has_role(auth.uid(), 'admin'));
