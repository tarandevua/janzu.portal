import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("unused user invite resend", () => {
  it("shows eligibility only before portal activation and first sign-in", () => {
    const migration = source(
      "supabase/migrations/202608200002_resend_unused_user_invites.sql"
    );

    expect(migration).toContain("portal_user.activated_at is null");
    expect(migration).toContain("auth_user.last_sign_in_at is null");
    expect(migration).toContain("not public.user_has_role(actor_user_id, 'admin')");
  });

  it("rechecks eligibility on the server before generating a fresh link", () => {
    const service = source("server/services/user-management.service.ts");

    expect(service).toContain("target.activated_at");
    expect(service).toContain("authUser.last_sign_in_at");
    expect(service).toContain('type: "magiclink"');
    expect(service.indexOf("authUser.last_sign_in_at")).toBeLessThan(
      service.lastIndexOf('type: "magiclink"')
    );
  });

  it("returns specific failures for inline toast feedback", () => {
    const actions = source("features/user-management/actions.ts");
    const component = source(
      "features/user-management/components/user-role-management-table.tsx"
    );

    expect(actions).toContain('"provider-unavailable"');
    expect(actions).toContain('"provider-rejected"');
    expect(actions).toContain('"link-generation-failed"');
    expect(component).toContain("toast.loading(dictionary.resendSending)");
    expect(component).toContain("toast.success(dictionary.resent");
    expect(component).toContain("toast.error(message");
  });
});
