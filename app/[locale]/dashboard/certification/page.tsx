import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { CertificationApprovalQueue } from "@/features/certification/components/certification-approval-queue";
import { CertificationProgressCard } from "@/features/certification/components/certification-progress-card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { syncCertificationProgress } from "@/server/repositories/certification.repository";
import {
  listCertificationCandidatesForReview,
  toCertificationSummary,
} from "@/server/services/certification.service";
import { getPrimaryRole, getRoleAccessList, hasPermission } from "@/server/services/rbac.service";

type CertificationPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function CertificationPage({ params, searchParams }: CertificationPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [roles, practitioner] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    getPractitionerProfileByUserId(supabase, data.user.id),
  ]);
  const primaryRole = getPrimaryRole(roles);
  const canApproveCertifications = hasPermission(roles, "certifications:approve");

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!practitioner && !canApproveCertifications) {
    redirect(`/${locale}/dashboard/profile`);
  }

  const [progress, approvalCandidates] = await Promise.all([
    practitioner
      ? syncCertificationProgress(supabase, practitioner.id).then(toCertificationSummary)
      : Promise.resolve(null),
    canApproveCertifications
      ? listCertificationCandidatesForReview(supabase, data.user.id)
      : Promise.resolve([]),
  ]);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.certification.title}
      user={{
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          {progress ? (
            <CertificationProgressCard progress={progress} dictionary={dictionary.certification} />
          ) : null}
          {canApproveCertifications ? (
            <CertificationApprovalQueue
              locale={locale}
              candidates={approvalCandidates}
              status={status}
              dictionary={dictionary.certification}
            />
          ) : null}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
