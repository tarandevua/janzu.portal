-- Enum values must be committed before later migrations can use them.
alter type public.app_role add value if not exists 'instructor';

alter type public.notification_type add value if not exists 'supervision_requested';
alter type public.notification_type add value if not exists 'supervision_accepted';
alter type public.notification_type add value if not exists 'supervision_declined';
alter type public.notification_type add value if not exists 'supervision_ended';
alter type public.notification_type add value if not exists 'training_history_reviewed';
