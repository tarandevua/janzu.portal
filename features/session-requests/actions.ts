"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  reviewMySessionRequest,
  submitPublicSessionRequest,
} from "@/server/services/session-request.service";
import {
  sessionRequestReviewSchema,
  sessionRequestSchema,
} from "@/server/validators/session-request.schema";

export async function requestPractitionerSession(locale: Locale, formData: FormData) {
  const practitionerId = formData.get("practitionerId");
  const parsed = sessionRequestSchema.safeParse({
    practitionerId,
    availabilitySlotId: formData.get("availabilitySlotId"),
    requesterName: formData.get("requesterName"),
    requesterEmail: formData.get("requesterEmail"),
    requesterPhone: formData.get("requesterPhone"),
    message: formData.get("message"),
  });

  if (typeof practitionerId !== "string" || !practitionerId) {
    redirect(`/${locale}/practitioners?status=request-invalid`);
  }

  if (!parsed.success) {
    redirect(`/${locale}/practitioners/${practitionerId}?status=request-invalid`);
  }

  const supabase = await createSupabaseServerClient();
  await submitPublicSessionRequest(supabase, parsed.data);

  revalidatePath(`/${locale}/practitioners/${practitionerId}`);
  redirect(`/${locale}/practitioners/${practitionerId}?status=request-sent`);
}

export async function reviewSessionRequest(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = sessionRequestReviewSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/sessions?status=request-review-invalid`);
  }

  await reviewMySessionRequest(
    supabase,
    user.id,
    parsed.data.requestId,
    parsed.data.status
  );

  revalidatePath(`/${locale}/dashboard/sessions`);
  redirect(`/${locale}/dashboard/sessions?status=request-${parsed.data.status}`);
}
