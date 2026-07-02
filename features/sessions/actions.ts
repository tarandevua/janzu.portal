"use server";

import crypto from "node:crypto";
import { addDays, addMonths, addWeeks } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cancelSessionAvailabilitySlot,
  cancelSessionAvailabilitySeries,
  createSessionAvailabilitySlots,
} from "@/server/repositories/session-availability.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { createMySession } from "@/server/services/session.service";
import {
  cancelSessionAvailabilitySchema,
  cancelSessionAvailabilitySeriesSchema,
  sessionAvailabilitySchema,
} from "@/server/validators/session-availability.schema";
import { sessionSchema } from "@/server/validators/session.schema";

export type AvailabilityActionResult =
  | {
      ok: true;
      status: "availability-created" | "availability-cancelled";
      slots: Awaited<ReturnType<typeof createSessionAvailabilitySlots>>;
    }
  | {
      ok: false;
      status: "auth-required" | "profile-required" | "availability-invalid";
    };

function buildAvailabilityOccurrences(input: {
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  repeat: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  repeatCount: number;
}) {
  const startDate = new Date(input.startsAt);
  const endDate = new Date(input.endsAt);
  const recurrenceGroupId = input.repeat === "none" ? null : crypto.randomUUID();
  const count = input.repeat === "none" ? 1 : input.repeatCount;

  return Array.from({ length: count }, (_, index) => {
    const occurrenceStart =
      input.repeat === "daily"
        ? addDays(startDate, index)
        : input.repeat === "weekly"
          ? addWeeks(startDate, index)
          : input.repeat === "biweekly"
            ? addWeeks(startDate, index * 2)
            : input.repeat === "monthly"
              ? addMonths(startDate, index)
              : startDate;
    const occurrenceEnd =
      input.repeat === "daily"
        ? addDays(endDate, index)
        : input.repeat === "weekly"
          ? addWeeks(endDate, index)
          : input.repeat === "biweekly"
            ? addWeeks(endDate, index * 2)
            : input.repeat === "monthly"
              ? addMonths(endDate, index)
              : endDate;

    return {
      practitionerId: input.practitionerId,
      startsAt: occurrenceStart.toISOString(),
      endsAt: occurrenceEnd.toISOString(),
      recurrenceGroupId,
    };
  });
}

export async function createSession(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = sessionSchema.safeParse({
    clientId: formData.get("clientId"),
    newClientName: formData.get("newClientName"),
    sessionDate: formData.get("sessionDate"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/sessions?status=invalid`);
  }

  await createMySession(supabase, user.id, parsed.data);

  revalidatePath(`/${locale}/dashboard/sessions`);
  redirect(`/${locale}/dashboard/sessions?status=created`);
}

export async function createAvailabilitySlot(locale: Locale, formData: FormData) {
  const result = await createAvailabilitySlotInline(locale, formData);

  if (result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }

  if (result.status === "profile-required") {
    redirect(`/${locale}/dashboard/profile`);
  }

  if (!result.ok) {
    redirect(`/${locale}/dashboard/sessions?tab=availability&status=${result.status}`);
  }

  redirect(`/${locale}/dashboard/sessions?tab=availability&status=${result.status}`);
}

export async function createAvailabilitySlotInline(
  locale: Locale,
  formData: FormData
): Promise<AvailabilityActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const [parsed, practitioner] = await Promise.all([
    Promise.resolve(sessionAvailabilitySchema.safeParse({
      startsAt: formData.get("startsAt"),
      durationMinutes: formData.get("durationMinutes"),
      repeat: formData.get("repeat") || "none",
      repeatCount: formData.get("repeatCount") || "1",
    })),
    getPractitionerProfileByUserId(supabase, user.id),
  ]);

  if (!practitioner) {
    return { ok: false, status: "profile-required" };
  }

  if (!parsed.success) {
    return { ok: false, status: "availability-invalid" };
  }

  const slots = await createSessionAvailabilitySlots(
    supabase,
    buildAvailabilityOccurrences({
      practitionerId: practitioner.id,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      repeat: parsed.data.repeat,
      repeatCount: parsed.data.repeatCount,
    })
  );

  revalidatePath(`/${locale}/dashboard/sessions`);
  return { ok: true, status: "availability-created", slots };
}

export async function cancelAvailabilitySlot(locale: Locale, formData: FormData) {
  const result = await cancelAvailabilitySlotInline(locale, formData);

  if (result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }

  if (result.status === "profile-required") {
    redirect(`/${locale}/dashboard/profile`);
  }

  if (!result.ok) {
    redirect(`/${locale}/dashboard/sessions?tab=availability&status=${result.status}`);
  }

  redirect(`/${locale}/dashboard/sessions?tab=availability&status=${result.status}`);
}

export async function cancelAvailabilitySlotInline(
  locale: Locale,
  formData: FormData
): Promise<AvailabilityActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const [parsed, practitioner] = await Promise.all([
    Promise.resolve(cancelSessionAvailabilitySchema.safeParse({
      slotId: formData.get("slotId"),
    })),
    getPractitionerProfileByUserId(supabase, user.id),
  ]);

  if (!practitioner) {
    return { ok: false, status: "profile-required" };
  }

  if (!parsed.success) {
    return { ok: false, status: "availability-invalid" };
  }

  const slot = await cancelSessionAvailabilitySlot(supabase, practitioner.id, parsed.data.slotId);

  revalidatePath(`/${locale}/dashboard/sessions`);
  return { ok: true, status: "availability-cancelled", slots: [slot] };
}

export async function cancelAvailabilitySeriesInline(
  locale: Locale,
  formData: FormData
): Promise<AvailabilityActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: "auth-required" };
  }

  const [parsed, practitioner] = await Promise.all([
    Promise.resolve(cancelSessionAvailabilitySeriesSchema.safeParse({
      recurrenceGroupId: formData.get("recurrenceGroupId"),
    })),
    getPractitionerProfileByUserId(supabase, user.id),
  ]);

  if (!practitioner) {
    return { ok: false, status: "profile-required" };
  }

  if (!parsed.success) {
    return { ok: false, status: "availability-invalid" };
  }

  const slots = await cancelSessionAvailabilitySeries(
    supabase,
    practitioner.id,
    parsed.data.recurrenceGroupId
  );

  revalidatePath(`/${locale}/dashboard/sessions`);
  return { ok: true, status: "availability-cancelled", slots };
}
