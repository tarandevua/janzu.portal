import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientEnv } from "@/lib/env";
import type { ManagedUserFilters, Role } from "@/server/models/rbac.model";
import {
  assignRoleToUser,
  listDeletedManagedUsers,
  listManagedUsers,
  listUserRoles,
  removeRoleFromUser,
  restoreDeletedManagedUserById,
  softDeleteManagedUserById,
} from "@/server/repositories/rbac.repository";
import {
  canAssignUserRole,
  canManageUserRole,
  hasPermission,
} from "@/server/services/rbac.service";
import { sendInviteEmail } from "@/server/services/email.service";
import type { Database } from "@/types/database";

type UpdatePractitionerPublicVisibilityArgs =
  Database["public"]["Functions"]["update_practitioner_public_visibility"]["Args"];

type PractitionerVisibilityRpcClient = {
  rpc(
    functionName: "update_practitioner_public_visibility",
    args: UpdatePractitionerPublicVisibilityArgs
  ): Promise<{ error: { message: string } | null }>;
};

export class UserInviteResendError extends Error {
  constructor(
    message: string,
    readonly code: "not_eligible" | "link_generation_failed"
  ) {
    super(message);
    this.name = "UserInviteResendError";
  }
}

export class ManagedUserMutationError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "invalid-state" | "auth-update-failed"
  ) {
    super(message);
    this.name = "ManagedUserMutationError";
  }
}

const MANAGED_USER_BAN_DURATION = "876000h";

export async function listUsersForManagement(
  supabase: SupabaseServerClient,
  actorUserId: string,
  page = 1,
  pageSize = 10,
  filters: ManagedUserFilters = {}
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(roles, "users:manage")) {
    throw new Error("User management access is required.");
  }

  return listManagedUsers(supabase, actorUserId, page, pageSize, filters);
}

export async function listDeletedUsersForManagement(
  supabase: SupabaseServerClient,
  actorUserId: string,
  page = 1,
  pageSize = 10,
  search?: string
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(roles, "users:manage")) {
    throw new ManagedUserMutationError(
      "User management access is required.",
      "forbidden"
    );
  }

  return listDeletedManagedUsers(supabase, actorUserId, page, pageSize, search);
}

async function getManagedUserDeletionState(targetUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, is_deleted")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new ManagedUserMutationError("User was not found.", "invalid-state");
  }

  return { admin, isDeleted: data.is_deleted };
}

export async function softDeleteManagedUser(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(roles, "users:manage") || actorUserId === targetUserId) {
    throw new ManagedUserMutationError(
      actorUserId === targetUserId
        ? "Administrators cannot delete their own account."
        : "User management access is required.",
      "forbidden"
    );
  }

  const { admin, isDeleted } = await getManagedUserDeletionState(targetUserId);

  if (isDeleted) {
    throw new ManagedUserMutationError("User is already deleted.", "invalid-state");
  }

  const { error: banError } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: MANAGED_USER_BAN_DURATION,
  });

  if (banError) {
    throw new ManagedUserMutationError(banError.message, "auth-update-failed");
  }

  try {
    await softDeleteManagedUserById(supabase, actorUserId, targetUserId);
  } catch (error) {
    await admin.auth.admin.updateUserById(targetUserId, { ban_duration: "none" });
    throw error;
  }
}

export async function restoreDeletedManagedUser(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(roles, "users:manage")) {
    throw new ManagedUserMutationError(
      "User management access is required.",
      "forbidden"
    );
  }

  const { admin, isDeleted } = await getManagedUserDeletionState(targetUserId);

  if (!isDeleted) {
    throw new ManagedUserMutationError("User is not deleted.", "invalid-state");
  }

  const { error: unbanError } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: "none",
  });

  if (unbanError) {
    throw new ManagedUserMutationError(unbanError.message, "auth-update-failed");
  }

  try {
    await restoreDeletedManagedUserById(supabase, actorUserId, targetUserId);
  } catch (error) {
    await admin.auth.admin.updateUserById(targetUserId, {
      ban_duration: MANAGED_USER_BAN_DURATION,
    });
    throw error;
  }
}

export async function assignManagedUserRole(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  role: Role
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!canAssignUserRole(actorRoles, role)) {
    throw new Error("You do not have permission to assign this role.");
  }

  await assignRoleToUser(supabase, actorUserId, targetUserId, role);
}

export async function removeManagedUserRole(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  role: Role
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!canManageUserRole(actorRoles, role)) {
    throw new Error("You do not have permission to remove this role.");
  }

  await removeRoleFromUser(supabase, actorUserId, targetUserId, role);
}

export async function updateManagedUserPublicProfileVisibility(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  isPublic: boolean
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(actorRoles, "users:manage")) {
    throw new Error("User management access is required.");
  }

  const rpcClient = supabase as unknown as PractitionerVisibilityRpcClient;
  const { error } = await rpcClient.rpc("update_practitioner_public_visibility", {
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    target_is_public: isPublic,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function inviteManagedUser(
  supabase: SupabaseServerClient,
  actorUserId: string,
  input: {
    email: string;
    fullName?: string | null;
    role: Role;
    locale: Locale;
    roleLabel: string;
  }
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!canAssignUserRole(actorRoles, input.role)) {
    throw new Error("You do not have permission to invite users with this role.");
  }

  const admin = createSupabaseAdminClient();
  const env = getClientEnv();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const redirectTo = `${siteUrl}/${input.locale}/auth/callback?locale=${input.locale}`;
  const normalizedEmail = input.email.trim().toLowerCase();
  const { data: existingUser, error: existingUserError } = await admin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUserError) {
    throw new Error(existingUserError.message);
  }

  const linkType = existingUser ? "magiclink" : "invite";
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: linkType,
    email: normalizedEmail,
    options: {
      data: {
        full_name: input.fullName ?? undefined,
        preferred_locale: input.locale,
      },
      redirectTo,
    },
  });

  if (linkError) {
    throw new Error(linkError.message);
  }

  const targetUserId = existingUser?.id ?? linkData.user?.id;
  const tokenHash = linkData.properties?.hashed_token;
  const verificationType = linkData.properties?.verification_type;
  const inviteUrl = tokenHash && (verificationType === "invite" || verificationType === "magiclink")
    ? `${redirectTo}&token_hash=${encodeURIComponent(tokenHash)}&type=${verificationType}`
    : null;

  if (!targetUserId || !inviteUrl) {
    throw new Error("Invite link could not be generated.");
  }

  await assignRoleToUser(supabase, actorUserId, targetUserId, input.role);

  if (!existingUser && input.role !== "apprentice") {
    await removeRoleFromUser(supabase, actorUserId, targetUserId, "apprentice");
  }

  await sendInviteEmail({
    toEmail: normalizedEmail,
    toName: input.fullName,
    inviteUrl,
    roleLabel: input.roleLabel,
  });
}

export async function resendManagedUserInvite(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  fallbackLocale: Locale
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(actorRoles, "users:manage")) {
    throw new Error("User management access is required.");
  }

  const admin = createSupabaseAdminClient();
  const [targetResult, authResult, targetRoles] = await Promise.all([
    admin
      .from("users")
      .select("email, full_name, preferred_locale, activated_at, is_deleted")
      .eq("id", targetUserId)
      .maybeSingle(),
    admin.auth.admin.getUserById(targetUserId),
    listUserRoles(supabase, targetUserId),
  ]);

  if (targetResult.error) {
    throw new Error(targetResult.error.message);
  }

  if (authResult.error) {
    throw new UserInviteResendError(
      authResult.error.message,
      "link_generation_failed"
    );
  }

  const target = targetResult.data;
  const authUser = authResult.data.user;

  if (
    !target
    || target.is_deleted
    || target.activated_at
    || authUser.last_sign_in_at
  ) {
    throw new UserInviteResendError(
      "Only unused, unactivated accounts can receive another invite.",
      "not_eligible"
    );
  }

  const email = (authUser.email ?? target.email).trim().toLowerCase();
  const locale = target.preferred_locale ?? fallbackLocale;
  const env = getClientEnv();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const redirectTo = `${siteUrl}/${locale}/auth/callback?locale=${locale}`;
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkError) {
    throw new UserInviteResendError(linkError.message, "link_generation_failed");
  }

  const tokenHash = linkData.properties?.hashed_token;
  const verificationType = linkData.properties?.verification_type;
  const inviteUrl = tokenHash && verificationType === "magiclink"
    ? `${redirectTo}&token_hash=${encodeURIComponent(tokenHash)}&type=${verificationType}`
    : null;

  if (!inviteUrl) {
    throw new UserInviteResendError(
      "Invite link could not be generated.",
      "link_generation_failed"
    );
  }

  await sendInviteEmail({
    toEmail: email,
    toName: target.full_name,
    inviteUrl,
    roleLabel: targetRoles.join(", ") || "member",
  });
}
