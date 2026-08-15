import type { SupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import type { Database } from "@/types/database";
import type {
  PractitionerProfile,
  PractitionerProfileInput,
  ProfileVisibilityInput,
  PractitionerPracticeLocation,
  PublicPractitionerGroup,
} from "@/server/models/practitioner.model";

type ProfileVisibilityArgs =
  Database["public"]["Functions"]["update_my_profile_visibility"]["Args"];

type ProfileVisibilityRpcClient = {
  rpc(
    functionName: "update_my_profile_visibility",
    args: ProfileVisibilityArgs
  ): Promise<{ data: PractitionerRow | null; error: { message: string } | null }>;
};

type PractitionerRow = {
  id: string;
  user_id: string;
  public_group?: PublicPractitionerGroup | null;
  display_name?: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  languages: string[];
  website: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  profile_image_url: string | null;
  is_public: boolean;
  directory_visibility?: "private" | "community" | "public";
  display_name_visibility?: "private" | "community" | "public";
  profile_image_visibility?: "private" | "community" | "public";
  bio_visibility?: "private" | "community" | "public";
  languages_visibility?: "private" | "community" | "public";
  location_visibility?: "private" | "community" | "public";
  website_visibility?: "private" | "community" | "public";
  social_links_visibility?: "private" | "community" | "public";
  visibility_configured_at?: string | null;
  created_at: string;
  updated_at: string;
};

type PractitionerLocationRow = {
  id: string;
  practitioner_id: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  note: string | null;
  sort_order: number;
};

type UserDisplayRow = Pick<Database["public"]["Tables"]["users"]["Row"], "full_name">;
type CertificationStatusRow = Pick<
  Database["public"]["Tables"]["certification_progress"]["Row"],
  "status"
>;

type PublicPractitionerRpcClient = {
  rpc(
    functionName: "list_public_practitioner_profiles"
  ): Promise<{ data: PractitionerRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "get_public_practitioner_profile",
    args: { target_profile_id: string }
  ): Promise<{ data: PractitionerRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "list_community_practitioner_profiles",
    args: { actor_user_id: string }
  ): Promise<{ data: PractitionerRow[] | null; error: { message: string } | null }>;
};

function toPracticeLocation(row: PractitionerLocationRow): PractitionerPracticeLocation {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city,
    country: row.country,
    note: row.note,
    sortOrder: row.sort_order,
  };
}

function getFallbackPracticeLocations(row: PractitionerRow): PractitionerPracticeLocation[] {
  if (typeof row.latitude !== "number" || typeof row.longitude !== "number") {
    return [];
  }

  return [
    {
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city,
      country: row.country,
      note: null,
      sortOrder: 0,
    },
  ];
}

function toProfile(
  row: PractitionerRow,
  practiceLocations: PractitionerPracticeLocation[] = getFallbackPracticeLocations(row)
): PractitionerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    publicGroup: row.public_group ?? "apprentice",
    displayName: row.display_name,
    bio: row.bio,
    country: row.country,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    practiceLocations,
    languages: row.languages,
    website: row.website,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    youtubeUrl: row.youtube_url,
    tiktokUrl: row.tiktok_url,
    profileImageUrl: row.profile_image_url,
    isPublic: row.is_public,
    visibility: {
      directory: row.directory_visibility ?? "private",
      displayName: row.display_name_visibility ?? "private",
      profileImage: row.profile_image_visibility ?? "private",
      bio: row.bio_visibility ?? "private",
      languages: row.languages_visibility ?? "private",
      location: row.location_visibility ?? "private",
      website: row.website_visibility ?? "private",
      socialLinks: row.social_links_visibility ?? "private",
      configuredAt: row.visibility_configured_at ?? null,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPractitionerPublicGroup(
  supabase: SupabaseServerClient,
  practitionerId: string,
  userId: string
): Promise<PublicPractitionerGroup> {
  const roles = await listUserRoles(supabase, userId);

  if (roles.includes("facilitator")) {
    return "facilitator";
  }

  if (roles.includes("instructor")) {
    return "instructor";
  }

  if (roles.includes("practitioner")) {
    return "participant";
  }

  const { data, error } = await supabase
    .from("certification_progress")
    .select("status")
    .eq("practitioner_id", practitionerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CertificationStatusRow | null)?.status === "approved"
    ? "participant"
    : "apprentice";
}

async function listPracticeLocationsByPractitionerIds(
  supabase: SupabaseServerClient,
  practitionerIds: string[]
) {
  if (practitionerIds.length === 0) {
    return new Map<string, PractitionerPracticeLocation[]>();
  }

  const { data, error } = await supabase
    .from("practitioner_locations")
    .select("*")
    .in("practitioner_id", practitionerIds)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const locationsByPractitionerId = new Map<string, PractitionerPracticeLocation[]>();

  ((data ?? []) as PractitionerLocationRow[]).forEach((row) => {
    const locations = locationsByPractitionerId.get(row.practitioner_id) ?? [];

    locations.push(toPracticeLocation(row));
    locationsByPractitionerId.set(row.practitioner_id, locations);
  });

  return locationsByPractitionerId;
}

async function attachPracticeLocations(
  supabase: SupabaseServerClient,
  rows: PractitionerRow[]
) {
  const locationsByPractitionerId = await listPracticeLocationsByPractitionerIds(
    supabase,
    rows.map((row) => row.id)
  );

  return rows.map((row) => {
    const practiceLocations = locationsByPractitionerId.get(row.id);

    return toProfile(row, practiceLocations?.length ? practiceLocations : getFallbackPracticeLocations(row));
  });
}

async function getUserFullName(supabase: SupabaseServerClient, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserDisplayRow | null)?.full_name ?? null;
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

  if (!data) {
    return null;
  }

  const practitioner = data as PractitionerRow;
  const publicGroup = await getPractitionerPublicGroup(supabase, practitioner.id, userId);
  const [profile] = await attachPracticeLocations(supabase, [
    {
      ...practitioner,
      public_group: publicGroup,
      display_name: await getUserFullName(supabase, userId),
    },
  ]);

  return profile;
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

  if (!profile) {
    return null;
  }

  const [profileWithLocations] = await attachPracticeLocations(supabase, [profile]);

  return profileWithLocations;
}

export async function listPublicPractitionerProfiles(supabase: SupabaseServerClient) {
  const publicRpcClient = supabase as unknown as PublicPractitionerRpcClient;
  const { data, error } = await publicRpcClient.rpc("list_public_practitioner_profiles");

  if (error) {
    throw new Error(error.message);
  }

  return attachPracticeLocations(supabase, data ?? []);
}

export async function listCommunityPractitionerProfiles(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const client = supabase as unknown as PublicPractitionerRpcClient;
  const { data, error } = await client.rpc("list_community_practitioner_profiles", {
    actor_user_id: actorUserId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toProfile(row, []));
}

export async function upsertPractitionerProfile(
  supabase: SupabaseServerClient,
  userId: string,
  input: PractitionerProfileInput
) {
  const practiceLocations = input.practiceLocations ?? [];
  const primaryLocation = practiceLocations[0] ?? null;
  const payload = {
    user_id: userId,
    bio: input.bio ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    latitude: primaryLocation?.latitude ?? input.latitude ?? null,
    longitude: primaryLocation?.longitude ?? input.longitude ?? null,
    languages: input.languages ?? [],
    website: input.website ?? null,
    instagram_url: input.instagramUrl ?? null,
    facebook_url: input.facebookUrl ?? null,
    youtube_url: input.youtubeUrl ?? null,
    tiktok_url: input.tiktokUrl ?? null,
    profile_image_url: input.profileImageUrl ?? null,
  } satisfies Database["public"]["Tables"]["practitioners"]["Insert"];

  const { data, error } = await supabase
    .from("practitioners")
    .upsert(payload as never, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const profile = toProfile(data);

  const { error: deleteError } = await supabase
    .from("practitioner_locations")
    .delete()
    .eq("practitioner_id", profile.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (practiceLocations.length > 0) {
    const { error: insertError } = await supabase
      .from("practitioner_locations")
      .insert(
        practiceLocations.map((location, index) => ({
          practitioner_id: profile.id,
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city ?? null,
          country: location.country ?? null,
          note: location.note ?? null,
          sort_order: index,
        })) as never
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return {
    ...profile,
    practiceLocations,
  };
}

export async function updatePractitionerProfileVisibility(
  supabase: SupabaseServerClient,
  userId: string,
  input: ProfileVisibilityInput
) {
  const rpcClient = supabase as unknown as ProfileVisibilityRpcClient;
  const { data, error } = await rpcClient.rpc("update_my_profile_visibility", {
    actor_user_id: userId,
    target_directory_visibility: input.directory,
    target_display_name_visibility: input.displayName,
    target_profile_image_visibility: input.profileImage,
    target_bio_visibility: input.bio,
    target_languages_visibility: input.languages,
    target_location_visibility: input.location,
    target_website_visibility: input.website,
    target_social_links_visibility: input.socialLinks,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Profile visibility could not be updated.");
  }

  return toProfile(data);
}
