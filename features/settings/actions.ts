"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailPreferenceKeys } from "@/server/models/transactional-email.model";
import { updateMyEmailPreferences } from "@/server/services/transactional-email.service";
import { emailPreferencesSchema } from "@/server/validators/transactional-email.schema";

export async function updateEmailPreferences(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const parsed = emailPreferencesSchema.safeParse({
    preferences: emailPreferenceKeys.map((key) => ({
      key,
      enabled: formData.get(key) === "true",
    })),
  });
  if (!parsed.success) redirect(`/${locale}/dashboard/settings?status=email-preferences-invalid`);

  try {
    await updateMyEmailPreferences(supabase, user.id, parsed.data.preferences);
  } catch {
    redirect(`/${locale}/dashboard/settings?status=email-preferences-failed`);
  }
  revalidatePath(`/${locale}/dashboard/settings`);
  redirect(`/${locale}/dashboard/settings?status=email-preferences-saved`);
}
