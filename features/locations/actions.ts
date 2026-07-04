"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  deleteLocation,
  permanentlyDeleteLocation,
  reviewLocation,
  restoreLocation,
  resubmitRejectedLocation,
  saveLocationMedia,
  saveLocationCommunityReview,
  submitMyLocation,
  toggleLocationReviewHelpful,
} from "@/server/services/location.service";
import { hasPermission } from "@/server/services/rbac.service";
import {
  isUploadedFile,
  uploadLocationImage,
  validateLocationImageUploadFiles,
} from "@/server/services/r2-storage.service";
import {
  locationCommunityReviewSchema,
  locationMutationSchema,
  locationReviewHelpfulSchema,
  locationReviewSchema,
  locationSchema,
  permanentLocationDeleteSchema,
} from "@/server/validators/location.schema";

export type LocationDeleteActionResult = {
  ok: boolean;
  status: "deleted" | "auth-required" | "delete-invalid" | "delete-forbidden";
};

export type LocationRestoreActionResult = {
  ok: boolean;
  status: "restored" | "auth-required" | "restore-invalid" | "restore-forbidden";
};

export type LocationPermanentDeleteActionResult = {
  ok: boolean;
  status:
    | "permanent-deleted"
    | "auth-required"
    | "permanent-delete-invalid"
    | "permanent-delete-forbidden";
};

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
    temperatureValue: formData.get("temperatureValue"),
    temperatureUnit: formData.get("temperatureUnit"),
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
    temperatureValue: formData.get("temperatureValue"),
    temperatureUnit: formData.get("temperatureUnit"),
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
    redirect(`/${locale}/dashboard/locations?tab=approvals&status=review-invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "locations:approve")) {
    redirect(`/${locale}/dashboard/locations?tab=approvals&status=review-forbidden`);
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
    `/${locale}/dashboard/locations?tab=approvals&status=${
      parsed.data.action === "approve" ? "approved" : "rejected"
    }`
  );
}

export async function deleteLocationSubmission(
  locale: Locale,
  redirectTab: "submitted" | "approvals",
  formData: FormData
) {
  const result = await deleteLocationSubmissionInline(locale, formData);
  const tabQuery = redirectTab === "approvals" ? "tab=approvals&" : "";

  if (result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }

  redirect(`/${locale}/dashboard/locations?${tabQuery}status=${result.status}`);
}

export async function deleteLocationSubmissionInline(
  locale: Locale,
  formData: FormData
): Promise<LocationDeleteActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = locationMutationSchema.safeParse({
    locationId: formData.get("locationId"),
  });

  if (!parsed.success) {
    return { ok: false, status: "delete-invalid" };
  }

  try {
    await deleteLocation(supabase, parsed.data.locationId, user.id);
  } catch {
    return { ok: false, status: "delete-forbidden" };
  }

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  return { ok: true, status: "deleted" };
}

export async function restoreDeletedLocation(locale: Locale, formData: FormData) {
  const result = await restoreDeletedLocationInline(locale, formData);

  if (result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }

  redirect(`/${locale}/dashboard/locations?tab=deleted&status=${result.status}`);
}

export async function restoreDeletedLocationInline(
  locale: Locale,
  formData: FormData
): Promise<LocationRestoreActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = locationMutationSchema.safeParse({
    locationId: formData.get("locationId"),
  });

  if (!parsed.success) {
    return { ok: false, status: "restore-invalid" };
  }

  try {
    await restoreLocation(supabase, parsed.data.locationId, user.id);
  } catch {
    return { ok: false, status: "restore-forbidden" };
  }

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  return { ok: true, status: "restored" };
}

export async function permanentlyDeleteLocationInline(
  locale: Locale,
  formData: FormData
): Promise<LocationPermanentDeleteActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const parsed = permanentLocationDeleteSchema.safeParse({
    locationId: formData.get("locationId"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return { ok: false, status: "permanent-delete-invalid" };
  }

  try {
    await permanentlyDeleteLocation(supabase, parsed.data.locationId, user.id);
  } catch {
    return { ok: false, status: "permanent-delete-forbidden" };
  }

  revalidatePath(`/${locale}/dashboard/locations`);
  revalidatePath(`/${locale}/locations`);
  return { ok: true, status: "permanent-deleted" };
}

export async function submitLocationCommunityReview(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = locationCommunityReviewSchema.safeParse({
    locationId: formData.get("locationId"),
    rating: formData.get("rating"),
    reviewText: formData.get("reviewText"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/locations?status=review-invalid`);
  }

  await saveLocationCommunityReview(
    supabase,
    parsed.data.locationId,
    user.id,
    parsed.data.rating,
    parsed.data.reviewText ?? null
  );

  revalidatePath(`/${locale}/locations`);
  redirect(`/${locale}/locations?status=review-saved`);
}

export async function toggleHelpfulLocationReview(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = locationReviewHelpfulSchema.safeParse({
    reviewId: formData.get("reviewId"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/locations?status=helpful-invalid`);
  }

  await toggleLocationReviewHelpful(supabase, parsed.data.reviewId, user.id);

  revalidatePath(`/${locale}/locations`);
  redirect(`/${locale}/locations?status=helpful-updated`);
}
