import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/202609240001_managed_user_soft_delete.sql"),
  "utf8"
);
const service = readFileSync(
  join(process.cwd(), "server/services/user-management.service.ts"),
  "utf8"
);

describe("managed user soft-delete migration", () => {
  it("records deletion metadata without removing user relationships", () => {
    expect(sql).toContain("add column if not exists deleted_at timestamptz");
    expect(sql).toContain("add column if not exists deleted_by uuid");
    expect(sql).toContain("set\n    is_deleted = true");
    expect(sql).not.toContain("delete from public.users");
  });

  it("binds delete, restore, and deleted-user listing to an active admin", () => {
    expect(sql).toContain("create or replace function public.soft_delete_managed_user");
    expect(sql).toContain("create or replace function public.restore_deleted_managed_user");
    expect(sql).toContain("create or replace function public.list_deleted_user_management");
    expect(sql).toContain("actor_user_id is distinct from auth.uid()");
    expect(sql).toContain("not public.user_has_role(actor_user_id, 'admin')");
    expect(sql).toContain("if actor_user_id = target_user_id then");
  });

  it("removes deleted users from role authorization", () => {
    expect(sql).toContain("users.is_deleted = false");
    expect(sql).toContain("revoke update on table public.users from authenticated");
    expect(sql).toContain(
      "grant execute on function public.soft_delete_managed_user(uuid, uuid) to authenticated"
    );
    expect(sql).toContain(
      "grant execute on function public.restore_deleted_managed_user(uuid, uuid) to authenticated"
    );
  });

  it("coordinates the reversible portal state with the Supabase Auth ban", () => {
    expect(service).toContain('const MANAGED_USER_BAN_DURATION = "876000h"');
    expect(service).toContain("ban_duration: MANAGED_USER_BAN_DURATION");
    expect(service).toContain('ban_duration: "none"');
    expect(service.indexOf("ban_duration: MANAGED_USER_BAN_DURATION")).toBeLessThan(
      service.indexOf("await softDeleteManagedUserById")
    );
    expect(service.indexOf('ban_duration: "none"')).toBeLessThan(
      service.indexOf("await restoreDeletedManagedUserById")
    );
  });
});
