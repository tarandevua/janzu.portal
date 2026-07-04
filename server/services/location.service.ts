import type { SupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LocationInput, LocationMediaInput } from "@/server/models/location.model";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import {
  addLocationMedia,
  approveLocationById,
  createLocationForPractitioner,
  listApprovedLocations,
  listDeletedLocations,
  listLocationMediaStorageKeys,
  listLocationsByPractitionerId,
  listLocationsForReview,
  permanentlyDeleteLocationById,
  rejectLocationById,
  restoreDeletedLocationById,
  resubmitRejectedLocationById,
  softDeleteLocationById,
  toggleLocationReviewHelpfulVote,
  upsertLocationCommunityReview,
} from "@/server/repositories/location.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { hasRole } from "@/server/services/rbac.service";
import { deletePrivateR2Object } from "@/server/services/r2-storage.service";

export async function requireLocationPractitionerId(
  supabase: SupabaseServerClient,
  userId: string
) {
  const profile = await getPractitionerProfileByUserId(supabase, userId);

  if (!profile) {
    throw new Error("Practitioner profile is required before submitting locations.");
  }

  return profile.id;
}

export function listPublicLocations(
  supabase: SupabaseServerClient,
  options: { communityReviewerUserId?: string | null } = {}
) {
  return listApprovedLocations(supabase, options);
}

export async function listMyLocations(supabase: SupabaseServerClient, userId: string) {
  const practitionerId = await requireLocationPractitionerId(supabase, userId);
  return listLocationsByPractitionerId(supabase, practitionerId);
}

export async function submitMyLocation(
  supabase: SupabaseServerClient,
  userId: string,
  input: LocationInput
) {
  const practitionerId = await requireLocationPractitionerId(supabase, userId);
  return createLocationForPractitioner(supabase, practitionerId, input);
}

export function saveLocationMedia(
  supabase: SupabaseServerClient,
  locationId: string,
  media: LocationMediaInput[]
) {
  return addLocationMedia(supabase, locationId, media);
}

export function resubmitRejectedLocation(
  supabase: SupabaseServerClient,
  locationId: string,
  userId: string,
  input: LocationInput
) {
  return resubmitRejectedLocationById(supabase, locationId, userId, input);
}

export function listLocationReviewQueue(supabase: SupabaseServerClient) {
  return listLocationsForReview(supabase);
}

export function listDeletedLocationQueue(supabase: SupabaseServerClient) {
  return listDeletedLocations(supabase);
}

export async function reviewLocation(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string,
  action: "approve" | "reject",
  reason?: string | null
) {
  if (action === "approve") {
    return approveLocationById(supabase, locationId, reviewerUserId, reason);
  }

  return rejectLocationById(supabase, locationId, reviewerUserId, reason ?? "");
}

export function saveLocationCommunityReview(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string,
  rating: number,
  reviewText: string | null
) {
  return upsertLocationCommunityReview(supabase, locationId, reviewerUserId, rating, reviewText);
}

export function toggleLocationReviewHelpful(
  supabase: SupabaseServerClient,
  reviewId: string,
  userId: string
) {
  return toggleLocationReviewHelpfulVote(supabase, reviewId, userId);
}

export function deleteLocation(
  supabase: SupabaseServerClient,
  locationId: string,
  actorUserId: string
) {
  return softDeleteLocationById(supabase, locationId, actorUserId);
}

export function restoreLocation(
  supabase: SupabaseServerClient,
  locationId: string,
  actorUserId: string
) {
  return restoreDeletedLocationById(supabase, locationId, actorUserId);
}

export async function permanentlyDeleteLocation(
  supabase: SupabaseServerClient,
  locationId: string,
  actorUserId: string
) {
  const roles = await listUserRoles(supabase, actorUserId);

  if (!hasRole(roles, "admin")) {
    throw new Error("Admin access is required to permanently delete locations.");
  }

  const admin = createSupabaseAdminClient();
  const adminClient = admin as unknown as SupabaseServerClient;
  const mediaKeys = await listLocationMediaStorageKeys(adminClient, locationId);

  for (const mediaKey of mediaKeys) {
    await deletePrivateR2Object(mediaKey);
  }

  await permanentlyDeleteLocationById(adminClient, locationId);
}
