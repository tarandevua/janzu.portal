# Training history contract

Training history supports `level_1`, `level_2`, and `level_3`. Trainees submit claims containing cohort, location, dates, teaching Instructor, coursework status, evidence reference, and private notes.

Claims cannot affect certification until verified. Only the active assigned Instructor or an Administrator can review a claim. Instructor verification records the supervision assignment under which it occurred. Rejection requires a reason.

Submission, correction, and review snapshots are append-only in `training_history_audit`. Trainees, their active Instructor, and Administrators receive the corresponding RLS access; unrelated and anonymous users receive none.

## Read contract

`list_training_history(actor_user_id, target_trainee_user_id)` is the authorized server read model. It binds `actor_user_id` to `auth.uid()`, rejects unrelated and former Instructors, and returns the structured record plus a safe verifier display name. Evidence references and notes remain inside this private projection.

`current_verified_training_level(target_trainee_user_id)` derives the highest verified Level 1/Level 2/Level 3 record. It applies the same Trainee, active-Instructor, and Administrator boundary. Claimed and rejected records are excluded.

Both functions revoke `PUBLIC` and anonymous execution and are granted only to authenticated callers. The underlying tables keep RLS enabled.

`get_training_history_subject(actor_user_id, target_trainee_user_id)` applies the same boundary and returns the operational display name, active assignment context, and only a community/public profile image. A private image is returned as `null` so the UI uses initials.

## Reviewer notifications

Submission and correction audit events notify only the active assigned Instructor at event time. Notifications use `training_history_submitted` or `training_history_corrected`, contain no evidence, notes, correction reasons, contact data, or cohort details, and link to the exact authorized record with `traineeId` and `recordId`. The audit-event ID and recipient form a database-unique `event_key`.

Unassigned claims do not broadcast to all Administrators. They remain available through Administrator-authorized review surfaces. A former Instructor receives no future events and cannot open an old destination after the assignment ends.

## Historical-recognition boundary

This contract does not convert an ordinary training claim into DEC-04 historical recognition. Historical recognition requires independent senior and Administrator review, primary or corroborating evidence, conflict handling, and append-only decisions. The training-history form must not be used to bypass that process.

## Migration and remediation

Migrations `202608250002_add_training_history_notification_types.sql` and `202608250003_training_history_reviewer_context.sql` add the notification types, idempotency key, reviewer identity projection, and audit-trigger emission. They do not backfill old notifications. Deploy them in order after the existing TASK-401 migrations. Remediation is another forward migration that replaces the functions or disables future event emission; existing notification rows can remain as audit-visible delivery history.
