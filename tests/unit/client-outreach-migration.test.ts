import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202609220001_client_outreach_management.sql"),
  "utf8"
);

describe("client outreach migration", () => {
  it("adds lifecycle statuses while preserving existing clients as active", () => {
    expect(sql).toContain("('prospect', 'active', 'inactive')");
    expect(sql).toContain("lifecycle_status public.client_lifecycle_status not null default 'active'");
  });

  it("enforces one open follow-up and changes it atomically", () => {
    expect(sql).toContain("client_outreach_one_open_follow_up_idx");
    expect(sql).toContain("where follow_up_status = 'open'");
    expect(sql).toContain("create_client_outreach_record");
    expect(sql).toContain("set follow_up_status = 'completed'");
  });

  it("keeps outreach private and activates prospects after a session", () => {
    expect(sql).toContain("Practitioners can read their own client outreach");
    expect(sql).not.toContain("Managers can read client outreach");
    expect(sql).toContain("sessions_activate_prospect");
    expect(sql).toContain("lifecycle_status = 'prospect'");
  });
});
