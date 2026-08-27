import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/202608270001_task_303_whatsapp_consent.sql"
);

describe("TASK-303 WhatsApp consent migration", () => {
  it("fails closed and exposes WhatsApp only through actor-bound community projections", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("default 'private'");
    expect(sql).toContain("check (whatsapp_visibility <> 'public')");
    expect(sql).toContain("actor_user_id is distinct from auth.uid()");
    expect(sql).toContain("target_visibility = 'public'");
    expect(sql).toContain("whatsapp_consent_granted_at is not null");
    expect(sql).toContain("whatsapp_consent_policy_version is not null");
    expect(sql).toContain("set whatsapp_number = null");
    expect(sql).toContain("create table public.whatsapp_consent_audit");
    expect(sql).toContain("revoke all on function public.update_my_whatsapp_consent");
  });

  it("does not replace either anonymous public projection", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).not.toContain("create function public.list_public_practitioner_profiles");
    expect(sql).not.toContain("create function public.list_public_practitioner_map_markers");
  });
});
