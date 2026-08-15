import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { SupervisionWorkspace } from "@/features/supervision/components/supervision-workspace";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAccessList } from "@/server/services/rbac.service";
import { getSupervisionWorkspace } from "@/server/services/supervision.service";

export default async function SupervisionPage({
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

  const workspace = await getSupervisionWorkspace(supabase, data.user.id);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(workspace.roles)}
      title={dictionary.supervision.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu member",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="p-4 md:p-6">
        <SupervisionWorkspace
          locale={locale}
          userId={data.user.id}
          roles={workspace.roles}
          assignments={workspace.assignments}
          instructors={workspace.instructors}
          trainees={workspace.trainees}
          dictionary={dictionary.supervision}
          status={status}
        />
      </div>
    </JanzuDashboardFrame>
  );
}
