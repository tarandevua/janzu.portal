import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { AuthSettingsForm } from "@/features/user-management/components/auth-settings-form";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getAdminAuthSettings } from "@/server/services/platform-settings.service";
import { getPrimaryRole, getRoleAccessList, hasRole } from "@/server/services/rbac.service";

type SettingsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const roles = await listUserRoles(supabase, data.user.id);
  const primaryRole = getPrimaryRole(roles);

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!hasRole(roles, "admin")) {
    redirect(`/${locale}/dashboard`);
  }

  const authSettings = await getAdminAuthSettings(supabase, data.user.id);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.settings.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <AuthSettingsForm
            locale={locale}
            allowUnknownMagicLinkLogin={authSettings.allowUnknownMagicLinkLogin}
            status={status}
            dictionary={dictionary.userManagement}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
