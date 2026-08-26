# TASK-402 certification state machine

## Data contract

`certification_journeys` is the current private projection. `certification_journey_audit` is append-only and records each automatic transition, eligibility regression, legacy migration, and Administrator correction with previous/resulting state and counted-session totals.

The canonical enum contains the complete DEC-02 journey, but TASK-402 automatically derives only the states supported by existing verified sources:

1. Level 1 in progress through practicum
2. 25-session attainment and Level 2 review eligibility
3. Verified Level 2 and advanced practicum
4. 50-session attainment

Assessment, certification approval, certificate issuance, and role activation remain locked for TASK-404/405. Encoding their states does not expose placeholder actions.

## Rule projection

- Level completion requires a verified `training_history` record with mandatory coursework complete.
- Counted practice sessions are cumulative after verified Level 1 completion, validated, at least 60 minutes, and linked to a private Session Participant.
- Level 2 review eligibility also requires an active Instructor.
- Verified Level 2 cannot advance the journey unless the 25-session and active-Instructor prerequisites are present.
- Source invalidation recalculates states through session, training-history, and supervision triggers.
- Repeated synchronization and repeated committed overrides do not duplicate transition audit rows.

## Authorization and privacy

- A Trainee reads their own journey and audit.
- An Instructor reads only an actively assigned Trainee's journey and audit.
- An ended assignment removes access immediately.
- An Administrator reads all journeys and may record adjacent-state corrections.
- All actor-bearing security-definer functions bind the supplied actor to `auth.uid()`.
- Tables expose no direct write policy; mutations use the authenticated RPC boundary.
- Override reasons, evidence references, and audit metadata remain private and must not be copied to notifications, email, or logs.
- Legacy count/approval mutation RPCs are revoked. Existing legacy rows remain intact for compatibility with projections pending TASK-405.

## Migration

`202608250004_task_402_certification_state_machine.sql` is additive and forward-only. It creates the journey/audit schema, triggers, RLS, RPCs, and a deterministic backfill for every existing practitioner. Backfill preserves the legacy row as metadata and derives the new state only from verified current sources; a legacy `approved` flag does not fabricate an assessment pass or new certification approval.

If remediation is required, deploy a new forward migration that replaces the affected function or trigger. Do not drop the audit tables or rewrite the migration. The legacy table remains available during remediation.
