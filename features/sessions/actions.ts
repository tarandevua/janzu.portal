"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  cancelSessionAvailabilitySlot,
  createSessionAvailabilitySlot,
} from "@/server/repositories/session-availability.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { createMySession } from "@/server/services/session.service";
import {
  cancelSessionAvailabilitySchema,
  sessionAvailabilitySchema,
} from "@/server/validators/session-availability.schema";
import { sessionSchema } from "@/server/validators/session.schema";

export type AvailabilityActionResult =
  | {
      ok: true;
      status: "availability-created" | "availability-cancelled";
      slot: Awaited<ReturnType<typeof createSessionAvailabilitySlot>>;
    }
  | {
      ok: false;
      status: "auth-required" | "profile-required" | "availability-invalid";
    };

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
    })),
    getPractitionerProfileByUserId(supabase, user.id),
  ]);

  if (!practitioner) {
    return { ok: false, status: "profile-required" };
  }

  if (!parsed.success) {
    return { ok: false, status: "availability-invalid" };
  }

  const slot = await createSessionAvailabilitySlot(supabase, {
    practitionerId: practitioner.id,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
  });

  revalidatePath(`/${locale}/dashboard/sessions`);
  return { ok: true, status: "availability-created", slot };
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
  return { ok: true, status: "availability-cancelled", slot };
}
