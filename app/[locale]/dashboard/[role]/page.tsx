import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { Suspense } from "react";
import {
  ApprenticeDashboardContent,
  ApprenticeDashboardSkeleton,
} from "@/components/dashboard/apprentice-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { FacilitatorDashboard } from "@/components/dashboard/facilitator-dashboard";
import { JanzuDashboardBlock } from "@/components/dashboard/janzu-dashboard-block";
import { InstructorDashboard } from "@/components/dashboard/instructor-dashboard";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import {
  PractitionerDashboardContent,
  PractitionerDashboardSkeleton,
} from "@/components/dashboard/practitioner-dashboard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getApprenticeDashboardData } from "@/server/services/apprentice-dashboard.service";
import { getAdminDashboardData } from "@/server/services/admin-dashboard.service";
import { getFacilitatorDashboardData } from "@/server/services/facilitator-dashboard.service";
import { getPractitionerDashboardData } from "@/server/services/practitioner-dashboard.service";
import {
  canAccessDashboard,
  getPrimaryRole,
  getRoleAccessList,
  getRoleDashboardPath,
  isRole
} from "@/server/services/rbac.service";

type RoleDashboardPageProps = {
  params: Promise<{
    locale: Locale;
    role: string;
  }>;
};

async function PractitionerDashboardContentLoader({
  supabase,
  userId,
  locale,
  user,
  dictionary,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  locale: Locale;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  dictionary: Parameters<typeof PractitionerDashboardContent>[0]["dictionary"];
}) {
  const dashboardData = await getPractitionerDashboardData(supabase, userId);

  return (
    <PractitionerDashboardContent
      locale={locale}
      user={user}
      data={dashboardData}
      dictionary={dictionary}
    />
  );
}

async function ApprenticeDashboardContentLoader({
  supabase,
  userId,
  locale,
  dictionary,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  locale: Locale;
  dictionary: Parameters<typeof ApprenticeDashboardContent>[0]["dictionary"];
}) {
  const dashboardData = await getApprenticeDashboardData(supabase, userId, locale);

  return (
    <ApprenticeDashboardContent
      locale={locale}
      data={dashboardData}
      dictionary={dictionary}
    />
  );
}

export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { locale, role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale)
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const userRoles = await listUserRoles(supabase, data.user.id);

  if (!canAccessDashboard(userRoles, role)) {
    const primaryRole = getPrimaryRole(userRoles);

    if (primaryRole) {
      redirect(getRoleDashboardPath(locale, primaryRole) as Route);
    }

    redirect(`/${locale}/dashboard`);
  }

  const roleDictionary = dictionary.dashboard.roles[role];
  const access = getRoleAccessList(userRoles);
  const user = {
    id: data.user.id,
    name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
    email: data.user.email ?? "",
    avatar: data.user.user_metadata.avatar_url
  };

  if (role === "practitioner") {
    return (
      <JanzuDashboardFrame
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
      >
        <Suspense fallback={<PractitionerDashboardSkeleton />}>
          <PractitionerDashboardContentLoader
            supabase={supabase}
            userId={data.user.id}
            locale={locale}
            user={user}
            dictionary={dictionary.dashboard.practitionerData}
          />
        </Suspense>
      </JanzuDashboardFrame>
    );
  }

  if (role === "apprentice") {
    return (
      <JanzuDashboardFrame
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
      >
        <Suspense fallback={<ApprenticeDashboardSkeleton />}>
          <ApprenticeDashboardContentLoader
            supabase={supabase}
            userId={data.user.id}
            locale={locale}
            dictionary={dictionary.dashboard.apprenticeData}
          />
        </Suspense>
      </JanzuDashboardFrame>
    );
  }

  if (role === "admin") {
    const dashboardData = await getAdminDashboardData(supabase, data.user.id);

    return (
      <AdminDashboard
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
        data={dashboardData}
        dictionary={dictionary.dashboard.adminData}
      />
    );
  }

  if (role === "instructor") {
    return (
      <InstructorDashboard
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
        dictionary={dictionary.dashboard.instructorData}
      />
    );
  }

  if (role === "facilitator") {
    const dashboardData = await getFacilitatorDashboardData(supabase);

    return (
      <FacilitatorDashboard
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
        data={dashboardData}
        dictionary={dictionary.dashboard.facilitatorData}
      />
    );
  }

  return (
    <JanzuDashboardBlock
      locale={locale}
      access={access}
      user={user}
      title={roleDictionary.title}
    />
  );
}
