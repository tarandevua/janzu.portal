-- Add notification enum values in a separate committed migration before use.

alter type public.notification_type add value if not exists 'training_history_submitted';
alter type public.notification_type add value if not exists 'training_history_corrected';
