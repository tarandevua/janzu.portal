"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignManagedUserRole,
  inviteManagedUser,
  removeManagedUserRole,
  resendManagedUserInvite,
  UserInviteResendError,
  updateManagedUserPublicProfileVisibility,
} from "@/server/services/user-management.service";
import { EmailDeliveryError } from "@/server/services/email.service";
import { updateAdminAuthSettings } from "@/server/services/platform-settings.service";
import {
  authSettingsSchema,
  userPublicProfileSchema,
  userInviteSchema,
  userInviteResendSchema,
  userRoleMutationSchema,
} from "@/server/validators/user-management.schema";

export async function assignUserRole(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = userRoleMutationSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/users?status=invalid`);
  }

  await assignManagedUserRole(supabase, user.id, parsed.data.userId, parsed.data.role);

  revalidatePath(`/${locale}/dashboard/users`);
  redirect(`/${locale}/dashboard/users?status=assigned`);
}

export async function removeUserRole(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = userRoleMutationSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/users?status=invalid`);
  }

  await removeManagedUserRole(supabase, user.id, parsed.data.userId, parsed.data.role);

  revalidatePath(`/${locale}/dashboard/users`);
  redirect(`/${locale}/dashboard/users?status=removed`);
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

export async function inviteUser(locale: Locale, formData: FormData) {
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
    redirect(`/${locale}/dashboard/users?status=invite-invalid`);
  }

  await inviteManagedUser(supabase, user.id, {
    ...parsed.data,
    locale,
    roleLabel: parsed.data.role,
  });

  revalidatePath(`/${locale}/dashboard/users`);
  redirect(`/${locale}/dashboard/users?status=invited`);
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
