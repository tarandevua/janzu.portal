-- TASK-502: reclaim abandoned sends while Brevo's idempotency key is still active.

create or replace function public.claim_transactional_email_deliveries(batch_size integer default 10)
returns setof public.transactional_email_deliveries
language plpgsql security definer set search_path = public
as $$
declare claimed public.transactional_email_deliveries;
begin
  if batch_size < 1 or batch_size > 50 then
    raise exception 'Batch size must be between 1 and 50' using errcode = '22023';
  end if;

  for claimed in
    select * from public.transactional_email_deliveries
    where attempt_count < 6 and (
      status = 'pending'
      or (status = 'retry_scheduled' and next_attempt_at <= now())
      or (status = 'sending' and last_attempt_at <= now() - interval '10 minutes')
    )
    order by created_at
    limit batch_size for update skip locked
  loop
    update public.transactional_email_deliveries set
      status = 'sending', attempt_count = attempt_count + 1,
      last_attempt_at = now(), next_attempt_at = null,
      provider_message_id = null, failure_code = null, failure_message = null
    where id = claimed.id returning * into claimed;

    insert into public.transactional_email_attempts (
      delivery_id, attempt_number, outcome, started_at
    ) values (claimed.id, claimed.attempt_count, 'sending', claimed.last_attempt_at)
    on conflict (delivery_id, attempt_number) do update
      set outcome = 'sending', started_at = excluded.started_at, completed_at = null,
          provider_message_id = null, failure_code = null;
    return next claimed;
  end loop;
end;
$$;
