import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "202608260003_task_302_separate_practitioner_maps.sql"
  ),
  "utf8"
);

describe("TASK-302 separate practitioner maps migration", () => {
  it("keeps exact and private data out of all map return contracts", () => {
    const projectionContracts = sql.match(/returns table \([\s\S]*?\)/g) ?? [];

    expect(projectionContracts).toHaveLength(3);
    for (const contract of projectionContracts) {
      expect(contract).not.toMatch(/user_id|note|address|created_at|updated_at/);
    }
    expect(sql).toContain("round(locations.latitude::numeric, 1)");
    expect(sql).toContain("round(locations.longitude::numeric, 1)");
  });

  it("separates anonymous and active-member authorization", () => {
    expect(sql).toContain("directory_visibility = 'public'");
    expect(sql).toContain("location_visibility = 'public'");
    expect(sql).toContain("actor_user_id is distinct from auth.uid()");
    expect(sql).toContain("Community maps require an active authenticated member");
    expect(sql).toContain("to anon, authenticated");
    expect(sql).toContain("to authenticated");
  });

  it("derives categories only from verified roles and certification state", () => {
    expect(sql).toContain("public.user_has_role(practitioners.user_id, 'facilitator')");
    expect(sql).toContain("public.user_has_role(practitioners.user_id, 'instructor')");
    expect(sql).toContain("certification_progress.status = 'approved'");
  });
});
