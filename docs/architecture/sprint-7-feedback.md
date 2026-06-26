# Sprint 7 - Session Feedback

## Goal

Allow practitioners to create feedback links and clients to submit unauthenticated feedback.

## Included

- `session_feedback` migration.
- Token-based public feedback submission.
- Database trigger that marks sessions as validated when feedback is submitted.
- Backend model, validator, repository, service, and controller.
- `POST /api/feedback-links`
- `POST /api/feedback/:token`
- Public feedback form.
- Copyable feedback links in the practitioner session list.
- Submitted links reopen to a submitted confirmation state.
- Unit tests for feedback validation.

## Deferred

- Email delivery of feedback links.
- Notification triggers.
- Certification progress aggregation.
