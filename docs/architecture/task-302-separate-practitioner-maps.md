# TASK-302 Separate Practitioner Maps

## Contract

Public and authenticated-community maps use distinct security-definer projections. The public projection is callable anonymously and returns markers only for non-deleted, explicitly public profiles with public location visibility and a verified Facilitator or Instructor role. The community projection binds its actor argument to `auth.uid()` and requires a non-deleted portal member with an assigned role.

Map categories come from current verified role and certification records. Public category priority is Facilitator, then Instructor. Community priority is Facilitator, Instructor, Trainee, then verified Practitioner certification. Administrator status is never projected.

## Location privacy

Stored coordinates and location notes remain behind owner/Administrator RLS and are absent from every map return contract. Map functions round latitude and longitude to one decimal place, producing deterministic 0.1-degree grid-cell centers at city/region scale. Location labels are returned only when the profile's location audience permits the requesting map audience.

The approximation is intentionally performed inside PostgreSQL before data crosses the server boundary. Changing precision requires a new forward migration and privacy review.

## Owner preview

`preview_my_practitioner_map_markers` binds the actor to the authenticated owner and applies the same audience, eligibility, verified-category, field masking, and approximation rules as the live maps. A private or otherwise ineligible listing produces the localized empty preview rather than revealing how it would look under hypothetical settings.

## Migration and remediation

`202608260003_task_302_separate_practitioner_maps.sql` is additive and forward-only. It does not backfill or change stored coordinates or visibility choices. Rollback is not required for stored data; remediation should revoke the new RPC grants and replace the functions in another forward migration.

## Verification

- `supabase/tests/task_302_separate_practitioner_maps.sql` covers anonymous/public access, active-member community access, actor spoofing, verified categories, audience gates, coordinate approximation, and owner preview.
- `tests/unit/task-302-migration.test.ts` guards the safe return contracts and grants.
- `tests/unit/practitioner-map-points.test.ts` covers localized marker mapping.
- `tests/unit/profile-map-preview.test.tsx` covers English and Spanish owner-preview empty states.
