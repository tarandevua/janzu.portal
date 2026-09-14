import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202609140001_fix_certificate_context_member_user_id.sql"
  ),
  "utf8"
).toLowerCase();

describe("TASK-405 certificate generation context fix", () => {
  it("qualifies certificate fields that collide with returned column names", () => {
    expect(migration).toContain("certificates.member_user_id = journey.trainee_user_id");
    expect(migration).toContain("certificates.status = 'active'");
    expect(migration).not.toMatch(/where\s+member_user_id\s*=/);
  });

  it("preserves authenticated execution permissions", () => {
    expect(migration).toContain("create or replace function public.get_certificate_generation_context");
    expect(migration).toContain("grant execute on function public.get_certificate_generation_context");
    expect(migration).toContain("to authenticated");
  });
});
