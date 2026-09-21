import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/202609210001_repair_auth_user_profile_sync.sql"
  ),
  "utf8"
);
const integrationTest = readFileSync(
  resolve(process.cwd(), "supabase/tests/auth_user_profile_sync.sql"),
  "utf8"
);

describe("Auth user profile synchronization repair migration", () => {
  it("reinstalls the locale-aware Auth user trigger", () => {
    expect(migration).toContain(
      "create or replace function public.handle_new_auth_user()"
    );
    expect(migration).toContain("new.raw_user_meta_data ->> 'preferred_locale'");
    expect(migration).toContain(
      "drop trigger if exists on_auth_user_created on auth.users"
    );
    expect(migration).toContain("create trigger on_auth_user_created");
    expect(migration).toContain(
      "execute function public.handle_new_auth_user()"
    );
  });

  it("backfills only Auth users missing from public users", () => {
    expect(migration).toContain("with repaired_users as");
    expect(migration).toContain("from auth.users as auth_users");
    expect(migration).toContain("from public.users as portal_users");
    expect(migration).toContain("portal_users.id = auth_users.id");
    expect(migration).toContain("returning id");
  });

  it("limits default-role restoration to repaired users", () => {
    expect(migration).toContain("select repaired_users.id, roles.id");
    expect(migration).toContain("from repaired_users");
    expect(migration).toContain("roles.name = 'apprentice'");
    expect(migration).toContain("on conflict do nothing");
  });

  it("has a rollback-based integration check for future Auth users", () => {
    expect(integrationTest).toContain("\\set ON_ERROR_STOP on");
    expect(integrationTest).toContain("insert into auth.users");
    expect(integrationTest).toContain("from public.users");
    expect(integrationTest).toContain("roles.name = 'apprentice'");
    expect(integrationTest).toContain("rollback;");
  });
});
