# TASK-404: 50-session assessment workflow

## Outcome

Verified Level 2 plus 50 cumulative DEC-02 sessions creates one immutable milestone attainment. The source transaction fans out one localized in-app notification and required email to the Trainee, active Instructor, and current Administrators. Database uniqueness prevents recalculation or retry from duplicating attainment.

## Authorization

The Trainee requests readiness. Only the active assigned Instructor may approve or reject it. An Assessor is an Instructor with a separate, audited Administrator-managed designation. Only an Administrator assigns a currently designated Assessor, and the database rejects the Trainee's active Instructor. Only the assigned, still-authorized Assessor schedules and records an outcome. Only the active Instructor verifies remediation.

All workflow mutations compare the supplied actor to `auth.uid()` inside security-definer RPCs. Direct authenticated writes are revoked. RLS limits private requests, assessment notes, next actions, and audit records to the Trainee, current active Instructor, assigned Assessor, and Administrators. Former Instructors and unrelated members lose access.

## Data and state

`assessment_readiness_requests` preserves readiness decisions. `assessments` stores one numbered row per attempt with its Assessor, schedule, outcome, private notes, explicit next action, and remediation verification. `previous_assessment_id` links reassessments without overwriting history. Audit tables preserve designation, readiness, and assessment transitions.

Failed, incomplete, and revision-required outcomes cannot commit without an explicit next action. A passed outcome advances only to `assessment_passed`; TASK-405 owns certification approval and issuance.

## Delivery and privacy

Milestone and assessment event metadata contains only safe identifiers, state codes, timestamps, and safe next-action codes. Assessment notes, decision reasons, evidence, Participant data, and free-text remediation instructions remain in the authenticated portal. Email destinations identify the exact journey, Trainee, readiness record, or assessment and do not grant access.

## Migration and remediation

Apply `202608280002_add_task_404_notification_types.sql` before `202608280003_task_404_50_session_assessment_workflow.sql`. The workflow migration is additive and corrects the certification projection to the accepted 60-minute minimum before recalculating existing practitioners. If source data is wrong, correct the training/session/assignment record and recalculate; do not delete milestone, decision, assessment, or audit history.
