# Sprint 5 - Client CRM

## Goal

Allow practitioners to privately manage client records.

## Included

- Supabase `clients` migration with practitioner-owned RLS.
- Backend model, validator, repository, service, and controller.
- `GET /api/clients`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- Dashboard clients page inside the ShadCN dashboard layout.
- Server action for creating clients from the dashboard.
- Unit tests for client validation.

## Security

Clients belong to `practitioners.id`, not directly to auth users. RLS checks ownership through the authenticated user's practitioner profile.
