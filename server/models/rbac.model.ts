export const roles = ["admin", "manager", "facilitator", "practitioner"] as const;

export type Role = (typeof roles)[number];

export type UserRole = {
  userId: string;
  role: Role;
};

export type ManagedUser = {
  userId: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  roles: Role[];
};

export type RolePermission =
  | "users:manage"
  | "locations:approve"
  | "certifications:approve"
  | "events:manage"
  | "sessions:facilitate"
  | "clients:manage"
  | "profile:manage";

export type RoleAccess = {
  role: Role;
  label: string;
  dashboardPath: string;
  permissions: RolePermission[];
};
