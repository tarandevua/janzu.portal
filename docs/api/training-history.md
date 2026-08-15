# Training history contract

Training history supports only `level_1` and `level_2`, matching DEC-02. Trainees submit claims containing cohort, location, dates, teaching Instructor, coursework status, evidence reference, and private notes.

Claims cannot affect certification until verified. Only the active assigned Instructor or an Administrator can review a claim. Instructor verification records the supervision assignment under which it occurred. Rejection requires a reason.

Submission, correction, and review snapshots are append-only in `training_history_audit`. Trainees, their active Instructor, and Administrators receive the corresponding RLS access; unrelated and anonymous users receive none.
