import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = (name: string) => readFileSync(
  join(process.cwd(), "supabase", "migrations", name),
  "utf8"
);

describe("onboarding prerequisite migrations", () => {
  it("migrates Manager without retaining broad Instructor permissions", () => {
    const sql = migration("202608150002_instructor_supervision_authorization.sql");
    expect(sql).toContain("name = 'instructor'");
    expect(sql).toContain("public.is_active_instructor_for");
    expect(sql).toContain("actor_user_id = auth.uid()");
    expect(sql).not.toContain("roles.name = 'manager'");
  });

  it("fails legacy public profiles closed and masks exact coordinates", () => {
    const sql = migration("202608150003_profile_field_visibility.sql");
    expect(sql).toContain("update public.practitioners\nset is_public = false");
    expect(sql).toContain("null::double precision");
    expect(sql).toContain("drop policy if exists \"Public profile locations are readable\"");
  });

  it("routes profile visibility writes through the audited RPC boundary", () => {
    const sql = migration("202608150009_visibility_write_boundary.sql");
    const directUpdateGrant = sql.match(/grant update \(([^)]*)\)/)?.[1] ?? "";
    expect(sql).toContain("revoke insert, update on table public.practitioners from authenticated");
    expect(sql).toContain("insert into public.profile_visibility_audit");
    expect(directUpdateGrant).not.toContain("directory_visibility");
  });

  it("records versioned, revocable Learning Alliance events", () => {
    const sql = migration("202608150004_training_and_onboarding_contracts.sql");
    expect(sql).toContain("'accepted', 'revoked'");
    expect(sql).toContain("2026-08-15-v1");
    expect(sql).toContain("level_1', 'level_2");
    expect(sql).not.toContain("level_3");
  });

  it("masks feedback details for relationship-scoped Instructor access", () => {
    const sql = migration("202608150005_instructor_feedback_boundaries.sql");
    expect(sql).toContain("public.is_active_instructor_for(actor_user_id, practitioners.user_id)");
    expect(sql).toContain("then session_feedback.experience_text");
    expect(sql).not.toContain("user_has_role(actor_user_id, 'manager')");
  });
});
