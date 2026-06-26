import { redirect } from "next/navigation";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { ClientForm } from "@/features/clients/components/client-form";
import { ClientList } from "@/features/clients/components/client-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listMyClients } from "@/server/services/client.service";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

type ClientsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function ClientsPage({ params, searchParams }: ClientsPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [roles, clients] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    listMyClients(supabase, data.user.id),
  ]);
  const primaryRole = getPrimaryRole(roles);
  const shouldOpenCreateDrawer = status === "invalid";

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.clients.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex justify-end">
            <DashboardActionDrawer
              title={dictionary.clients.formTitle}
              description={dictionary.clients.formDescription}
              triggerLabel={dictionary.clients.formTitle}
              defaultOpen={shouldOpenCreateDrawer}
            >
              <ClientForm
                locale={locale}
                status={status}
                variant="plain"
                dictionary={dictionary.clients}
              />
            </DashboardActionDrawer>
          </div>
          <ClientList clients={clients} dictionary={dictionary.clients} />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
