# Sprint 13 - Session Requests

## Goal

Complete the public session request workflow so visitors can request sessions from public practitioner profiles and practitioners can review those requests privately.

## Tasks

- Add the required `session_requests` table with private practitioner ownership.
- Trigger `session_request_received` notifications when a request is created.
- Add REST endpoints for public creation and authenticated practitioner review.
- Add a public ShadCN request form to practitioner profiles.
- Add a private ShadCN request queue to the sessions dashboard.
- Add English and Spanish localization plus schema tests.

## Implementation

- Public inserts are allowed only when the target practitioner profile is public.
- Practitioners can read and review only their own requests.
- Request review supports `accepted` and `declined`; pending requests remain actionable.
- The request queue appears under session logging and history, keeping session operations in one dashboard area.

## Code

- Migration: `supabase/migrations/202606260012_create_session_requests.sql`
- API: `app/api/session-requests/route.ts`, `app/api/session-requests/review/route.ts`
- Server layer: `server/controllers/session-request.controller.ts`, `server/services/session-request.service.ts`, `server/repositories/session-request.repository.ts`
- UI: `features/session-requests/components/session-request-form.tsx`, `features/session-requests/components/session-request-list.tsx`

## Tests

- `tests/unit/session-request-schema.test.ts`

## Review

This sprint completes the public-to-practitioner intake loop. A future enhancement can convert accepted requests into clients and sessions in one guided action.
