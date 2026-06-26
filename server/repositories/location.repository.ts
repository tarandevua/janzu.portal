import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Location, LocationInput, LocationMedia, LocationWithMedia } from "@/server/models/location.model";

type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
type LocationInsert = Database["public"]["Tables"]["locations"]["Insert"];
type MediaRow = Database["public"]["Tables"]["location_media"]["Row"];
type ApproveArgs = Database["public"]["Functions"]["approve_location"]["Args"];
type RejectArgs = Database["public"]["Functions"]["reject_location"]["Args"];

type LocationRpcClient = {
  rpc(
    functionName: "approve_location",
    args: ApproveArgs
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "reject_location",
    args: RejectArgs
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
};

type LocationJoinRow = LocationRow & {
  location_media: MediaRow[] | null;
};

function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    submittedBy: row.submitted_by,
    name: row.name,
    locationType: row.location_type,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    accessInfo: row.access_info,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMedia(row: MediaRow): LocationMedia {
  return {
    id: row.id,
    locationId: row.location_id,
    storageKey: row.storage_key,
    publicUrl: row.public_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function toLocationWithMedia(row: LocationJoinRow): LocationWithMedia {
  return {
    ...toLocation(row),
    media: (row.location_media ?? []).map(toMedia),
  };
}

export async function listApprovedLocations(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .eq("status", "approved")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LocationJoinRow[]).map(toLocationWithMedia);
}

export async function listLocationsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .eq("submitted_by", practitionerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LocationJoinRow[]).map(toLocationWithMedia);
}

export async function listLocationsForReview(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .in("status", ["pending", "approved", "rejected"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LocationJoinRow[]).map(toLocationWithMedia);
}

export async function createLocationForPractitioner(
  supabase: SupabaseServerClient,
  practitionerId: string,
  input: LocationInput
) {
  const payload = {
    submitted_by: practitionerId,
    name: input.name,
    location_type: input.locationType,
    description: input.description ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    access_info: input.accessInfo ?? null,
  } satisfies LocationInsert;

  const { data, error } = await supabase
    .from("locations")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const location = data as LocationRow;

  if (input.photoUrl) {
    const { error: mediaError } = await supabase.from("location_media").insert({
      location_id: location.id,
      public_url: input.photoUrl,
      alt_text: input.name,
    } as never);

    if (mediaError) {
      throw new Error(mediaError.message);
    }
  }

  return toLocation(location);
}

export async function approveLocationById(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("approve_location", {
    target_location_id: locationId,
    reviewer_user_id: reviewerUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Location approval failed.");
  }

  return toLocation(data);
}

export async function rejectLocationById(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("reject_location", {
    target_location_id: locationId,
    reviewer_user_id: reviewerUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Location rejection failed.");
  }

  return toLocation(data);
}
