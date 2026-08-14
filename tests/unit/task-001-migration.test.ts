import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202608140001_verify_feedback_notifications.sql"
  ),
  "utf8"
);

describe("TASK-001 feedback verification migration", () => {
  it("uses a one-to-one, tie-safe legacy notification match", () => {
    expect(migration).toContain("partition by candidates.notification_id");
    expect(migration).toContain("partition by candidates.feedback_id");
    expect(migration).toContain("notification_distance_ties = 1");
    expect(migration).toContain("feedback_distance_ties = 1");
  });

  it("enforces one exact notification per feedback record", () => {
    expect(migration).toContain("create unique index if not exists");
    expect(migration).toContain("notifications_feedback_received_unique_idx");
    expect(migration).toContain("on conflict (feedback_id)");
  });

  it("binds the security-definer feedback query to auth.uid", () => {
    expect(migration).toContain(
      "auth.uid() is null or actor_user_id is distinct from auth.uid()"
    );
    expect(migration).toContain("using errcode = '42501'");
  });
});
