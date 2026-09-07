import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202609070001_allow_assessor_reassignment.sql"
  ),
  "utf8"
).toLowerCase();

describe("Assessor reassignment migration", () => {
  it("allows an administrator to cancel an assignment only before scheduling", () => {
    expect(migration).toContain("create or replace function public.cancel_assessment_assessor");
    expect(migration).toContain("not public.user_has_role(actor_user_id, 'admin')");
    expect(migration).toContain("assessment.status <> 'awaiting_assessor'");
    expect(migration).toContain("assessor_designation_id = null");
    expect(migration).toContain("assessor_user_id = null");
    expect(migration).toContain("'assessor_assignment_cancelled'");
  });

  it("keeps reassignment available and sends a distinct assignment event", () => {
    expect(migration).toContain("and assessment.status = 'awaiting_assessor'");
    expect(migration).not.toContain("and assessment.assessor_user_id is null");
    expect(migration).toContain(":assessor_assigned:' || target_assessor_user_id::text");
  });
});
