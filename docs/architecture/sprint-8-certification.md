# Sprint 8 - Certification Tracking

> Historical note: the legacy Manager approval described below no longer applies to Instructors. DEC-02 defines the replacement readiness, assessment, and Administrator issuance authorities.

## Goal

Track practitioner progress toward certification based on 50 validated sessions.

## Included

- `certification_progress` migration.
- `certification_status` enum.
- Sync function that counts validated sessions.
- Trigger from `sessions.is_validated`.
- Admin and manager approval RPC.
- Certification approval candidate queue RPC.
- Backend model, repository, service, and controller.
- `GET /api/certification/progress`
- `GET /api/certification/approve`
- `POST /api/certification/approve`
- Dashboard certification progress page.
- Dashboard certification approval queue with final approval action.
- Unit tests for progress summary calculations.

## Deferred

- Notification triggers.
- Badge award integration.
