import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { EventInput } from "@/server/models/event.model";
import {
  addEventMediaItems,
  countEventMediaItems,
  createEvent,
  deleteEventById,
  deleteEventMediaByIds,
  listEventMediaByIds,
  listEventMediaStorageKeys,
  listManagedEvents,
  listPublishedEvents,
  rsvpToEvent,
  updateEvent,
  updateEventMediaSortOrders,
} from "@/server/repositories/event.repository";
import type { Role } from "@/server/models/rbac.model";
import {
  deletePrivateR2Object,
  MAX_EVENT_IMAGE_UPLOADS,
  uploadEventImage,
} from "@/server/services/r2-storage.service";
import { hasPermission, hasRole } from "@/server/services/rbac.service";

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
  files: File[],
  options: { startSortOrder?: number } = {}
) {
  if (!hasPermission(roles, "events:manage")) {
    throw new Error("Event manager access is required.");
  }

  if (files.length === 0) {
    return [];
  }

  const existingCount = options.startSortOrder ?? (await countEventMediaItems(supabase, eventId));

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

export async function updateManagedEventMedia(
  supabase: SupabaseServerClient,
  roles: Role[],
  eventId: string,
  input: {
    orderedMediaIds: string[];
    removedMediaIds: string[];
  }
) {
  if (!hasPermission(roles, "events:manage")) {
    throw new Error("Event manager access is required.");
  }

  const removedMedia = await listEventMediaByIds(supabase, eventId, input.removedMediaIds);

  for (const media of removedMedia) {
    await deletePrivateR2Object(media.storageKey);
  }

  await deleteEventMediaByIds(
    supabase,
    eventId,
    removedMedia.map((media) => media.id)
  );
  await updateEventMediaSortOrders(supabase, eventId, input.orderedMediaIds);
}

export async function deleteManagedEvent(
  supabase: SupabaseServerClient,
  roles: Role[],
  eventId: string
) {
  if (!hasRole(roles, "admin")) {
    throw new Error("Admin access is required to delete events.");
  }

  const mediaKeys = await listEventMediaStorageKeys(supabase, eventId);

  for (const mediaKey of mediaKeys) {
    await deletePrivateR2Object(mediaKey);
  }

  await deleteEventById(supabase, eventId);
}

export function rsvpCurrentUserToEvent(
  supabase: SupabaseServerClient,
  eventId: string,
  userId: string
) {
  return rsvpToEvent(supabase, eventId, userId);
}
