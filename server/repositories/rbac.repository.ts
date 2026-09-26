import type { SupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRoles } from "@/server/services/rbac.service";
import type {
  DeletedManagedUser,
  DeletedManagedUsersPage,
  ManagedUser,
  ManagedUserFilters,
  ManagedUsersPage,
  Role,
} from "@/server/models/rbac.model";
import type { Database } from "@/types/database";

type RoleJoinRow = {
  roles: {
    name: Role;
  } | null;
};

type ManagedUserRow =
  Database["public"]["Functions"]["list_user_role_management"]["Returns"][number];
type ListManagedUsersArgs =
  Database["public"]["Functions"]["list_user_role_management"]["Args"];
type AssignRoleArgs = Database["public"]["Functions"]["assign_user_role"]["Args"];
type RemoveRoleArgs = Database["public"]["Functions"]["remove_user_role"]["Args"];
type DeletedManagedUserRow =
  Database["public"]["Functions"]["list_deleted_user_management"]["Returns"][number];
type ListDeletedManagedUsersArgs =
  Database["public"]["Functions"]["list_deleted_user_management"]["Args"];
type SoftDeleteManagedUserArgs =
  Database["public"]["Functions"]["soft_delete_managed_user"]["Args"];
type RestoreDeletedManagedUserArgs =
  Database["public"]["Functions"]["restore_deleted_managed_user"]["Args"];

type RbacRpcClient = {
  rpc(
    functionName: "list_user_role_management",
    args: ListManagedUsersArgs
  ): Promise<{ data: ManagedUserRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "assign_user_role",
    args: AssignRoleArgs
  ): Promise<{ data: undefined | null; error: { message: string } | null }>;
  rpc(
    functionName: "remove_user_role",
    args: RemoveRoleArgs
  ): Promise<{ data: undefined | null; error: { message: string } | null }>;
  rpc(
    functionName: "list_deleted_user_management",
    args: ListDeletedManagedUsersArgs
  ): Promise<{ data: DeletedManagedUserRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "soft_delete_managed_user",
    args: SoftDeleteManagedUserArgs
  ): Promise<{ data: string | null; error: { message: string } | null }>;
  rpc(
    functionName: "restore_deleted_managed_user",
    args: RestoreDeletedManagedUserArgs
  ): Promise<{ data: string | null; error: { message: string } | null }>;
};

function toManagedUser(row: ManagedUserRow): ManagedUser {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
    canResendInvite: row.can_resend_invite,
    roles: normalizeRoles(row.roles),
    practitionerId: row.practitioner_id,
    practitionerIsPublic: row.practitioner_is_public,
    practitionerCountry: row.practitioner_country,
    practitionerCity: row.practitioner_city,
    practitionerLanguages: row.practitioner_languages ?? [],
    clientsCount: row.clients_count,
    sessionsCount: row.sessions_count,
    validatedSessionsCount: row.validated_sessions_count,
    sessionRequestsCount: row.session_requests_count,
    submittedLocationsCount: row.submitted_locations_count,
    approvedLocationsCount: row.approved_locations_count,
    eventRsvpsCount: row.event_rsvps_count,
  };
}

function toDeletedManagedUser(row: DeletedManagedUserRow): DeletedManagedUser {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
    deletedByEmail: row.deleted_by_email,
    deletedByFullName: row.deleted_by_full_name,
  };
}

export async function listUserRoles(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Role[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RoleJoinRow[];
  return normalizeRoles(rows.map((row) => row.roles?.name));
}

export async function listManagedUsers(
  supabase: SupabaseServerClient,
  actorUserId: string,
  page = 1,
  pageSize = 10,
  filters: ManagedUserFilters = {}
): Promise<ManagedUsersPage> {
  const rpcClient = supabase as unknown as RbacRpcClient;
  const { data, error } = await rpcClient.rpc("list_user_role_management", {
    actor_user_id: actorUserId,
    page_number: page,
    page_size: pageSize,
    search_query: filters.search || null,
    role_filter: filters.role ?? null,
    profile_filter: filters.profile ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  return {
    items: rows.map(toManagedUser),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export async function listDeletedManagedUsers(
  supabase: SupabaseServerClient,
  actorUserId: string,
  page = 1,
  pageSize = 10,
  search?: string
): Promise<DeletedManagedUsersPage> {
  const rpcClient = supabase as unknown as RbacRpcClient;
  const { data, error } = await rpcClient.rpc("list_deleted_user_management", {
    actor_user_id: actorUserId,
    page_number: page,
    page_size: pageSize,
    search_query: search || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  return {
    items: rows.map(toDeletedManagedUser),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export async function softDeleteManagedUserById(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string
) {
  const rpcClient = supabase as unknown as RbacRpcClient;
  const { data, error } = await rpcClient.rpc("soft_delete_managed_user", {
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "User deletion failed.");
  }
}

export async function restoreDeletedManagedUserById(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string
) {
  const rpcClient = supabase as unknown as RbacRpcClient;
  const { data, error } = await rpcClient.rpc("restore_deleted_managed_user", {
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "User restoration failed.");
  }
}

export async function assignRoleToUser(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  role: Role
) {
  const rpcClient = supabase as unknown as RbacRpcClient;
  const { error } = await rpcClient.rpc("assign_user_role", {
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    target_role: role,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeRoleFromUser(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  role: Role
) {
  const rpcClient = supabase as unknown as RbacRpcClient;
  const { error } = await rpcClient.rpc("remove_user_role", {
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    target_role: role,
  });

  if (error) {
    throw new Error(error.message);
  }
}
