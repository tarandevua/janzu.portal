"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  markAllMyNotificationsRead,
  markMyNotificationRead,
} from "@/server/services/notification.service";
import { markNotificationReadSchema } from "@/server/validators/notification.schema";

export async function markNotificationRead(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = markNotificationReadSchema.safeParse({
    notificationId: formData.get("notificationId"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/notifications?status=invalid`);
  }

  await markMyNotificationRead(supabase, parsed.data.notificationId, user.id);

  revalidatePath(`/${locale}/dashboard/notifications`);
}

export async function markAllNotificationsRead(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  await markAllMyNotificationsRead(supabase, user.id);

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/notifications`);
}
