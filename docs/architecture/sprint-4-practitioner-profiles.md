# Sprint 4 - Practitioner Profiles

## Goal

Allow practitioners to create and publish their profile with location, languages, website, and profile image URL.

## Included

- Supabase `practitioners` migration with RLS.
- Backend model, validator, repository, service, and controller.
- `GET /api/practitioners/me`
- `PUT /api/practitioners/me`
- `GET /api/practitioners`
- Dashboard profile edit form.
- Public practitioner listing and profile pages.
- Unit tests for validation and language parsing.

## Deferred

- Cloudflare R2 image upload flow.
- Map clustering.
- Advanced public search filters.
