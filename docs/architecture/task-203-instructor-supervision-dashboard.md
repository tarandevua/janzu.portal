# TASK-203 Instructor supervision dashboard

## Design

The supervision page adds a server-rendered summary for members who hold the Instructor role. The server starts the assignment, Instructor-directory, Administrator-only trainee-directory, and dashboard reads in parallel after loading the caller's roles.

The dashboard uses one database read model rather than composing unrestricted table reads in the browser. Each active assigned Trainee includes:

- current level derived from verified training records;
- verified-training count and a source-record link;
- counted-session progress from the certification journey;
- the latest feedback date and rating, linked by feedback ID;
- current certification milestone; and
- read-only next-action guidance derived from the existing journey state.

TASK-203 does not create readiness, assessment, or milestone transitions. Those workflows remain in TASK-403 and TASK-404.

## Authorization and privacy

`list_instructor_supervision_dashboard` is a security-definer boundary that requires a signed-in Instructor, rejects actor substitution, and returns only active assignments owned by that Instructor. Ended or transferred relationships disappear immediately.

The projection omits Session Participant identity and contact data, session notes, feedback free text, training evidence and notes, and administrative audit data. A recent-feedback summary contains only its authorized record ID, session date, and rating. Source links do not grant access; the training, feedback, and certification destinations enforce their existing relationship-scoped boundaries.

## Deployment

Apply `202608260001_task_203_instructor_supervision_dashboard.sql` after the TASK-202, TASK-401, and TASK-402 migrations. It adds only a function and grants, requires no backfill, and preserves existing data. If it must be remediated, deploy a later forward migration that replaces or revokes the function.

