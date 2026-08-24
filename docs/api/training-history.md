# Training history contract

Training history supports only `level_1` and `level_2`, matching DEC-02. Trainees submit claims containing cohort, location, dates, teaching Instructor, coursework status, evidence reference, and private notes.

Claims cannot affect certification until verified. Only the active assigned Instructor or an Administrator can review a claim. Instructor verification records the supervision assignment under which it occurred. Rejection requires a reason.

Submission, correction, and review snapshots are append-only in `training_history_audit`. Trainees, their active Instructor, and Administrators receive the corresponding RLS access; unrelated and anonymous users receive none.

## Read contract

`list_training_history(actor_user_id, target_trainee_user_id)` is the authorized server read model. It binds `actor_user_id` to `auth.uid()`, rejects unrelated and former Instructors, and returns the structured record plus a safe verifier display name. Evidence references and notes remain inside this private projection.

`current_verified_training_level(target_trainee_user_id)` derives the highest verified Level 1/Level 2 record. It applies the same Trainee, active-Instructor, and Administrator boundary. Claimed and rejected records are excluded.

Both functions revoke `PUBLIC` and anonymous execution and are granted only to authenticated callers. The underlying tables keep RLS enabled.

## Historical-recognition boundary

This contract does not convert an ordinary training claim into DEC-04 historical recognition. Historical recognition requires independent senior and Administrator review, primary or corroborating evidence, conflict handling, and append-only decisions. The training-history form must not be used to bypass that process.

## Migration and remediation

Migration `202608240001_task_401_training_history_read_model.sql` is additive and does not backfill or transform records. Rollback is not required for data safety; remediation is a forward migration that replaces or revokes the read function.
