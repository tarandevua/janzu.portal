import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PublicPractitionerDirectory } from "@/features/practitioners/components/public-practitioner-directory";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  findCommunityPractitionerMapPoints,
  findCommunityPractitionerProfiles,
} from "@/server/services/practitioner.service";
import { getRoleAccessList } from "@/server/services/rbac.service";

export default async function CommunityDirectoryPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([supabase.auth.getUser(), getDictionary(locale)]);
  if (!data.user) redirect(`/${locale}/login?status=auth-required`);

  const [roles, profiles, mapPoints] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    findCommunityPractitionerProfiles(supabase, data.user.id),
    findCommunityPractitionerMapPoints(supabase, data.user.id),
  ]);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.practitioners.community.title}
      user={{ id: data.user.id, name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu member", email: data.user.email ?? "", avatar: data.user.user_metadata.avatar_url }}
    >
      <div className="grid gap-4 p-4 md:p-6">
        <p className="text-sm text-muted-foreground">{dictionary.practitioners.community.description}</p>
        <PublicPractitionerDirectory
          locale={locale}
          profiles={profiles}
          mapPoints={mapPoints}
          dictionary={dictionary.practitioners.public}
          groups={["apprentice", "facilitator", "instructor", "participant"]}
          showDetails={false}
        />
      </div>
    </JanzuDashboardFrame>
  );
}
