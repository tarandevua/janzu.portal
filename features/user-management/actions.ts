"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignManagedUserRole,
  inviteManagedUser,
  removeManagedUserRole,
} from "@/server/services/user-management.service";
import { updateAdminAuthSettings } from "@/server/services/platform-settings.service";
import {
  authSettingsSchema,
  userInviteSchema,
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
    redirect(`/${locale}/dashboard/users?status=auth-settings-invalid`);
  }

  await updateAdminAuthSettings(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/users`);
  redirect(`/${locale}/dashboard/users?status=auth-settings-saved`);
}
