import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PractitionerProfileForm } from "@/features/practitioners/components/practitioner-profile-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyPractitionerProfile } from "@/server/services/practitioner.service";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList, hasRole } from "@/server/services/rbac.service";

type ProfilePageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [profile, roles] = await Promise.all([
    getMyPractitionerProfile(supabase, data.user.id),
    listUserRoles(supabase, data.user.id),
  ]);
  const primaryRole = getPrimaryRole(roles);

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.practitioners.form.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
        <PractitionerProfileForm
          locale={locale}
          profile={profile}
          fullName={data.user.user_metadata.full_name ?? data.user.email ?? ""}
          canPublishPublicProfile={hasRole(roles, "facilitator")}
          dictionary={dictionary.practitioners.form}
          status={status}
        />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
