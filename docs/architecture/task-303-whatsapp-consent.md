# TASK-303 WhatsApp Consent

## Contract

WhatsApp is a separate, owner-controlled contact permission. New and existing profiles default to no stored WhatsApp number and `private` visibility. A member must submit a valid international number, choose `private` or `community`, and affirm the current `2026-08-27.v1` consent text. General profile visibility and ordinary phone settings never imply this consent.

`update_my_whatsapp_consent` binds `actor_user_id` to `auth.uid()`, rejects `public`, stores the consent timestamp and policy version, and appends a consent audit event. Revocation is transactional: it nulls the current number and consent metadata, resets visibility to `private`, and records a `revoked` event.

## Projection boundary

Anonymous public profile and map functions are unchanged and have no WhatsApp return field. Actor-bound community profile and map projections return the number only when the profile is listed for the community, WhatsApp visibility is `community`, and current consent timestamp and policy version are present. The owner map preview applies the same rule and always returns `null` for a public preview.

Consent audit rows contain safe identifiers, action, policy version, audiences, and timestamp; they do not retain the phone number. Owners and Administrators may read the audit through RLS. No client-side control is relied on for authorization.

## Migration and remediation

`202608270001_task_303_whatsapp_consent.sql` is forward-only. It adds nullable/private-default columns, an append-only audit table, the owner-bound update RPC, and replacement community projections. It does not backfill consent or infer it from existing data. Rollback would risk recreating an unsafe contract; remediation should revoke the RPC grants and replace affected functions in another forward migration.

## Verification

- `supabase/tests/task_303_whatsapp_consent.sql` covers affirmative consent, public rejection, actor binding, community profile/map projection, public contract exclusion, revocation, and audit.
- Unit coverage guards validation, localized consent/revocation UI, migration privacy clauses, and safe map mapping.
