import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202608240002_fix_end_supervision_enum_assignment.sql"
  ),
  "utf8"
);

describe("TASK-202 end-supervision enum remediation", () => {
  it("uses enum-typed transition variables and preserves audit states", () => {
    expect(migration).toContain("prior_assignment_status public.supervision_status");
    expect(migration).toContain("next_assignment_status public.supervision_status");
    expect(migration).toContain("'cancelled'::public.supervision_status");
    expect(migration).toContain("'ended'::public.supervision_status");
    expect(migration).toContain("previous_status,\n    resulting_status");
    expect(migration).toContain("prior_assignment_status,\n    next_assignment_status");
  });

  it("retains actor binding and authenticated-only execution", () => {
    expect(migration).toContain("actor_user_id is distinct from auth.uid()");
    expect(migration).toContain(
      "revoke all on function public.end_supervision(uuid, uuid, text) from public, anon"
    );
    expect(migration).toContain(
      "grant execute on function public.end_supervision(uuid, uuid, text) to authenticated"
    );
  });
});
