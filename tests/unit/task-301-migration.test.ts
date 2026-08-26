import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "202608260002_task_301_profile_visibility_hardening.sql"
  ),
  "utf8"
);

describe("TASK-301 profile visibility hardening migration", () => {
  it("keeps exact and operational data out of directory return contracts", () => {
    const projectionContracts = sql.match(/returns table \([\s\S]*?\)/g) ?? [];

    expect(projectionContracts).toHaveLength(3);
    for (const contract of projectionContracts) {
      expect(contract).not.toMatch(/user_id|latitude|longitude|created_at|updated_at/);
    }
  });

  it("requires an active member for the community projection", () => {
    expect(sql).toContain("actor_user_id is distinct from auth.uid()");
    expect(sql).toContain("join public.user_roles");
    expect(sql).toContain("users.is_deleted = false");
  });

  it("does not allow an Administrator to opt another member in", () => {
    expect(sql).toContain("if target_is_public then");
    expect(sql).toContain("Only the member may opt a profile into a directory");
    expect(sql).toContain("insert into public.profile_visibility_audit");
  });
});
