"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { overrideCertificationState } from "@/server/services/certification.service";
import { hasPermission } from "@/server/services/rbac.service";
import { certificationOverrideSchema } from "@/server/validators/certification.schema";

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
