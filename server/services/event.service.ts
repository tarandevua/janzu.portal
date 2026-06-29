import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { EventInput } from "@/server/models/event.model";
import {
  addEventMediaItems,
  countEventMediaItems,
  createEvent,
  listManagedEvents,
  listPublishedEvents,
  rsvpToEvent,
  updateEvent,
} from "@/server/repositories/event.repository";
import type { Role } from "@/server/models/rbac.model";
import { MAX_EVENT_IMAGE_UPLOADS, uploadEventImage } from "@/server/services/r2-storage.service";
import { hasPermission } from "@/server/services/rbac.service";

export function listPublicEvents(supabase: SupabaseServerClient, currentUserId?: string | null) {
  return listPublishedEvents(supabase, currentUserId);
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

export function updateManagedEvent(
  supabase: SupabaseServerClient,
  roles: Role[],
  eventId: string,
  input: EventInput
) {
  if (!hasPermission(roles, "events:manage")) {
    throw new Error("Event manager access is required.");
  }

  return updateEvent(supabase, eventId, input);
}

export async function uploadManagedEventImages(
  supabase: SupabaseServerClient,
  roles: Role[],
  eventId: string,
  files: File[]
) {
  if (!hasPermission(roles, "events:manage")) {
    throw new Error("Event manager access is required.");
  }

  if (files.length === 0) {
    return [];
  }

  const existingCount = await countEventMediaItems(supabase, eventId);

  if (existingCount + files.length > MAX_EVENT_IMAGE_UPLOADS) {
    throw new Error("event-image-count");
  }

  const uploadedItems = [];

  for (const [index, file] of files.entries()) {
    const sortOrder = existingCount + index;
    const uploaded = await uploadEventImage({ eventId, file, sortOrder });

    if (!uploaded.ok) {
      throw new Error(uploaded.code);
    }

    uploadedItems.push({
      storageKey: uploaded.key,
      altText: null,
      sortOrder,
    });
  }

  return addEventMediaItems(supabase, eventId, uploadedItems);
}

export function rsvpCurrentUserToEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string
) {
  return rsvpToEvent(supabase, eventId, userId);
}
