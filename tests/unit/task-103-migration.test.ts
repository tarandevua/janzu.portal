import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202608150010_welcome_email_delivery.sql"
  ),
  "utf8"
);

describe("TASK-103 welcome email migration", () => {
  it("persists activation locale and one idempotent delivery", () => {
    expect(migration).toContain("add column if not exists preferred_locale text");
    expect(migration).toContain("add column if not exists activated_at timestamptz");
    expect(migration).toContain("unique (user_id)");
    expect(migration).toContain("idempotency_key text not null unique");
    expect(migration).toContain("'welcome.activated:' || target_user_id::text || ':v1'");
  });

  it("restricts mutation functions to the trusted service role", () => {
    expect(migration).toContain(
      "revoke all on function public.claim_welcome_email_delivery(uuid, text)"
    );
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain(
      "grant execute on function public.claim_welcome_email_delivery(uuid, text)\nto service_role"
    );
    expect(migration).toContain("Members can read their own welcome delivery");
  });

  it("records provider acceptance and bounded retry failures", () => {
    expect(migration).toContain("status = 'provider_accepted'");
    expect(migration).toContain("status = 'retry_scheduled'");
    expect(migration).toContain("status = 'failed_permanent'");
    expect(migration).toContain("current_delivery.attempt_count < 6");
    expect(migration).toContain("interval '12 hours'");
  });
});
