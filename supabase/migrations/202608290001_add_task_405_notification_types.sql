-- TASK-405: enum values must commit before the certificate workflow uses them.

alter type public.notification_type add value if not exists 'certificate_issued';
alter type public.notification_type add value if not exists 'certificate_replaced';
alter type public.notification_type add value if not exists 'certificate_revoked';
alter type public.notification_type add value if not exists 'certificate_replacement_requested';
alter type public.notification_type add value if not exists 'certificate_replacement_decided';
alter type public.notification_type add value if not exists 'certificate_appeal_submitted';
alter type public.notification_type add value if not exists 'certificate_appeal_decided';
alter type public.notification_type add value if not exists 'certification_reinstated';
alter type public.notification_type add value if not exists 'role_assigned';
alter type public.notification_type add value if not exists 'role_removed';
