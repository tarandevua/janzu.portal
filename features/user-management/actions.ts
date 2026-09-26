"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignManagedUserRole,
  inviteManagedUser,
  ManagedUserMutationError,
  removeManagedUserRole,
  resendManagedUserInvite,
  restoreDeletedManagedUser,
  softDeleteManagedUser,
  UserInviteResendError,
  updateManagedUserPublicProfileVisibility,
} from "@/server/services/user-management.service";
import { EmailDeliveryError } from "@/server/services/email.service";
import { updateAdminAuthSettings } from "@/server/services/platform-settings.service";
import { logUserInviteFailure } from "@/server/services/user-invite-logging.service";
import {
  authSettingsSchema,
  managedUserMutationSchema,
  userPublicProfileSchema,
  userInviteSchema,
  userInviteResendSchema,
  userRoleMutationSchema,
} from "@/server/validators/user-management.schema";

export type ManagedUserDeleteResult =
  | { ok: true; status: "deleted" }
  | {
      ok: false;
      status: "auth-required" | "delete-invalid" | "delete-forbidden" | "delete-failed";
    };

export type ManagedUserRestoreResult =
  | { ok: true; status: "restored" }
  | {
      ok: false;
      status: "auth-required" | "restore-invalid" | "restore-forbidden" | "restore-failed";
    };

export async function softDeleteUserInline(
  locale: Locale,
  formData: FormData
): Promise<ManagedUserDeleteResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = managedUserMutationSchema.safeParse({ userId: formData.get("userId") });

  if (!parsed.success) {
    return { ok: false, status: "delete-invalid" };
  }

  try {
    await softDeleteManagedUser(supabase, user.id, parsed.data.userId);
  } catch (error) {
    if (error instanceof ManagedUserMutationError && error.code === "forbidden") {
      return { ok: false, status: "delete-forbidden" };
    }

    return { ok: false, status: "delete-failed" };
  }

  revalidatePath(`/${locale}/dashboard/users`);
  revalidatePath(`/${locale}/practitioners`);
  return { ok: true, status: "deleted" };
}

export async function restoreDeletedUserInline(
  locale: Locale,
  formData: FormData
): Promise<ManagedUserRestoreResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = managedUserMutationSchema.safeParse({ userId: formData.get("userId") });

  if (!parsed.success) {
    return { ok: false, status: "restore-invalid" };
  }

  try {
    await restoreDeletedManagedUser(supabase, user.id, parsed.data.userId);
  } catch (error) {
    if (error instanceof ManagedUserMutationError && error.code === "forbidden") {
      return { ok: false, status: "restore-forbidden" };
    }

    return { ok: false, status: "restore-failed" };
  }

  revalidatePath(`/${locale}/dashboard/users`);
  revalidatePath(`/${locale}/practitioners`);
  return { ok: true, status: "restored" };
}

export type UserRoleMutationResult =
  | { ok: true; status: "assigned" | "removed" }
  | { ok: false; status: "auth-required" | "invalid" | "role-update-failed" };

async function mutateUserRoleInline(
  locale: Locale,
  formData: FormData,
  operation: "assign" | "remove"
): Promise<UserRoleMutationResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = userRoleMutationSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { ok: false, status: "invalid" };
  }

  try {
    if (operation === "assign") {
      await assignManagedUserRole(supabase, user.id, parsed.data.userId, parsed.data.role);
    } else {
      await removeManagedUserRole(supabase, user.id, parsed.data.userId, parsed.data.role);
    }
  } catch {
    return { ok: false, status: "role-update-failed" };
  }

  revalidatePath(`/${locale}/dashboard/users`);
  return { ok: true, status: operation === "assign" ? "assigned" : "removed" };
}

export async function assignUserRoleInline(locale: Locale, formData: FormData) {
  return mutateUserRoleInline(locale, formData, "assign");
}

export async function removeUserRoleInline(locale: Locale, formData: FormData) {
  return mutateUserRoleInline(locale, formData, "remove");
}

export async function assignUserRole(locale: Locale, formData: FormData) {
  const result = await assignUserRoleInline(locale, formData);
  if (!result.ok && result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }
  redirect(`/${locale}/dashboard/users?status=${result.status}`);
}

export async function removeUserRole(locale: Locale, formData: FormData) {
  const result = await removeUserRoleInline(locale, formData);
  if (!result.ok && result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }
  redirect(`/${locale}/dashboard/users?status=${result.status}`);
}

export async function updateUserPublicProfile(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = userPublicProfileSchema.safeParse({
    userId: formData.get("userId"),
    isPublic: formData.get("isPublic"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/users?status=public-profile-invalid`);
  }

  await updateManagedUserPublicProfileVisibility(
    supabase,
    user.id,
    parsed.data.userId,
    parsed.data.isPublic
  );

  revalidatePath(`/${locale}/dashboard/users`);
  revalidatePath(`/${locale}/practitioners`);
  redirect(`/${locale}/dashboard/users?status=public-profile-updated`);
}

export type InviteUserResult =
  | { ok: true; status: "invited" }
  | { ok: false; status: "invalid" | "created-email-failed" | "error" };

export async function inviteUser(
  locale: Locale,
  formData: FormData
): Promise<InviteUserResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = userInviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { ok: false, status: "invalid" };
  }

  try {
    await inviteManagedUser(supabase, user.id, {
      ...parsed.data,
      locale,
      roleLabel: parsed.data.role,
    });
  } catch (error) {
    logUserInviteFailure("create", error);

    if (
      error instanceof EmailDeliveryError
      && error.code === "email_provider_http_401"
    ) {
      return { ok: false, status: "created-email-failed" };
    }

    return { ok: false, status: "error" };
  }

  return { ok: true, status: "invited" };
}

export type ResendUserInviteResult =
  | { ok: true; status: "sent" }
  | {
      ok: false;
      status:
        | "invalid"
        | "not-eligible"
        | "email-not-configured"
        | "provider-unavailable"
        | "provider-rejected"
        | "link-generation-failed"
        | "error";
    };

export async function resendUserInvite(
  locale: Locale,
  formData: FormData
): Promise<ResendUserInviteResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = userInviteResendSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { ok: false, status: "invalid" };
  }

  try {
    await resendManagedUserInvite(supabase, user.id, parsed.data.userId, locale);
  } catch (error) {
    logUserInviteFailure("resend", error);

    if (error instanceof UserInviteResendError) {
      return {
        ok: false,
        status: error.code === "not_eligible"
          ? "not-eligible"
          : "link-generation-failed",
      };
    }

    if (error instanceof EmailDeliveryError) {
      if (error.code === "email_configuration_error") {
        return { ok: false, status: "email-not-configured" };
      }

      return {
        ok: false,
        status: error.retryable ? "provider-unavailable" : "provider-rejected",
      };
    }

    return { ok: false, status: "error" };
  }

  return { ok: true, status: "sent" };
}

export async function updateAuthSettings(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = authSettingsSchema.safeParse({
    allowUnknownMagicLinkLogin: formData.get("allowUnknownMagicLinkLogin"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/settings?status=auth-settings-invalid`);
  }

  await updateAdminAuthSettings(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/settings`);
  redirect(`/${locale}/dashboard/settings?status=auth-settings-saved`);
}
