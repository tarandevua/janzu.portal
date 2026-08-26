import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { TrainingWorkspace } from "@/features/training/components/training-workspace";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAccessList } from "@/server/services/rbac.service";
import {
  getTrainingWorkspace,
  isTrainingHistoryAccessDenied,
} from "@/server/services/training.service";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function TrainingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ traineeId?: string; recordId?: string }>;
}) {
  const { locale } = await params;
  const { traineeId, recordId } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([supabase.auth.getUser(), getDictionary(locale)]);
  if (!data.user) redirect(`/${locale}/login?status=auth-required`);

  const targetTraineeId = traineeId && UUID_PATTERN.test(traineeId) ? traineeId : data.user.id;
  let workspace;
  try {
    workspace = await getTrainingWorkspace(supabase, data.user.id, targetTraineeId);
  } catch (error) {
    if (isTrainingHistoryAccessDenied(error)) {
      redirect(`/${locale}/dashboard/supervision?status=training-access-denied`);
    }
    throw error;
  }

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(workspace.roles)}
      title={dictionary.training.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu member",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="p-4 md:p-6">
        <TrainingWorkspace
          locale={locale}
          traineeUserId={targetTraineeId}
          subject={workspace.subject}
          records={workspace.records}
          currentLevel={workspace.currentLevel}
          canSubmit={workspace.canSubmit}
          canReview={workspace.canReview}
          focusRecordId={recordId && UUID_PATTERN.test(recordId) ? recordId : null}
          dictionary={dictionary.training}
        />
      </div>
    </JanzuDashboardFrame>
  );
}
