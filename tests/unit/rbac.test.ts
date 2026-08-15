import { describe, expect, it } from "vitest";
import {
  canAccessDashboard,
  canManageUserRole,
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
    expect(getPrimaryRole(["practitioner", "instructor"])).toBe("instructor");
    expect(getPrimaryRole([])).toBeNull();
  });

  it("checks exact dashboard access", () => {
    expect(canAccessDashboard(["instructor"], "instructor")).toBe(true);
    expect(canAccessDashboard(["instructor"], "admin")).toBe(false);
  });

  it("checks roles and permissions", () => {
    expect(hasRole(["facilitator"], "facilitator")).toBe(true);
    expect(hasPermission(["admin"], "certifications:approve")).toBe(true);
    expect(hasPermission(["instructor"], "trainees:supervise")).toBe(true);
    expect(hasPermission(["instructor"], "users:manage")).toBe(false);
    expect(hasPermission(["instructor"], "events:manage")).toBe(false);
    expect(hasPermission(["practitioner"], "certifications:approve")).toBe(false);
  });

  it("limits role administration to Administrators", () => {
    expect(canManageUserRole(["admin"], "admin")).toBe(true);
    expect(canManageUserRole(["instructor"], "facilitator")).toBe(false);
    expect(canManageUserRole(["instructor"], "practitioner")).toBe(false);
    expect(canManageUserRole(["instructor"], "admin")).toBe(false);
    expect(canManageUserRole(["instructor"], "instructor")).toBe(false);
  });

  it("builds locale-aware role dashboard paths", () => {
    expect(getRoleDashboardPath("es", "practitioner")).toBe("/es/dashboard/practitioner");
  });
});
