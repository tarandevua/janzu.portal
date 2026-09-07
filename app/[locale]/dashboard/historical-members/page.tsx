import { redirect } from "next/navigation";
import { z } from "zod";
import { HistoricalWorkspace } from "@/features/historical-members/components/historical-workspace";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listHistoricalClaims, listHistoricalEvents } from "@/server/repositories/historical-member.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { hasRole } from "@/server/services/rbac.service";

export default async function HistoricalMembersPage({ params, searchParams }: {
  params: Promise<{ locale: Locale }>; searchParams: Promise<{ page?: string; claimId?: string }>;
}) {
  const [{ locale }, search, db] = await Promise.all([params, searchParams, createSupabaseServerClient()]);
  const [{ data: { user } }, dictionary] = await Promise.all([db.auth.getUser(), getDictionary(locale)]);
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  const page = Math.min(10000, Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1));
  const parsedId = z.string().uuid().safeParse(search.claimId);
  if (search.claimId && !parsedId.success) redirect(`/${locale}/dashboard/historical-members`);
  const claimId = parsedId.success ? parsedId.data : undefined;
  const [roles, workspace, events] = await Promise.all([
    listUserRoles(db, user.id), listHistoricalClaims(db, claimId ? 1 : page, claimId),
    claimId ? listHistoricalEvents(db, claimId) : Promise.resolve([]),
  ]);
  return (
    <HistoricalWorkspace
      locale={locale}
      copy={dictionary.historicalMembers}
      {...workspace}
      events={events}
      actor={user.id}
      admin={hasRole(roles, "admin")}
      page={page}
      focused={Boolean(claimId)}
    />
  );
}
