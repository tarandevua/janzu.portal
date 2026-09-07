-- TASK-601: commit enum addition before the workflow migration.
alter type public.notification_type add value if not exists 'historical_claim_updated';
