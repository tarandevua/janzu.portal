import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PractitionerProfile, PractitionerProfileInput } from "@/server/models/practitioner.model";

type PractitionerRow = {
  id: string;
  user_id: string;
  display_name?: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  languages: string[];
  website: string | null;
  profile_image_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type PublicPractitionerRpcClient = {
  rpc(
    functionName: "list_public_practitioner_profiles"
  ): Promise<{ data: PractitionerRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "get_public_practitioner_profile",
    args: { target_profile_id: string }
  ): Promise<{ data: PractitionerRow[] | null; error: { message: string } | null }>;
};

function toProfile(row: PractitionerRow): PractitionerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio,
    country: row.country,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    languages: row.languages,
    website: row.website,
    profileImageUrl: row.profile_image_url,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPractitionerProfileByUserId(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("practitioners")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toProfile(data) : null;
}

export async function getPublicPractitionerProfile(
  supabase: SupabaseServerClient,
  profileId: string
) {
  const publicRpcClient = supabase as unknown as PublicPractitionerRpcClient;
  const { data, error } = await publicRpcClient.rpc("get_public_practitioner_profile", {
    target_profile_id: profileId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const [profile] = data ?? [];

  return profile ? toProfile(profile) : null;
}

export async function listPublicPractitionerProfiles(supabase: SupabaseServerClient) {
  const publicRpcClient = supabase as unknown as PublicPractitionerRpcClient;
  const { data, error } = await publicRpcClient.rpc("list_public_practitioner_profiles");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toProfile);
}

export async function upsertPractitionerProfile(
  supabase: SupabaseServerClient,
  userId: string,
  input: PractitionerProfileInput
) {
  const payload = {
    user_id: userId,
    bio: input.bio ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    languages: input.languages ?? [],
    website: input.website ?? null,
    profile_image_url: input.profileImageUrl ?? null,
    is_public: input.isPublic ?? false,
  } satisfies Database["public"]["Tables"]["practitioners"]["Insert"];

  const { data, error } = await supabase
    .from("practitioners")
    .upsert(payload as never, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toProfile(data);
}
