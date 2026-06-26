"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { approvePractitionerCertification } from "@/server/services/certification.service";
import { hasPermission } from "@/server/services/rbac.service";
import { certificationApprovalSchema } from "@/server/validators/certification.schema";

export async function approveCertification(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const parsed = certificationApprovalSchema.safeParse({
    practitionerId: formData.get("practitionerId"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/certification?status=approval-invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "certifications:approve")) {
    redirect(`/${locale}/dashboard/certification?status=approval-forbidden`);
  }

  await approvePractitionerCertification(supabase, parsed.data.practitionerId, user.id);

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=approved`);
}
