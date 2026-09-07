import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202609060001_fix_level_2_readiness_decision_event_key.sql"
  ),
  "utf8"
).toLowerCase();

describe("Level 2 readiness decision event-key fix", () => {
  it("keeps the local decision key distinct from the notifications column", () => {
    expect(migration).toContain("decision_event_key text");
    expect(migration).not.toMatch(/\n\s*event_key text;/);
    expect(migration).toContain("on conflict (event_key) where event_key is not null");
  });

  it("uses the renamed key consistently for notification and email idempotency", () => {
    expect(migration).toContain(
      "decision_event_key := 'certification.level_2:'"
    );
    expect(migration).toContain("event_type, decision_event_key");
    expect(migration).toContain(
      "decision_event_key || ':' || readiness_request.trainee_user_id::text"
    );
  });

  it("preserves approval-triggered certification recalculation", () => {
    expect(migration).toContain("if target_status = 'approved' then");
    expect(migration).toContain(
      "perform public.recalculate_certification_journey(journey.practitioner_id, actor_user_id)"
    );
  });
});
