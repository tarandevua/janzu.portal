"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveMyPractitionerProfile } from "@/server/services/practitioner.service";
import {
  parseLanguages,
  practitionerProfileSchema,
} from "@/server/validators/practitioner.schema";

export async function savePractitionerProfile(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = practitionerProfileSchema.safeParse({
    bio: formData.get("bio"),
    country: formData.get("country"),
    city: formData.get("city"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    languages: parseLanguages(formData.get("languages")),
    website: formData.get("website"),
    profileImageUrl: formData.get("profileImageUrl"),
    isPublic: formData.get("isPublic") === "true",
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/profile?status=invalid`);
  }

  await saveMyPractitionerProfile(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/practitioners`);
  redirect(`/${locale}/dashboard/profile?status=saved`);
}
