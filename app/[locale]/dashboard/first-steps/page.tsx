import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { FirstStepsChecklist } from "@/features/onboarding/components/first-steps-checklist";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getMyOnboardingProgress } from "@/server/services/onboarding.service";
import { getRoleAccessList, hasRole } from "@/server/services/rbac.service";

export default async function FirstStepsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([supabase.auth.getUser(), getDictionary(locale)]);
  if (!data.user) redirect(`/${locale}/login?status=auth-required`);

  const roles = await listUserRoles(supabase, data.user.id);
  if (!hasRole(roles, "apprentice")) redirect(`/${locale}/dashboard`);
  const progress = await getMyOnboardingProgress(supabase, data.user.id, locale);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.firstSteps.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Trainee",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="p-4 md:p-6">
        <FirstStepsChecklist locale={locale} progress={progress} dictionary={dictionary.firstSteps} status={status} />
      </div>
    </JanzuDashboardFrame>
  );
}
