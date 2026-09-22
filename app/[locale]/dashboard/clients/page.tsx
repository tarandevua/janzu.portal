import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PractitionerProfileRequiredAlert } from "@/components/dashboard/practitioner-profile-required-alert";
import { ClientCreateDrawer } from "@/features/clients/components/client-create-drawer";
import { ClientList } from "@/features/clients/components/client-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listMyClientOutreachPage,
  listMyClientsPage,
  PractitionerProfileRequiredError,
} from "@/server/services/client.service";
import type { ClientFollowUpFilter, ClientLifecycleStatus } from "@/server/models/client.model";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

const PAGE_SIZE = 10;

type ClientsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    status?: string;
    clientId?: string;
    clientsPage?: string;
    clientStatus?: string;
    followUp?: string;
    outreachClientId?: string;
    outreachPage?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildClientsHref(
  locale: Locale,
  page: number,
  clientStatus?: ClientLifecycleStatus,
  followUp: ClientFollowUpFilter = "all"
) {
  const params = new URLSearchParams();

  params.set("clientsPage", String(page));
  if (clientStatus) params.set("clientStatus", clientStatus);
  if (followUp !== "all") params.set("followUp", followUp);

  return `/${locale}/dashboard/clients?${params.toString()}`;
}

async function loadClientsPage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  page: number
  , lifecycleStatus?: ClientLifecycleStatus,
  followUp: ClientFollowUpFilter = "all",
  today?: string
) {
  try {
    return await listMyClientsPage(
      supabase,
      userId,
      page,
      PAGE_SIZE,
      lifecycleStatus,
      followUp,
      today
    );
  } catch (error) {
    if (error instanceof PractitionerProfileRequiredError) {
      return null;
    }

    throw error;
  }
}

async function loadSelectedOutreach(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  clientId: string | undefined,
  page: number
) {
  if (!clientId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
    return null;
  }
  try {
    return await listMyClientOutreachPage(supabase, userId, clientId, page, 20);
  } catch (error) {
    if (error instanceof PractitionerProfileRequiredError) return null;
    throw error;
  }
}

export default async function ClientsPage({ params, searchParams }: ClientsPageProps) {
  const [{ locale }, { status, clientId, clientsPage, clientStatus, followUp, outreachClientId, outreachPage }] = await Promise.all([params, searchParams]);
  const currentPage = parsePage(clientsPage);
  const currentOutreachPage = parsePage(outreachPage);
  const selectedStatus = (["prospect", "active", "inactive"] as const).includes(clientStatus as ClientLifecycleStatus)
    ? clientStatus as ClientLifecycleStatus
    : undefined;
  const selectedFollowUp = (["all", "overdue", "today", "upcoming", "none"] as const).includes(followUp as ClientFollowUpFilter)
    ? followUp as ClientFollowUpFilter
    : "all";
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [roles, clientsPageData, selectedOutreach] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    loadClientsPage(supabase, data.user.id, currentPage, selectedStatus, selectedFollowUp, today),
    loadSelectedOutreach(supabase, data.user.id, outreachClientId, currentOutreachPage),
  ]);
  const primaryRole = getPrimaryRole(roles);
  const shouldOpenCreateDrawer = status === "invalid";

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }
  const closeHref = buildClientsHref(locale, currentPage, selectedStatus, selectedFollowUp);

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
              <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
                <div className="grid min-w-48 gap-2">
                  <Label htmlFor="clientStatus">{dictionary.clients.filterStatus}</Label>
                  <select id="clientStatus" name="clientStatus" defaultValue={selectedStatus ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">{dictionary.clients.allStatuses}</option>
                    <option value="prospect">{dictionary.clients.statusLabels.prospect}</option>
                    <option value="active">{dictionary.clients.statusLabels.active}</option>
                    <option value="inactive">{dictionary.clients.statusLabels.inactive}</option>
                  </select>
                </div>
                <div className="grid min-w-48 gap-2">
                  <Label htmlFor="followUp">{dictionary.clients.followUpFilter}</Label>
                  <select id="followUp" name="followUp" defaultValue={selectedFollowUp} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {Object.entries(dictionary.clients.followUpFilters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <Button type="submit">{dictionary.clients.applyFilters}</Button>
              </form>
              <ClientList
                clients={clientsPageData.items}
                locale={locale}
                status={status}
                editingClientId={clientId}
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalCount={clientsPageData.totalCount}
                previousHref={buildClientsHref(locale, currentPage - 1, selectedStatus, selectedFollowUp)}
                nextHref={buildClientsHref(locale, currentPage + 1, selectedStatus, selectedFollowUp)}
                closeHref={closeHref}
                today={today}
                selectedOutreach={selectedOutreach ? {
                  client: selectedOutreach.client,
                  outreach: selectedOutreach.outreach,
                  page: currentOutreachPage,
                } : null}
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
