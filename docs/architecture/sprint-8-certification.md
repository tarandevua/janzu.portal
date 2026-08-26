# Sprint 8 - legacy certification tracking

This document describes the superseded single-threshold implementation retained for migration compatibility. TASK-402 replaces its mutation and UI boundaries with the DEC-02 state machine documented in [TASK-402 certification state machine](./task-402-certification-state-machine.md).

The legacy `certification_progress` table used `in_progress`, `eligible`, and `approved` flags based on a raw 50-validated-session count. Its security-definer synchronization, approval, and queue RPCs are revoked by the TASK-402 forward migration. Existing rows are preserved so older public/community projections do not change unexpectedly before TASK-405 migrates certificate and role activation.

Do not add new workflow behavior to the legacy table. Remediation and later certification work must extend `certification_journeys` and its append-only audit contract.
