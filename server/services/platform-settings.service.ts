import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSettings } from "@/server/models/platform-settings.model";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  getAuthSettings,
  getUserLoginRecordByEmail,
  updateAuthSettings,
} from "@/server/repositories/platform-settings.repository";
import { hasAnyRole } from "@/server/services/rbac.service";

export async function getAdminAuthSettings(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasAnyRole(roles, ["admin", "manager"])) {
    throw new Error("Admin or manager access is required to manage authentication settings.");
  }

  return getAuthSettings(supabase);
}

export async function updateAdminAuthSettings(
  supabase: SupabaseServerClient,
  actorUserId: string,
  settings: AuthSettings
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasAnyRole(roles, ["admin", "manager"])) {
    throw new Error("Admin or manager access is required to manage authentication settings.");
  }

  await updateAuthSettings(supabase, actorUserId, settings);
}

export async function getMagicLinkLoginPolicy(email: string) {
  const admin = createSupabaseAdminClient();
  const settings = await getAuthSettings(admin);
  const existingUser = await getUserLoginRecordByEmail(admin, email);

  if (existingUser?.isDeleted) {
    return {
      isAllowed: false,
      shouldCreateUser: false,
      reason: "deleted-user" as const,
    };
  }

  if (existingUser) {
    return {
      isAllowed: true,
      shouldCreateUser: false,
      reason: null,
    };
  }

  if (settings.allowUnknownMagicLinkLogin) {
    return {
      isAllowed: true,
      shouldCreateUser: true,
      reason: null,
    };
  }

  return {
    isAllowed: false,
    shouldCreateUser: false,
    reason: "unknown-user-disabled" as const,
  };
}
