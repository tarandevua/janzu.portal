"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  createManagedEvent,
  rsvpCurrentUserToEvent,
  updateManagedEvent,
  uploadManagedEventImages,
} from "@/server/services/event.service";
import { isUploadedFile, MAX_EVENT_IMAGE_UPLOADS } from "@/server/services/r2-storage.service";
import { hasPermission } from "@/server/services/rbac.service";
import { eventRsvpSchema, eventSchema } from "@/server/validators/event.schema";

function toDateTimeIso(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function getEventImageFiles(formData: FormData) {
  return formData
    .getAll("eventImages")
    .filter((value): value is File => isUploadedFile(value) && value.size > 0)
    .slice(0, MAX_EVENT_IMAGE_UPLOADS);
}

function getEventPayload(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    eventType: formData.get("eventType"),
    locationName: formData.get("locationName"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    startsAt: toDateTimeIso(formData.get("startsAt")),
    endsAt: toDateTimeIso(formData.get("endsAt")),
    capacity: formData.get("capacity"),
    status: formData.get("status"),
  };
}

export async function createEvent(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = eventSchema.safeParse(getEventPayload(formData));

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/events?status=invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "events:manage")) {
    redirect(`/${locale}/dashboard/events?status=forbidden`);
  }

  const event = await createManagedEvent(supabase, user.id, roles, parsed.data);
  await uploadManagedEventImages(supabase, roles, event.id, getEventImageFiles(formData));

  revalidatePath(`/${locale}/dashboard/events`);
  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/dashboard/events?status=created`);
}

export async function updateEvent(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const eventId = formData.get("eventId");

  if (typeof eventId !== "string" || !eventId) {
    redirect(`/${locale}/dashboard/events?status=invalid`);
  }

  const parsed = eventSchema.safeParse(getEventPayload(formData));

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/events?status=invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "events:manage")) {
    redirect(`/${locale}/dashboard/events?status=forbidden`);
  }

  await updateManagedEvent(supabase, roles, eventId, parsed.data);
  await uploadManagedEventImages(supabase, roles, eventId, getEventImageFiles(formData));

  revalidatePath(`/${locale}/dashboard/events`);
  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/dashboard/events?status=updated`);
}

export async function rsvpToEvent(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = eventRsvpSchema.safeParse({
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/events?status=rsvp-invalid`);
  }

  await rsvpCurrentUserToEvent(supabase, parsed.data.eventId, user.id);

  revalidatePath(`/${locale}/events`);
  redirect(`/${locale}/events?status=rsvp-created`);
}
