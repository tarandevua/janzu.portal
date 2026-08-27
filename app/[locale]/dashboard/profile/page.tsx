import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PractitionerProfileForm } from "@/features/practitioners/components/practitioner-profile-form";
import { ProfileVisibilityForm } from "@/features/practitioners/components/profile-visibility-form";
import { ProfileMapPreview } from "@/features/practitioners/components/profile-map-preview";
import { WhatsAppConsentForm } from "@/features/practitioners/components/whatsapp-consent-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getMyPractitionerProfile,
  previewPractitionerMapPoints,
} from "@/server/services/practitioner.service";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

type ProfilePageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

type AppUserNames = {
  full_name: string | null;
  official_full_name: string | null;
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

  const profilePromise = getMyPractitionerProfile(supabase, data.user.id);
  const appUserPromise = supabase
    .from("users")
    .select("full_name, official_full_name")
    .eq("id", data.user.id)
    .maybeSingle();
  const roles = await listUserRoles(supabase, data.user.id);
  const primaryRole = getPrimaryRole(roles);

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  const [profile, publicMapPreview, communityMapPreview, appUserResult] = await Promise.all([
    profilePromise,
    previewPractitionerMapPoints(supabase, data.user.id, "public"),
    previewPractitionerMapPoints(supabase, data.user.id, "community"),
    appUserPromise,
  ]);
  const appUserNames = appUserResult.data as AppUserNames | null;
  const desiredName = appUserNames?.full_name ?? data.user.user_metadata.full_name ?? data.user.email ?? "";
  const officialFullName = appUserNames?.official_full_name ?? "";

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
          fullName={desiredName}
          officialFullName={officialFullName}
          dictionary={dictionary.practitioners.form}
          status={status}
        />
        {profile ? (
          <>
            <ProfileVisibilityForm
              locale={locale}
              profile={profile}
              canUsePublic={roles.includes("facilitator") || roles.includes("instructor")}
              dictionary={dictionary.practitioners.visibility}
            />
            <WhatsAppConsentForm
              locale={locale}
              profile={profile}
              dictionary={dictionary.practitioners.whatsapp}
            />
            <ProfileMapPreview
              locale={locale}
              publicPoints={publicMapPreview}
              communityPoints={communityMapPreview}
              dictionary={dictionary.practitioners.mapPreview}
            />
          </>
        ) : null}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
