import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608270003_task_403_25_session_workflow.sql"),
  "utf8"
).toLowerCase();
const enumMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608270002_add_task_403_notification_types.sql"),
  "utf8"
).toLowerCase();

describe("TASK-403 migration contract", () => {
  it("can resume after a partial SQL-editor run without dropping workflow data", () => {
    expect(migration).toContain("when duplicate_object then null");
    expect(migration).toContain("create table if not exists public.level_2_readiness_requests");
    expect(migration).toContain("drop policy if exists \"authorized participants can read level 2 readiness\"");
  });
  it("commits new notification enum values before the workflow uses them", () => {
    expect(enumMigration).toContain("certification_milestone_25_reached");
    expect(migration).not.toContain("alter type public.notification_type add value");
  });
  it("uses one immutable milestone key for notification and email idempotency", () => {
    expect(migration).toContain("unique (journey_id, milestone)");
    expect(migration).toContain("certification.milestone_25_reached:");
    expect(migration).toContain("on conflict (event_key)");
  });

  it("binds requests to the trainee and decisions to the active Instructor", () => {
    expect(migration).toContain("journey.trainee_user_id <> actor_user_id");
    expect(migration).toContain("only the active assigned instructor may decide this request");
    expect(migration).toContain("actor_user_id is distinct from auth.uid()");
  });

  it("recalculates and invalidates stale readiness without approving Level 2", () => {
    expect(migration).toContain("invalidate_level_2_readiness");
    expect(migration).toContain("status in ('pending', 'approved')");
    expect(migration).toContain("and readiness_approved");
    expect(migration).not.toContain("set state = 'level_2_completed'");
  });

  it("counts participant-confirmed sessions even when no client row is linked", () => {
    expect(migration).toContain("session_feedback.session_id = sessions.id");
    expect(migration).toContain("session_feedback.submitted_at is not null");
    expect(migration).not.toContain("client_id is not null");
  });

  it("keeps reasons out of required email metadata", () => {
    const emailMetadata = migration.slice(migration.indexOf("jsonb_build_object(\n+      'journeyid', readiness_request.journey_id"));
    expect(emailMetadata).not.toMatch(/jsonb_build_object\([\s\S]{0,800}'reason'/);
  });
});
