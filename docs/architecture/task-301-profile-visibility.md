# TASK-301 Profile Visibility

## Contract

Profile content and profile visibility are separate writes. New and migrated profiles default every eligible audience to `private`. A member can opt into the authenticated community directory, while only a verified Facilitator or Instructor can opt into the public directory.

Directory visibility is a gate, not a blanket grant: every eligible field must independently allow the requesting audience. Public and authenticated-community queries use separate security-definer projections. Those projections return only display data and exclude user identifiers, legal names, login details, visibility settings, timestamps, exact coordinates, practice-location notes, training data, assignments, and audit records.

Exact coordinates remain in the owner/Administrator-protected profile tables. TASK-302 may introduce a separately approved approximate map projection; TASK-301 does not expose coordinates.

## Authorization and audit

`update_my_profile_visibility` binds `actor_user_id` to `auth.uid()`, enforces verified-role eligibility for every `public` audience, updates all settings in one transaction, and records before/after settings in `profile_visibility_audit`.

An Administrator cannot opt another member into a directory. The compatibility RPC `update_practitioner_public_visibility` permits only an audited emergency removal to `private`. Community reads bind the actor to the authenticated session and require a non-deleted portal member with an assigned role. Anonymous callers can execute only the public projections.

## Migration and remediation

`202608260002_task_301_profile_visibility_hardening.sql` is forward-only. It replaces the earlier projection signatures with data-minimal contracts and tightens the existing Administrator RPC. It does not transform member visibility choices. Rollback is intentionally not automatic because restoring the broader projections would reintroduce privacy exposure; remediation should use another forward migration.

## Verification

- `supabase/tests/task_301_profile_visibility.sql` exercises role eligibility, field masking, actor binding, deleted-member rejection, immediate changes, and member/Administrator audit records.
- `tests/unit/task-301-migration.test.ts` guards the projection contract and opt-in boundary.
- English and Spanish dashboard copy explains the directory gate, save progress, success, validation, and retry states.
