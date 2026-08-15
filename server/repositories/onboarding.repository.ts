import type { SupabaseServerClient } from "@/lib/supabase/server";
import {
  LEARNING_ALLIANCE_VERSION,
  type OnboardingGuideKey,
} from "@/server/models/onboarding.model";
import type { Database } from "@/types/database";

type AgreementRow = Database["public"]["Tables"]["learning_alliance_acknowledgements"]["Row"];
type GuideRow = Database["public"]["Tables"]["onboarding_guide_completions"]["Row"];

export async function getOnboardingFacts(
  supabase: SupabaseServerClient,
  userId: string
) {
  const agreementQuery = supabase
    .from("learning_alliance_acknowledgements")
    .select("*")
    .eq("user_id", userId)
    .eq("policy_version", LEARNING_ALLIANCE_VERSION)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const profileQuery = supabase
    .from("practitioners")
    .select("id, visibility_configured_at")
    .eq("user_id", userId)
    .maybeSingle();
  const trainingQuery = supabase
    .from("training_history")
    .select("id", { count: "exact", head: true })
    .eq("trainee_user_id", userId);
  const assignmentQuery = supabase
    .from("supervision_assignments")
    .select("id", { count: "exact", head: true })
    .eq("trainee_user_id", userId)
    .eq("status", "active");
  const guidesQuery = supabase
    .from("onboarding_guide_completions")
    .select("*")
    .eq("user_id", userId);

  const [agreement, profile, training, assignment, guides] = await Promise.all([
    agreementQuery,
    profileQuery,
    trainingQuery,
    assignmentQuery,
    guidesQuery,
  ]);
  const error = agreement.error ?? profile.error ?? training.error ?? assignment.error ?? guides.error;
  if (error) throw new Error(error.message);

  return {
    allianceAccepted: (agreement.data as AgreementRow | null)?.action === "accepted",
    profileComplete: Boolean(
      (profile.data as { id: string; visibility_configured_at: string | null } | null)
        ?.visibility_configured_at
    ),
    trainingStarted: (training.count ?? 0) > 0,
    instructorSelected: (assignment.count ?? 0) > 0,
    completedGuides: ((guides.data ?? []) as GuideRow[]).map(
      (row) => row.guide_key as OnboardingGuideKey
    ),
  };
}

type OnboardingRpcClient = {
  rpc(
    name: "record_learning_alliance_action",
    args: Database["public"]["Functions"]["record_learning_alliance_action"]["Args"]
  ): Promise<{ error: { message: string } | null }>;
  rpc(
    name: "set_onboarding_guide_completion",
    args: Database["public"]["Functions"]["set_onboarding_guide_completion"]["Args"]
  ): Promise<{ error: { message: string } | null }>;
};

export async function recordLearningAllianceAction(
  supabase: SupabaseServerClient,
  userId: string,
  locale: "en" | "es",
  action: "accepted" | "revoked"
) {
  const client = supabase as unknown as OnboardingRpcClient;
  const { error } = await client.rpc("record_learning_alliance_action", {
    actor_user_id: userId,
    target_policy_version: LEARNING_ALLIANCE_VERSION,
    target_locale: locale,
    target_action: action,
  });
  if (error) throw new Error(error.message);
}

export async function setGuideCompletion(
  supabase: SupabaseServerClient,
  userId: string,
  guideKey: OnboardingGuideKey,
  complete: boolean
) {
  const client = supabase as unknown as OnboardingRpcClient;
  const { error } = await client.rpc("set_onboarding_guide_completion", {
    actor_user_id: userId,
    target_guide_key: guideKey,
    target_completed: complete,
  });
  if (error) throw new Error(error.message);
}
