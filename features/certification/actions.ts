"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  overrideCertificationState,
  submitLevel2ReadinessDecision,
  submitLevel2ReadinessRequest,
} from "@/server/services/certification.service";
import { hasPermission } from "@/server/services/rbac.service";
import {
  certificationOverrideSchema,
  level2ReadinessDecisionSchema,
  level2ReadinessRequestSchema,
} from "@/server/validators/certification.schema";

export async function requestLevel2Review(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const parsed = level2ReadinessRequestSchema.safeParse({
    journeyId: formData.get("journeyId"),
  });
  if (!parsed.success) redirect(`/${locale}/dashboard/certification?status=readiness-invalid`);

  try {
    await submitLevel2ReadinessRequest(supabase, user.id, parsed.data.journeyId);
  } catch {
    redirect(`/${locale}/dashboard/certification?status=readiness-failed`);
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=readiness-requested`);
}

export async function decideLevel2Review(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const rawReason = formData.get("reason");
  const parsed = level2ReadinessDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("decision"),
    reason: typeof rawReason === "string" && rawReason.trim() ? rawReason : null,
  });
  if (!parsed.success) redirect(`/${locale}/dashboard/certification?status=decision-invalid`);

  try {
    await submitLevel2ReadinessDecision(supabase, user.id, {
      requestId: parsed.data.requestId,
      status: parsed.data.status as "approved" | "rejected" | "revision_required",
      reason: parsed.data.reason,
    });
  } catch {
    redirect(`/${locale}/dashboard/certification?status=decision-failed`);
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=decision-saved`);
}

export async function overrideCertification(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const parsed = certificationOverrideSchema.safeParse({
    journeyId: formData.get("journeyId"),
    expectedState: formData.get("expectedState"),
    resultingState: formData.get("resultingState"),
    reason: formData.get("reason"),
    evidenceReference: formData.get("evidenceReference"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/certification?status=override-invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);
  if (!hasPermission(roles, "certifications:approve")) {
    redirect(`/${locale}/dashboard/certification?status=override-forbidden`);
  }

  try {
    await overrideCertificationState(supabase, user.id, parsed.data);
  } catch {
    redirect(`/${locale}/dashboard/certification?status=override-failed`);
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=override-saved`);
}
