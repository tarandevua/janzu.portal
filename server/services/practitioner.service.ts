import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { PractitionerProfileInput } from "@/server/models/practitioner.model";
import type { ProfileVisibilityInput } from "@/server/models/practitioner.model";
import {
  getPractitionerProfileByUserId,
  getPublicPractitionerProfile,
  listPublicPractitionerProfiles,
  listCommunityPractitionerProfiles,
  upsertPractitionerProfile,
  updatePractitionerProfileVisibility,
} from "@/server/repositories/practitioner.repository";

export async function getMyPractitionerProfile(
  supabase: SupabaseServerClient,
  userId: string
) {
  return getPractitionerProfileByUserId(supabase, userId);
}

export function saveMyProfileVisibility(
  supabase: SupabaseServerClient,
  userId: string,
  input: ProfileVisibilityInput
) {
  return updatePractitionerProfileVisibility(supabase, userId, input);
}

export async function saveMyPractitionerProfile(
  supabase: SupabaseServerClient,
  userId: string,
  input: PractitionerProfileInput
) {
  return upsertPractitionerProfile(supabase, userId, input);
}

export async function findPublicPractitionerProfile(
  supabase: SupabaseServerClient,
  profileId: string
) {
  return getPublicPractitionerProfile(supabase, profileId);
}

export async function findPublicPractitionerProfiles(supabase: SupabaseServerClient) {
  return listPublicPractitionerProfiles(supabase);
}

export function findCommunityPractitionerProfiles(
  supabase: SupabaseServerClient,
  userId: string
) {
  return listCommunityPractitionerProfiles(supabase, userId);
}
