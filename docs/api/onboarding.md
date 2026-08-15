# First Steps onboarding contract

First Steps is available to authenticated Trainees at `/{locale}/dashboard/first-steps`.

## Persisted state

- `learning_alliance_acknowledgements` stores append-only acceptance and revocation events for policy `2026-08-15-v1`.
- `onboarding_guide_completions` stores the Trainee's calendar, session, and feedback guide completion.
- Profile visibility, training history, and active Instructor relationship are derived from their source records rather than copied into onboarding flags.

All mutation functions bind `actor_user_id` to `auth.uid()`. A spoofed actor is rejected. Revocation and future policy versions make the Learning Alliance item incomplete without deleting history.

The Learning Alliance is non-legal and is not a certification gate.
