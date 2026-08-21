import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PractitionerProfileRequiredAlert } from "@/components/dashboard/practitioner-profile-required-alert";
import { ClientCreateDrawer } from "@/features/clients/components/client-create-drawer";
import { ClientList } from "@/features/clients/components/client-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listMyClientsPage,
  PractitionerProfileRequiredError,
} from "@/server/services/client.service";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

const PAGE_SIZE = 10;

type ClientsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; clientId?: string; clientsPage?: string }>;
};

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildClientsHref(locale: Locale, page: number) {
  const params = new URLSearchParams();

  params.set("clientsPage", String(page));

  return `/${locale}/dashboard/clients?${params.toString()}`;
}

async function loadClientsPage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  page: number
) {
  try {
    return await listMyClientsPage(supabase, userId, page, PAGE_SIZE);
  } catch (error) {
    if (error instanceof PractitionerProfileRequiredError) {
      return null;
    }

    throw error;
  }
}

export default async function ClientsPage({ params, searchParams }: ClientsPageProps) {
  const [{ locale }, { status, clientId, clientsPage }] = await Promise.all([params, searchParams]);
  const currentPage = parsePage(clientsPage);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [roles, clientsPageData] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    loadClientsPage(supabase, data.user.id, currentPage),
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
          {!clientsPageData ? (
            <PractitionerProfileRequiredAlert
              href={`/${locale}/dashboard/profile`}
              title={dictionary.clients.profileRequiredTitle}
              description={dictionary.clients.profileRequiredDescription}
              actionLabel={dictionary.clients.profileRequiredAction}
            />
          ) : (
            <>
              <div className="flex justify-end">
                <ClientCreateDrawer
                  locale={locale}
                  status={status}
                  defaultOpen={shouldOpenCreateDrawer}
                  cancelLabel={dictionary.common.cancel}
                  closeLabel={dictionary.common.close}
                  dictionary={dictionary.clients}
                />
              </div>
              <ClientList
                clients={clientsPageData.items}
                locale={locale}
                status={status}
                editingClientId={clientId}
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalCount={clientsPageData.totalCount}
                previousHref={buildClientsHref(locale, currentPage - 1)}
                nextHref={buildClientsHref(locale, currentPage + 1)}
                dictionary={{
                  ...dictionary.clients,
                  cancel: dictionary.common.cancel,
                  close: dictionary.common.close,
                }}
              />
            </>
          )}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
