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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [parsed, practitioner] = await Promise.all([
    Promise.resolve(sessionAvailabilitySchema.safeParse({
      startsAt: formData.get("startsAt"),
      durationMinutes: formData.get("durationMinutes"),
    })),
    getPractitionerProfileByUserId(supabase, user.id),
  ]);

  if (!practitioner) {
    redirect(`/${locale}/dashboard/profile`);
  }

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/sessions?tab=availability&status=availability-invalid`);
  }

  await createSessionAvailabilitySlot(supabase, {
    practitionerId: practitioner.id,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
  });

  revalidatePath(`/${locale}/dashboard/sessions`);
  redirect(`/${locale}/dashboard/sessions?tab=availability&status=availability-created`);
}

export async function cancelAvailabilitySlot(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [parsed, practitioner] = await Promise.all([
    Promise.resolve(cancelSessionAvailabilitySchema.safeParse({
      slotId: formData.get("slotId"),
    })),
    getPractitionerProfileByUserId(supabase, user.id),
  ]);

  if (!practitioner) {
    redirect(`/${locale}/dashboard/profile`);
  }

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/sessions?tab=availability&status=availability-invalid`);
  }

  await cancelSessionAvailabilitySlot(supabase, practitioner.id, parsed.data.slotId);

  revalidatePath(`/${locale}/dashboard/sessions`);
  redirect(`/${locale}/dashboard/sessions?tab=availability&status=availability-cancelled`);
}
