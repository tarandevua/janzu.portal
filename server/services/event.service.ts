import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { EventInput } from "@/server/models/event.model";
import { createEvent, listManagedEvents, listPublishedEvents, rsvpToEvent } from "@/server/repositories/event.repository";
import type { Role } from "@/server/models/rbac.model";
import { hasPermission } from "@/server/services/rbac.service";

export function listPublicEvents(supabase: SupabaseServerClient) {
  return listPublishedEvents(supabase);
}

export function listEventsForManagement(supabase: SupabaseServerClient, roles: Role[]) {
  if (!hasPermission(roles, "events:manage")) {
    throw new Error("Event manager access is required.");
  }

  return listManagedEvents(supabase);
}

export function createManagedEvent(
  supabase: SupabaseServerClient,
  userId: string,
  roles: Role[],
  input: EventInput
) {
  if (!hasPermission(roles, "events:manage")) {
    throw new Error("Event manager access is required.");
  }

  return createEvent(supabase, userId, input);
}

export function rsvpCurrentUserToEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string
) {
  return rsvpToEvent(supabase, eventId, userId);
}
