export const roles = ["admin", "instructor", "facilitator", "practitioner", "apprentice"] as const;

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
  canResendInvite: boolean;
  roles: Role[];
  practitionerId: string | null;
  practitionerIsPublic: boolean | null;
  practitionerCountry: string | null;
  practitionerCity: string | null;
  practitionerLanguages: string[];
  clientsCount: number;
  sessionsCount: number;
  validatedSessionsCount: number;
  sessionRequestsCount: number;
  submittedLocationsCount: number;
  approvedLocationsCount: number;
  eventRsvpsCount: number;
};

export type ManagedUsersPage = {
  items: ManagedUser[];
  totalCount: number;
};

export type ManagedUserProfileFilter =
  | "with_profile"
  | "without_profile"
  | "public_profile"
  | "private_profile";

export type ManagedUserFilters = {
  search?: string;
  role?: Role;
  profile?: ManagedUserProfileFilter;
};

export type RolePermission =
  | "users:manage"
  | "locations:approve"
  | "certifications:approve"
  | "events:manage"
  | "sessions:facilitate"
  | "clients:manage"
  | "profile:manage"
  | "trainees:supervise";

export type RoleAccess = {
  role: Role;
  label: string;
  dashboardPath: string;
  permissions: RolePermission[];
};
