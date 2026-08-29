import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(join(process.cwd(), "supabase/migrations/202608280003_task_404_50_session_assessment_workflow.sql"), "utf8").toLowerCase();
const enums = readFileSync(join(process.cwd(), "supabase/migrations/202608280002_add_task_404_notification_types.sql"), "utf8").toLowerCase();

describe("TASK-404 migration contract", () => {
  it("adds enum values in a preceding forward-only migration", () => {
    expect(enums).toContain("certification_milestone_50_reached");
    expect(workflow).not.toContain("alter type public.notification_type add value");
    expect(workflow).not.toMatch(/\bdrop table\b/);
  });

  it("enforces the accepted training, practice, and active-assignment rules", () => {
    expect(workflow).toContain("duration_minutes >= 60");
    expect(workflow).toContain("level_2_training_record_id is null");
    expect(workflow).toContain("status = 'active'");
    expect(workflow).toContain("invalidate_assessment_readiness");
  });

  it("binds sensitive operations to the authenticated actor and separate Assessor designation", () => {
    expect(workflow).toContain("actor_user_id is distinct from auth.uid()");
    expect(workflow).toContain("is_authorized_assessor");
    expect(workflow).toContain("the active instructor cannot assess their assigned trainee");
    expect(workflow).toContain("only the assigned authorized assessor may record the outcome");
  });

  it("preserves attempts, outcomes, notes, and explicit negative next actions", () => {
    expect(workflow).toContain("unique (journey_id, revision_number)");
    expect(workflow).toContain("previous_assessment_id");
    expect(workflow).toContain("an explicit next action is required");
    expect(workflow).toContain("remediation_verified");
  });

  it("keeps private notes and next-action free text out of email metadata", () => {
    for (const metadata of workflow.matchAll(/jsonb_build_object\(([\s\S]*?)\)(?:,|\))/g)) {
      expect(metadata[1]).not.toMatch(/'notes'|'reason'|'next_action'/);
    }
  });

  it("creates one immutable milestone and protected read policies", () => {
    expect(workflow).toContain("on conflict (journey_id, milestone) do nothing");
    expect(workflow).toContain("certification.milestone_50_reached:");
    expect(workflow).toContain("authorized participants can read assessments");
    expect(workflow).toContain("revoke insert, update, delete");
  });

  it("keeps the TASK-403 milestone dependency compatible with the event-key index", () => {
    expect(workflow).toContain("create or replace function public.emit_25_session_milestone");
    expect(workflow).toContain("milestone_event_key");
  });
});
