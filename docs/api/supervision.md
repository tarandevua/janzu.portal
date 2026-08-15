# Instructor supervision contract

`supervision_assignments` preserves pending, active, declined, ended, and cancelled relationships. A partial unique index permits only one active Instructor per Trainee.

## Mutations

- `request_supervision`: Trainee requests a verified Instructor.
- `respond_to_supervision`: selected Instructor accepts or declines.
- `end_supervision`: either participant or an Administrator ends/cancels a relationship.
- `admin_assign_instructor`: Administrator performs a reasoned direct assignment or transfer.

Every RPC validates `actor_user_id = auth.uid()`. A Trainee cannot activate a relationship. Accepting a transfer ends the prior active relationship before activating the next relationship in the same transaction. Audit records and in-app notifications preserve every decision.

Instructors can read only active assigned Trainee profile/training information and feedback summaries. Participant contact data and feedback free text are masked.
