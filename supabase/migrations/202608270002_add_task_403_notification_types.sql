-- TASK-403: enum values must commit before the workflow migration uses them.

alter type public.notification_type add value if not exists 'certification_milestone_25_reached';
alter type public.notification_type add value if not exists 'level_2_readiness_requested';
alter type public.notification_type add value if not exists 'level_2_readiness_decided';
