import type { SupabaseServerClient } from "@/lib/supabase/server";
import { getR2MediaUrl } from "@/lib/r2-media";
import type { Database } from "@/types/database";
import type { CommunityEvent, EventInput, EventMedia, EventRsvp } from "@/server/models/event.model";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
type EventMediaRow = Database["public"]["Tables"]["event_media"]["Row"];
type EventMediaInsert = Database["public"]["Tables"]["event_media"]["Insert"];
type RsvpRow = Database["public"]["Tables"]["event_rsvps"]["Row"];
type RsvpEventReference = Pick<RsvpRow, "event_id">;
type RsvpArgs = Database["public"]["Functions"]["rsvp_to_event"]["Args"];

type EventWithCountRow = EventRow & {
  event_rsvps: { count: number }[] | null;
  event_media?: EventMediaRow[] | null;
};

type EventMapperOptions = {
  currentUserRsvpEventIds?: Set<string>;
};

type EventRpcClient = {
  rpc(
    functionName: "rsvp_to_event",
    args: RsvpArgs
  ): Promise<{ data: RsvpRow | null; error: { message: string } | null }>;
};

function getRsvpCount(row: EventWithCountRow) {
  return row.event_rsvps?.[0]?.count ?? 0;
}

function toEvent(row: EventWithCountRow, options: EventMapperOptions = {}): CommunityEvent {
  return {
    id: row.id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rsvpCount: getRsvpCount(row),
    hasCurrentUserRsvp: options.currentUserRsvpEventIds?.has(row.id) ?? false,
    media: (row.event_media ?? []).map(toEventMedia),
  };
}

function toEventMedia(row: EventMediaRow): EventMedia {
  return {
    id: row.id,
    eventId: row.event_id,
    storageKey: row.storage_key,
    url: getR2MediaUrl(row.storage_key),
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function toRsvp(row: RsvpRow): EventRsvp {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

const eventSelect = "*, event_rsvps(count), event_media(*)";

export async function listPublishedEvents(
  supabase: SupabaseServerClient,
  currentUserId?: string | null
) {
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as EventWithCountRow[];

  if (!currentUserId || rows.length === 0) {
    return rows.map((row) => toEvent(row));
  }

  const { data: rsvps, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("user_id", currentUserId)
    .in(
      "event_id",
      rows.map((row) => row.id)
    );

  if (rsvpError) {
    throw new Error(rsvpError.message);
  }

  const currentUserRsvpEventIds = new Set(
    ((rsvps ?? []) as RsvpEventReference[]).map((rsvp) => rsvp.event_id)
  );

  return rows.map((row) => toEvent(row, { currentUserRsvpEventIds }));
}

export async function listManagedEvents(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as EventWithCountRow[]).map((row) => toEvent(row));
}

export async function createEvent(
  supabase: SupabaseServerClient,
  userId: string,
  input: EventInput
) {
  const payload = {
    created_by: userId,
    title: input.title,
    description: input.description ?? null,
    event_type: input.eventType,
    location_name: input.locationName,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    capacity: input.capacity,
    status: input.status,
  } satisfies EventInsert;

  const { data, error } = await supabase
    .from("events")
    .insert(payload as never)
    .select(eventSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toEvent(data as EventWithCountRow);
}

export async function updateEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  input: EventInput
) {
  const payload = {
    title: input.title,
    description: input.description ?? null,
    event_type: input.eventType,
    location_name: input.locationName,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    capacity: input.capacity,
    status: input.status,
  } satisfies EventUpdate;

  const { data, error } = await supabase
    .from("events")
    .update(payload as never)
    .eq("id", eventId)
    .select(eventSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toEvent(data as EventWithCountRow);
}

export async function addEventMediaItems(
  supabase: SupabaseServerClient,
  eventId: string,
  items: { storageKey: string; altText?: string | null; sortOrder: number }[]
) {
  if (items.length === 0) {
    return [];
  }

  const payload = items.map((item) => ({
    event_id: eventId,
    storage_key: item.storageKey,
    alt_text: item.altText ?? null,
    sort_order: item.sortOrder,
  })) satisfies EventMediaInsert[];

  const { data, error } = await supabase
    .from("event_media")
    .insert(payload as never)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as EventMediaRow[]).map(toEventMedia);
}

export async function countEventMediaItems(
  supabase: SupabaseServerClient,
  eventId: string
) {
  const { count, error } = await supabase
    .from("event_media")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function rsvpToEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string
) {
  const rpcClient = supabase as unknown as EventRpcClient;
  const { data, error } = await rpcClient.rpc("rsvp_to_event", {
    target_event_id: eventId,
    attendee_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Event RSVP failed.");
  }

  return toRsvp(data);
}
