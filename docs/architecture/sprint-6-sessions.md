# Sprint 6 - Session Tracking

## Goal

Allow practitioners to log sessions with date, duration, location, optional client, and notes.

## Included

- Supabase `sessions` migration with practitioner-owned RLS.
- Optional link to private CRM clients.
- Client/practitioner consistency policy.
- Backend model, validator, repository, service, and controller.
- `GET /api/sessions`
- `POST /api/sessions`
- Dashboard sessions page inside the ShadCN dashboard layout.
- Unit tests for session validation.

## Deferred

- Feedback links.
- Session validation from feedback.
- Certification progress counting.
