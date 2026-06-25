import { describe, expect, it } from "vitest";
import {
  canAccessDashboard,
  getPrimaryRole,
  getRoleDashboardPath,
  hasPermission,
  hasRole,
  normalizeRoles
} from "@/server/services/rbac.service";

describe("RBAC service", () => {
  it("normalizes roles by priority and removes invalid values", () => {
    expect(normalizeRoles(["practitioner", "admin", "admin", "unknown"])).toEqual([
      "admin",
      "practitioner"
    ]);
  });

  it("uses the highest-privilege role as primary", () => {
    expect(getPrimaryRole(["practitioner", "manager"])).toBe("manager");
    expect(getPrimaryRole([])).toBeNull();
  });

  it("checks exact dashboard access", () => {
    expect(canAccessDashboard(["manager"], "manager")).toBe(true);
    expect(canAccessDashboard(["manager"], "admin")).toBe(false);
  });

  it("checks roles and permissions", () => {
    expect(hasRole(["facilitator"], "facilitator")).toBe(true);
    expect(hasPermission(["admin"], "certifications:approve")).toBe(true);
    expect(hasPermission(["practitioner"], "certifications:approve")).toBe(false);
  });

  it("builds locale-aware role dashboard paths", () => {
    expect(getRoleDashboardPath("es", "practitioner")).toBe("/es/dashboard/practitioner");
  });
});
