# Sprint 9 - Locations Database

## Goal

Allow practitioners to submit water locations and allow admins/managers to approve locations before they become public.

## Included

- `locations`, `location_media`, and `location_reviews` tables.
- `location_type` and `approval_status` enums.
- RLS for public approved locations, practitioner-owned submissions, and reviewer approval.
- Approval/rejection RPCs for admin and manager roles.
- Layered backend model, repository, service, controller, and Zod validators.
- `GET /api/locations`
- `POST /api/locations`
- `GET /api/locations/me`
- `GET /api/locations/review`
- `POST /api/locations/review`
- Dashboard location submission form.
- Dashboard submitted-location table.
- Dashboard approval queue.
- Public approved-location listing.
- English and Spanish copy.
- Unit tests for location validation.

## Deferred

- Cloudflare R2 signed upload flow.
- Map clustering UI.
- Location review UI.
- Notification trigger when a location is approved.
