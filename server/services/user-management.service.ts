import type { SupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getClientEnv } from "@/lib/env";
import type { Role } from "@/server/models/rbac.model";
import {
  assignRoleToUser,
  listManagedUsers,
  listUserRoles,
  removeRoleFromUser,
} from "@/server/repositories/rbac.repository";
import { canManageUserRole, hasPermission } from "@/server/services/rbac.service";
import { sendInviteEmail } from "@/server/services/email.service";

export async function listUsersForManagement(
  supabase: SupabaseServerClient,
  actorUserId: string,
  page = 1,
  pageSize = 10
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasPermission(roles, "users:manage")) {
    throw new Error("User management access is required.");
  }

  return listManagedUsers(supabase, actorUserId, page, pageSize);
}

export async function assignManagedUserRole(
  supabase: SupabaseServerClient,
  actorUserId: string,
  targetUserId: string,
  role: Role
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!canManageUserRole(actorRoles, role)) {
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

export async function inviteManagedUser(
  supabase: SupabaseServerClient,
  actorUserId: string,
  input: {
    email: string;
    fullName?: string | null;
    role: Role;
    locale: string;
    roleLabel: string;
  }
) {
  const actorRoles = await listUserRoles(supabase, actorUserId);

  if (!canManageUserRole(actorRoles, input.role)) {
    throw new Error("You do not have permission to invite users with this role.");
  }

  const admin = createSupabaseAdminClient();
  const env = getClientEnv();
  const redirectTo = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/${input.locale}/dashboard`;
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
      },
      redirectTo,
    },
  });

  if (linkError) {
    throw new Error(linkError.message);
  }

  const targetUserId = existingUser?.id ?? linkData.user?.id;
  const inviteUrl = linkData.properties?.action_link;

  if (!targetUserId || !inviteUrl) {
    throw new Error("Invite link could not be generated.");
  }

  await assignRoleToUser(supabase, actorUserId, targetUserId, input.role);
  await sendInviteEmail({
    toEmail: normalizedEmail,
    toName: input.fullName,
    inviteUrl,
    roleLabel: input.roleLabel,
  });
}
