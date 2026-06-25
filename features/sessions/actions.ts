"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMySession } from "@/server/services/session.service";
import { sessionSchema } from "@/server/validators/session.schema";

export async function createSession(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = sessionSchema.safeParse({
    clientId: formData.get("clientId"),
    sessionDate: formData.get("sessionDate"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/sessions?status=invalid`);
  }

  await createMySession(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/sessions`);
  redirect(`/${locale}/dashboard/sessions?status=created`);
}
