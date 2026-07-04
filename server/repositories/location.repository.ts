import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  Location,
  LocationCommunityReview,
  LocationInput,
  LocationMedia,
  LocationMediaInput,
  LocationReviewLog,
  LocationWithMedia,
} from "@/server/models/location.model";

type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
type LocationInsert = Database["public"]["Tables"]["locations"]["Insert"];
type MediaRow = Database["public"]["Tables"]["location_media"]["Row"];
type HelpfulVoteRow = Database["public"]["Tables"]["location_review_helpful_votes"]["Row"];
type CommunityReviewRow =
  Database["public"]["Functions"]["list_location_community_reviews"]["Returns"][number];
type ReviewLogRow = {
  id: string;
  location_id: string;
  reviewer_id: string;
  action: "approve" | "reject";
  reason: string | null;
  created_at: string;
};
type UserDisplayRow = {
  id: string;
  email: string;
  full_name: string | null;
};
type LocationJoinRow = LocationRow & {
  location_media: MediaRow[] | null;
};
type LocationWithReviewData = LocationJoinRow & {
  approvedByName?: string | null;
  latestReview?: LocationReviewLog | null;
};

type LocationRpcClient = {
  rpc(
    functionName: "approve_location",
    args: { target_location_id: string; reviewer_user_id: string; review_reason?: string | null }
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "reject_location",
    args: { target_location_id: string; reviewer_user_id: string; review_reason: string }
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "resubmit_rejected_location",
    args: {
      target_location_id: string;
      actor_user_id: string;
      target_name: string;
      target_location_type: LocationInput["locationType"];
      target_description: string | null;
      target_latitude: number;
      target_longitude: number;
      target_temperature_value: number | null;
      target_temperature_unit: LocationInput["temperatureUnit"];
      target_access_info: string | null;
    }
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "soft_delete_location",
    args: { target_location_id: string; actor_user_id: string }
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "restore_deleted_location",
    args: { target_location_id: string; actor_user_id: string }
  ): Promise<{ data: LocationRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "permanently_delete_location",
    args: { target_location_id: string; actor_user_id: string }
  ): Promise<{ data: null; error: { message: string } | null }>;
  rpc(
    functionName: "list_location_community_reviews",
    args: Database["public"]["Functions"]["list_location_community_reviews"]["Args"]
  ): Promise<{ data: CommunityReviewRow[] | null; error: { message: string } | null }>;
};

function toLocation(row: LocationRow & {
  approvedByName?: string | null;
  latestReview?: LocationReviewLog | null;
}): Location {
  return {
    id: row.id,
    submittedBy: row.submitted_by,
    name: row.name,
    locationType: row.location_type,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    temperatureValue: row.temperature_value,
    temperatureUnit: row.temperature_unit,
    accessInfo: row.access_info,
    status: row.status,
    approvedBy: row.approved_by,
    approvedByName: row.approvedByName,
    approvedAt: row.approved_at,
    isDeleted: row.is_deleted,
    latestReview: row.latestReview,
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

function toReviewLog(
  row: ReviewLogRow,
  reviewerNames: Map<string, string> = new Map()
): LocationReviewLog {
  return {
    id: row.id,
    locationId: row.location_id,
    reviewerId: row.reviewer_id,
    reviewerName: reviewerNames.get(row.reviewer_id) ?? null,
    action: row.action,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function getDisplayName(user: UserDisplayRow) {
  return user.full_name ?? user.email;
}

async function attachReviewData(
  supabase: SupabaseServerClient,
  rows: LocationJoinRow[],
  options: { includeLogs: boolean; includeReviewerNames: boolean }
): Promise<LocationWithReviewData[]> {
  if (rows.length === 0) {
    return [];
  }

  if (!options.includeLogs) {
    return rows;
  }

  const locationIds = rows.map((row) => row.id);
  const { data: logsData, error: logsError } = await supabase
    .from("location_review_logs")
    .select("*")
    .in("location_id", locationIds)
    .order("created_at", { ascending: false });

  if (logsError) {
    throw new Error(logsError.message);
  }

  const logRows = (logsData ?? []) as ReviewLogRow[];
  const reviewerNames = new Map<string, string>();

  if (options.includeReviewerNames) {
    const userIds = [
      ...new Set([
        ...rows.map((row) => row.approved_by).filter(Boolean),
        ...logRows.map((row) => row.reviewer_id),
      ] as string[]),
    ];

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      if (usersError) {
        throw new Error(usersError.message);
      }

      ((usersData ?? []) as UserDisplayRow[]).forEach((user) => {
        reviewerNames.set(user.id, getDisplayName(user));
      });
    }
  }

  const latestLogByLocationId = new Map<string, LocationReviewLog>();

  logRows.forEach((log) => {
    if (!latestLogByLocationId.has(log.location_id)) {
      latestLogByLocationId.set(log.location_id, toReviewLog(log, reviewerNames));
    }
  });

  return rows.map((row) => ({
    ...row,
    approvedByName: row.approved_by ? reviewerNames.get(row.approved_by) ?? null : null,
    latestReview: latestLogByLocationId.get(row.id) ?? null,
  }));
}

function toLocationWithMedia(row: LocationWithReviewData): LocationWithMedia {
  return {
    ...toLocation(row),
    media: (row.location_media ?? []).map(toMedia),
  };
}

function toCommunityReview(row: CommunityReviewRow): LocationCommunityReview {
  return {
    id: row.review_id,
    locationId: row.location_id,
    reviewerId: row.reviewer_id,
    rating: row.rating,
    reviewText: row.review_text,
    helpfulCount: Number(row.helpful_count),
    viewerMarkedHelpful: row.viewer_marked_helpful,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function withCommunityReviews(
  locations: LocationWithMedia[],
  reviews: LocationCommunityReview[]
) {
  const reviewsByLocationId = new Map<string, LocationCommunityReview[]>();

  reviews.forEach((review) => {
    const existing = reviewsByLocationId.get(review.locationId) ?? [];
    existing.push(review);
    reviewsByLocationId.set(review.locationId, existing);
  });

  return locations.map((location) => {
    const communityReviews = reviewsByLocationId.get(location.id) ?? [];
    const reviewsCount = communityReviews.length;
    const averageRating =
      reviewsCount > 0
        ? communityReviews.reduce((total, review) => total + review.rating, 0) / reviewsCount
        : null;

    return {
      ...location,
      communityReviews,
      reviewsCount,
      averageRating,
    };
  });
}

export async function listApprovedLocations(
  supabase: SupabaseServerClient,
  options: { communityReviewerUserId?: string | null } = {}
) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .eq("status", "approved")
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = await attachReviewData(supabase, (data ?? []) as LocationJoinRow[], {
    includeLogs: false,
    includeReviewerNames: false,
  });

  const locations = rows.map(toLocationWithMedia);

  if (!options.communityReviewerUserId) {
    return locations;
  }

  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data: reviewsData, error: reviewsError } = await rpcClient.rpc(
    "list_location_community_reviews",
    { actor_user_id: options.communityReviewerUserId }
  );

  if (reviewsError) {
    throw new Error(reviewsError.message);
  }

  return withCommunityReviews(locations, (reviewsData ?? []).map(toCommunityReview));
}

export async function listLocationsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .eq("submitted_by", practitionerId)
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = await attachReviewData(supabase, (data ?? []) as LocationJoinRow[], {
    includeLogs: true,
    includeReviewerNames: false,
  });

  return rows.map(toLocationWithMedia);
}

export async function listLocationsForReview(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .in("status", ["pending", "approved", "rejected"])
    .eq("is_deleted", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = await attachReviewData(supabase, (data ?? []) as LocationJoinRow[], {
    includeLogs: true,
    includeReviewerNames: true,
  });

  return rows.map(toLocationWithMedia);
}

export async function listDeletedLocations(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("locations")
    .select("*, location_media(*)")
    .eq("is_deleted", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = await attachReviewData(supabase, (data ?? []) as LocationJoinRow[], {
    includeLogs: true,
    includeReviewerNames: true,
  });

  return rows.map(toLocationWithMedia);
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
    temperature_value: input.temperatureValue ?? null,
    temperature_unit: input.temperatureUnit ?? null,
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

  return toLocation(location);
}

export async function addLocationMedia(
  supabase: SupabaseServerClient,
  locationId: string,
  media: LocationMediaInput[]
) {
  if (media.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("location_media")
    .insert(
      media.map((item) => ({
        location_id: locationId,
        storage_key: item.storageKey,
        public_url: item.publicUrl ?? null,
        alt_text: item.altText ?? null,
        sort_order: item.sortOrder,
      })) as never
    )
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MediaRow[]).map(toMedia);
}

export async function listLocationMediaStorageKeys(
  supabase: SupabaseServerClient,
  locationId: string
) {
  const { data, error } = await supabase
    .from("location_media")
    .select("storage_key")
    .eq("location_id", locationId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Pick<MediaRow, "storage_key">[])
    .map((item) => item.storage_key)
    .filter((key): key is string => Boolean(key));
}

export async function resubmitRejectedLocationById(
  supabase: SupabaseServerClient,
  locationId: string,
  actorUserId: string,
  input: LocationInput
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("resubmit_rejected_location", {
    target_location_id: locationId,
    actor_user_id: actorUserId,
    target_name: input.name,
    target_location_type: input.locationType,
    target_description: input.description ?? null,
    target_latitude: input.latitude,
    target_longitude: input.longitude,
    target_temperature_value: input.temperatureValue ?? null,
    target_temperature_unit: input.temperatureUnit ?? null,
    target_access_info: input.accessInfo ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Location update failed.");
  }

  return toLocation(data);
}

export async function approveLocationById(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string,
  reason?: string | null
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("approve_location", {
    target_location_id: locationId,
    reviewer_user_id: reviewerUserId,
    review_reason: reason ?? null,
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
  reviewerUserId: string,
  reason: string
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("reject_location", {
    target_location_id: locationId,
    reviewer_user_id: reviewerUserId,
    review_reason: reason,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Location rejection failed.");
  }

  return toLocation(data);
}

export async function softDeleteLocationById(
  supabase: SupabaseServerClient,
  locationId: string,
  actorUserId: string
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("soft_delete_location", {
    target_location_id: locationId,
    actor_user_id: actorUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Location deletion failed.");
  }

  return toLocation(data);
}

export async function restoreDeletedLocationById(
  supabase: SupabaseServerClient,
  locationId: string,
  actorUserId: string
) {
  const rpcClient = supabase as unknown as LocationRpcClient;
  const { data, error } = await rpcClient.rpc("restore_deleted_location", {
    target_location_id: locationId,
    actor_user_id: actorUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Location restore failed.");
  }

  return toLocation(data);
}

export async function permanentlyDeleteLocationById(
  supabase: SupabaseServerClient,
  locationId: string
) {
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId)
    .eq("is_deleted", true);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertLocationCommunityReview(
  supabase: SupabaseServerClient,
  locationId: string,
  reviewerUserId: string,
  rating: number,
  reviewText: string | null
) {
  const { data, error } = await supabase
    .from("location_reviews")
    .upsert(
      {
        location_id: locationId,
        reviewer_id: reviewerUserId,
        rating,
        review_text: reviewText,
      } as never,
      { onConflict: "location_id,reviewer_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function toggleLocationReviewHelpfulVote(
  supabase: SupabaseServerClient,
  reviewId: string,
  userId: string
) {
  const { data: existingVoteData, error: existingError } = await supabase
    .from("location_review_helpful_votes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingVote = existingVoteData as Pick<HelpfulVoteRow, "id"> | null;

  if (existingVote) {
    const { error } = await supabase
      .from("location_review_helpful_votes")
      .delete()
      .eq("id", existingVote.id);

    if (error) {
      throw new Error(error.message);
    }

    return false;
  }

  const { error } = await supabase.from("location_review_helpful_votes").insert({
    review_id: reviewId,
    user_id: userId,
  } as never);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
