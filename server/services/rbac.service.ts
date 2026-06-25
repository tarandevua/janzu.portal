import type { Locale } from "@/lib/i18n/config";
import { roles, type Role, type RoleAccess, type RolePermission } from "@/server/models/rbac.model";

export const roleAccess: Record<Role, Omit<RoleAccess, "role">> = {
  admin: {
    label: "Admin",
    dashboardPath: "admin",
    permissions: ["users:manage", "locations:approve", "certifications:approve", "events:manage"]
  },
  manager: {
    label: "Manager",
    dashboardPath: "manager",
    permissions: ["locations:approve", "events:manage", "sessions:facilitate"]
  },
  facilitator: {
    label: "Facilitator",
    dashboardPath: "facilitator",
    permissions: ["sessions:facilitate", "profile:manage"]
  },
  practitioner: {
    label: "Practitioner",
    dashboardPath: "practitioner",
    permissions: ["clients:manage", "profile:manage"]
  }
};

const roleRank = new Map<Role, number>(roles.map((role, index) => [role, index]));

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function normalizeRoles(values: unknown[]): Role[] {
  const deduped = new Set<Role>();

  values.forEach((value) => {
    if (isRole(value)) {
      deduped.add(value);
    }
  });

  return [...deduped].sort((left, right) => {
    return (roleRank.get(left) ?? roles.length) - (roleRank.get(right) ?? roles.length);
  });
}

export function getPrimaryRole(userRoles: Role[]): Role | null {
  return normalizeRoles(userRoles)[0] ?? null;
}

export function hasRole(userRoles: Role[], requiredRole: Role) {
  return normalizeRoles(userRoles).includes(requiredRole);
}

export function hasAnyRole(userRoles: Role[], requiredRoles: Role[]) {
  const roleSet = new Set(normalizeRoles(userRoles));
  return requiredRoles.some((role) => roleSet.has(role));
}

export function hasPermission(userRoles: Role[], permission: RolePermission) {
  return normalizeRoles(userRoles).some((role) => roleAccess[role].permissions.includes(permission));
}

export function canAccessDashboard(userRoles: Role[], dashboardRole: Role) {
  return hasRole(userRoles, dashboardRole);
}

export function getRoleDashboardPath(locale: Locale, role: Role) {
  return `/${locale}/dashboard/${roleAccess[role].dashboardPath}`;
}

export function getRoleAccessList(userRoles: Role[]): RoleAccess[] {
  return normalizeRoles(userRoles).map((role) => ({
    role,
    ...roleAccess[role]
  }));
}
