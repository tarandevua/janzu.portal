import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { LocationInput } from "@/server/models/location.model";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import {
  approveLocationById,
  createLocationForPractitioner,
  listApprovedLocations,
  listLocationsByPractitionerId,
  listLocationsForReview,
  rejectLocationById,
} from "@/server/repositories/location.repository";

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

export function listPublicLocations(supabase: SupabaseServerClient) {
  return listApprovedLocations(supabase);
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

export function listLocationReviewQueue(supabase: SupabaseServerClient) {
  return listLocationsForReview(supabase);
}

export async function reviewLocation(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string,
  action: "approve" | "reject"
) {
  if (action === "approve") {
    return approveLocationById(supabase, locationId, reviewerUserId);
  }

  return rejectLocationById(supabase, locationId, reviewerUserId);
}
