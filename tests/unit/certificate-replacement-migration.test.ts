import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202609140002_fix_certificate_replacement_event_key.sql"
  ),
  "utf8"
).toLowerCase();

describe("certificate replacement request database fix", () => {
  it("keeps the notification key variable distinct from the event_key column", () => {
    expect(migration).toContain("declare replacement_event_key text");
    expect(migration).toContain("replacement_event_key || ':' || administrator_id::text");
    expect(migration).not.toContain("declare event_key text");
  });

  it("preserves authenticated execution permissions", () => {
    expect(migration).toContain("create or replace function public.request_certificate_replacement");
    expect(migration).toContain("grant execute on function public.request_certificate_replacement");
    expect(migration).toContain("to authenticated");
  });
});
