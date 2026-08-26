import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202608260001_task_203_instructor_supervision_dashboard.sql"),
  "utf8"
);
const integrationTest = readFileSync(
  resolve(process.cwd(), "supabase/tests/task_203_instructor_supervision_dashboard.sql"),
  "utf8"
);

describe("TASK-203 supervision dashboard migration", () => {
  it("binds the actor and limits rows to active assigned Trainees", () => {
    expect(migration).toContain("actor_user_id is distinct from auth.uid()");
    expect(migration).toContain("user_has_role(actor_user_id, 'instructor')");
    expect(migration).toContain("assignments.instructor_user_id = actor_user_id");
    expect(migration).toContain("assignments.status = 'active'");
  });

  it("returns only minimized feedback metadata", () => {
    const returnContract = migration.slice(
      migration.indexOf("returns table"),
      migration.indexOf(")\nlanguage plpgsql")
    );
    expect(returnContract).toContain("recent_feedback_rating integer");
    expect(returnContract).not.toMatch(/participant|email|phone|experience|notes/i);
  });

  it("covers permitted, unrelated, ended-relationship, and actor-tampering boundaries", () => {
    expect(integrationTest).toContain("Assigned Instructor did not receive the dashboard summary");
    expect(integrationTest).toContain("Unrelated Instructor received a dashboard summary");
    expect(integrationTest).toContain("Former Instructor retained dashboard access");
    expect(integrationTest).toContain("A caller changed the dashboard actor identifier");
    expect(integrationTest).toContain("Anonymous caller read the supervision dashboard");
  });
});
