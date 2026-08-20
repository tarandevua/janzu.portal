import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/202608200001_transactional_email_infrastructure.sql"),
  "utf8"
);

describe("TASK-502 migration", () => {
  it("enforces durable idempotency, retries, and suppression", () => {
    expect(migration).toContain("event_key text not null unique");
    expect(migration).toContain("idempotency_key text not null unique");
    expect(migration).toContain("for update skip locked");
    expect(migration).toContain("delivery_status := 'suppressed'");
    expect(migration).toContain("interval '12 hours'");
  });

  it("keeps operational mutation behind the service role", () => {
    expect(migration).toContain("Members can read their email deliveries");
    expect(migration).toContain("Members can update their email preferences");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });
});
