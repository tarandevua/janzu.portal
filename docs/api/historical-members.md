# Historical member import and verification — TASK-601

Authenticated portal: `/[locale]/dashboard/historical-members`. An exact `?claimId=UUID` link opens an authorized claim and its evidence/decision history. The queue is paginated (`?page=2`, 25 records). Knowledge-base instructions include a complete import example.

## Import

The server action `historicalMemberAction` accepts `action=preview|commit` and `rows`, a JSON array of 1–100 claims (one member per batch row). Requests derive the actor using `auth.getUser()`. The service requires Administrator; `import_historical_members(actor_user_id, import_rows, commit_import)` repeats the authenticated actor and Administrator checks.

A claim contains `source`, `key`, `memberId`, `email`, `kind`, and `details`. `kind` is `training`, `sessions`, `facilitator`, or `instructor`. Source/key identify a claim permanently; they are not disposable retry IDs. Match an existing non-deleted account by both UUID and normalized email. Account invitation, creation, identity merging, and account renaming are outside this import.

`details` has period, location, teachingInstructor, cohort, identityEvidence, declaration, and evidence references. Evidence items contain source, reference, and type (`primary` or `corroborating`). Training requires level; exact dates, attendance/coursework completion, cohort and Level 2 prior eligibility evidence are required for approval. Session claims require coveredFrom, cutoff, claimedTotal and calculationMethod. Professional recognition requires historicalRecognitionEvidence before approval. Unknown fields are rejected. No participant identity, session text, contact data, or evidence file content belongs in details. The identity-match email is not included in claim/event read projections or mutation responses.

Responses: `{committed, rows: [{index, code, claimId?}]}`. Codes: `ready`, `replay`, `duplicate_identity`, `identity_mismatch`, `source_conflict`, `invalid`. A dry run writes nothing. Commit revalidates the complete batch under a transaction lock and commits nothing if any row is invalid or conflicting. Identical source/key payloads replay safely, including after later corrections. A changed payload with the same key is a conflict; correct the existing claim instead. Batch duplicates and ambiguous normalized account emails are reported before mutation.

## Review and correction

`act_on_historical_claim(actor_user_id, command)` accepts an action, claim `id`, current `revision`, and non-empty `reason`:

- `assign`: Administrator designates a senior Instructor/Assessor by `reviewerId`, recording the designation basis. All three parties must be distinct. The reviewer must retain the Instructor role; reassignment suspends prior credit.
- `review`: `decision`, `approvedTotal`, `noConflict: true`. The designated senior reviewer checks evidence first; an independent Administrator records the final decision. Full approval of sessions requires the claimed total; a supported smaller positive total requires `partially_approved`. Other claims approve as whole independent units, with total zero. Administrators may approve less than the senior review, never more.
- `recuse`: the designated reviewer records their conflict and releases the designation. No evidence credit remains active.
- `revise`: the member or Administrator submits complete replacement `details` and a correction/appeal reason. Old snapshots remain immutable; existing credit is suspended immediately. Another review is required. Different appeal reviewers are required where other active role holders exist; actual senior suitability remains the designating Administrator's responsibility.

States: `pending_information`, `awaiting_admin`, `approved`, `partially_approved`, `rejected`, `disputed`. Each mutation increments revision, preventing stale decisions and duplicate submissions. Reasons must describe discrepancies and the next action for incomplete/rejected/disputed claims. An Administrator decision sends one localized in-app notification with an exact private link, without evidence or reason text. No new email event is introduced.

Anonymous/unrelated users cannot read or mutate claims. Owners, Administrators, and the currently designated reviewer have access. Instructor status alone and a previous designation confer no access. Claim and event tables have no authenticated write grants. Direct training changes and the normal single-reviewer training RPC cannot alter linked historical training.
