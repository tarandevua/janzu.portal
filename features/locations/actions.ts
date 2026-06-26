"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { reviewLocation, submitMyLocation } from "@/server/services/location.service";
import { hasPermission } from "@/server/services/rbac.service";
import { locationReviewSchema, locationSchema } from "@/server/validators/location.schema";

export async function submitLocation(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    locationType: formData.get("locationType"),
    description: formData.get("description"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    accessInfo: formData.get("accessInfo"),
    photoUrl: formData.get("photoUrl"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/locations?status=invalid`);
  }

  await submitMyLocation(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  redirect(`/${locale}/dashboard/locations?status=created`);
}

export async function reviewLocationSubmission(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = locationReviewSchema.safeParse({
    locationId: formData.get("locationId"),
    action: formData.get("action"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/locations?status=review-invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "locations:approve")) {
    redirect(`/${locale}/dashboard/locations?status=review-forbidden`);
  }

  await reviewLocation(supabase, parsed.data.locationId, user.id, parsed.data.action);

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  redirect(
    `/${locale}/dashboard/locations?status=${
      parsed.data.action === "approve" ? "approved" : "rejected"
    }`
  );
}
