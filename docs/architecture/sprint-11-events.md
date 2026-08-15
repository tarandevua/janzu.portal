# Sprint 11 - Events

> Current authorization: event management is Administrator-only unless another active role explicitly grants it. The legacy Manager grant no longer applies to Instructors.

## Goal

Create event management and RSVP foundations for retreats, trainings, and community gatherings.

## Included

- `events` and `event_rsvps` tables.
- `event_type` and `event_status` enums.
- Capacity-enforced `rsvp_to_event` RPC.
- Public RLS for published events.
- Admin/manager RLS for event creation and management.
- Layered backend model, repository, service, controller, and validators.
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/manage`
- `POST /api/events/rsvp`
- Dashboard event creation page.
- Dashboard managed event table.
- Public event listing with RSVP buttons.
- English and Spanish copy.
- Unit tests for event validation.

## Deferred

- Event editing/cancellation UI.
- RSVP cancellation.
- Event invitation notifications.
- Event maps and filters.
