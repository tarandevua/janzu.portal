"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveMyPractitionerProfile } from "@/server/services/practitioner.service";
import type { Database } from "@/types/database";
import {
  parseLanguages,
  practitionerProfileSchema,
} from "@/server/validators/practitioner.schema";

type UpdateFullNameArgs =
  Database["public"]["Functions"]["update_current_user_full_name"]["Args"];

type FullNameRpcClient = {
  rpc(
    functionName: "update_current_user_full_name",
    args: UpdateFullNameArgs
  ): Promise<{ error: { message: string } | null }>;
};

export async function savePractitionerProfile(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = practitionerProfileSchema.safeParse({
    fullName: formData.get("fullName"),
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

  const fullName = parsed.data.fullName ?? null;

  await supabase.auth.updateUser({
    data: {
      full_name: fullName ?? undefined,
    },
  });

  const fullNameRpcClient = supabase as unknown as FullNameRpcClient;
  const { error: userUpdateError } = await fullNameRpcClient.rpc("update_current_user_full_name", {
    target_user_id: user.id,
    target_full_name: fullName,
  });

  if (userUpdateError) {
    redirect(`/${locale}/dashboard/profile?status=invalid`);
  }

  await saveMyPractitionerProfile(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/profile`);
  revalidatePath(`/${locale}/practitioners`);
  redirect(`/${locale}/dashboard/profile?status=saved`);
}
