import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202608250004_task_402_certification_state_machine.sql"
  ),
  "utf8"
);
const integrationTest = readFileSync(
  resolve(process.cwd(), "supabase/tests/task_402_certification_state_machine.sql"),
  "utf8"
);

describe("TASK-402 migration contract", () => {
  it("encodes the canonical ordered journey and prevents skipped overrides", () => {
    expect(migration).toContain("'level_1_in_progress'");
    expect(migration).toContain("'sessions_25_reached'");
    expect(migration).toContain("'sessions_50_reached'");
    expect(migration).toContain("'facilitator_activated'");
    expect(migration).toContain("abs(resulting_rank - previous_rank) <> 1");
  });

  it("binds actors and restricts override authority", () => {
    expect(migration).toContain("actor_user_id is distinct from auth.uid()");
    expect(migration).toContain("not public.user_has_role(actor_user_id, 'admin')");
    expect(migration).toContain("public.is_active_instructor_for(auth.uid(), trainee_user_id)");
    expect(migration).toContain("An override cannot fabricate assessment");
  });

  it("revokes legacy writes and exposes only authenticated journey functions", () => {
    expect(migration).toContain(
      "revoke all on function public.approve_certification(uuid, uuid) from public, anon, authenticated"
    );
    expect(migration).toContain(
      "revoke all on function public.recalculate_certification_journey(uuid, uuid) from public, anon, authenticated"
    );
    expect(migration).toContain(
      "grant execute on function public.override_certification_journey_state"
    );
  });

  it("covers idempotency, relationship loss, actor tampering, and audited evidence", () => {
    expect(integrationTest).toContain("Idempotent synchronization created duplicate audit events");
    expect(integrationTest).toContain("A former Instructor retained certification access");
    expect(integrationTest).toContain("A caller changed the actor identifier");
    expect(integrationTest).toContain("Manual override audit context is incomplete");
  });
});
