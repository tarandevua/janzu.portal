-- TASK-404: enum values must commit before the assessment workflow uses them.

alter type public.notification_type add value if not exists 'certification_milestone_50_reached';
alter type public.notification_type add value if not exists 'assessment_readiness_requested';
alter type public.notification_type add value if not exists 'assessment_readiness_decided';
alter type public.notification_type add value if not exists 'assessment_assigned';
alter type public.notification_type add value if not exists 'assessment_scheduled';
alter type public.notification_type add value if not exists 'assessment_outcome_recorded';
alter type public.notification_type add value if not exists 'assessment_remediation_verified';
