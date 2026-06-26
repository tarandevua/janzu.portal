import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { CommunityEvent, EventInput, EventRsvp } from "@/server/models/event.model";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type RsvpRow = Database["public"]["Tables"]["event_rsvps"]["Row"];
type RsvpArgs = Database["public"]["Functions"]["rsvp_to_event"]["Args"];

type EventWithCountRow = EventRow & {
  event_rsvps: { count: number }[] | null;
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

function toEvent(row: EventWithCountRow): CommunityEvent {
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

const eventSelect = "*, event_rsvps(count)";

export async function listPublishedEvents(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as EventWithCountRow[]).map(toEvent);
}

export async function listManagedEvents(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("events")
    .select(eventSelect)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as EventWithCountRow[]).map(toEvent);
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
