"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  reviewLocation,
  resubmitRejectedLocation,
  saveLocationMedia,
  submitMyLocation,
} from "@/server/services/location.service";
import { hasPermission } from "@/server/services/rbac.service";
import {
  isUploadedFile,
  uploadLocationImage,
  validateLocationImageUploadFiles,
} from "@/server/services/r2-storage.service";
import { locationReviewSchema, locationSchema } from "@/server/validators/location.schema";

export async function submitLocation(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const locationImages = formData
    .getAll("locationImages")
    .filter((value): value is File => isUploadedFile(value) && value.size > 0);
  const imageValidation = validateLocationImageUploadFiles(locationImages);

  if (!imageValidation.ok) {
    redirect(`/${locale}/dashboard/locations?status=${imageValidation.code}`);
  }

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    locationType: formData.get("locationType"),
    description: formData.get("description"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    accessInfo: formData.get("accessInfo"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/locations?status=invalid`);
  }

  const location = await submitMyLocation(supabase, user.id, parsed.data);
  const uploadedMedia = [];

  for (const [index, image] of locationImages.entries()) {
    const upload = await uploadLocationImage({
      locationId: location.id,
      file: image,
      sortOrder: index,
    });

    if (!upload.ok) {
      redirect(`/${locale}/dashboard/locations?status=${upload.code}`);
    }

    uploadedMedia.push({
      storageKey: upload.key,
      altText: `${parsed.data.name} ${index + 1}`,
      sortOrder: index,
    });
  }

  await saveLocationMedia(supabase, location.id, uploadedMedia);

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  redirect(`/${locale}/dashboard/locations?status=created`);
}

export async function updateRejectedLocation(
  locale: Locale,
  locationId: string,
  formData: FormData
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const locationImages = formData
    .getAll("locationImages")
    .filter((value): value is File => isUploadedFile(value) && value.size > 0);
  const imageValidation = validateLocationImageUploadFiles(locationImages);

  if (!imageValidation.ok) {
    redirect(`/${locale}/dashboard/locations?status=${imageValidation.code}`);
  }

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    locationType: formData.get("locationType"),
    description: formData.get("description"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    accessInfo: formData.get("accessInfo"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/locations?status=invalid`);
  }

  const location = await resubmitRejectedLocation(supabase, locationId, user.id, parsed.data);
  const uploadedMedia = [];

  for (const [index, image] of locationImages.entries()) {
    const upload = await uploadLocationImage({
      locationId: location.id,
      file: image,
      sortOrder: index + 100,
    });

    if (!upload.ok) {
      redirect(`/${locale}/dashboard/locations?status=${upload.code}`);
    }

    uploadedMedia.push({
      storageKey: upload.key,
      altText: `${parsed.data.name} ${index + 1}`,
      sortOrder: index + 100,
    });
  }

  await saveLocationMedia(supabase, location.id, uploadedMedia);

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  redirect(`/${locale}/dashboard/locations?status=updated`);
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
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/locations?status=review-invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "locations:approve")) {
    redirect(`/${locale}/dashboard/locations?status=review-forbidden`);
  }

  await reviewLocation(
    supabase,
    parsed.data.locationId,
    user.id,
    parsed.data.action,
    parsed.data.reason
  );

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  redirect(
    `/${locale}/dashboard/locations?status=${
      parsed.data.action === "approve" ? "approved" : "rejected"
    }`
  );
}
