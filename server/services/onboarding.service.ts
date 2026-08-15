import type { Locale } from "@/lib/i18n/config";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { OnboardingGuideKey, OnboardingProgress } from "@/server/models/onboarding.model";
import {
  getOnboardingFacts,
  recordLearningAllianceAction,
  setGuideCompletion,
} from "@/server/repositories/onboarding.repository";

export async function getMyOnboardingProgress(
  supabase: SupabaseServerClient,
  userId: string,
  locale: Locale
): Promise<OnboardingProgress> {
  const facts = await getOnboardingFacts(supabase, userId);
  const completedCount = [
    facts.allianceAccepted,
    facts.profileComplete,
    facts.trainingStarted,
    facts.instructorSelected,
    facts.completedGuides.includes("calendar"),
    facts.completedGuides.includes("sessions"),
    facts.completedGuides.includes("feedback"),
  ].filter(Boolean).length;
  const nextHref = !facts.allianceAccepted
    ? `/${locale}/dashboard/first-steps#learning-alliance`
    : !facts.profileComplete
      ? `/${locale}/dashboard/profile#visibility`
      : !facts.trainingStarted
        ? `/${locale}/dashboard/training`
        : !facts.instructorSelected
          ? `/${locale}/dashboard/supervision`
          : `/${locale}/dashboard/first-steps#guidance`;

  return {
    ...facts,
    completedCount,
    totalCount: 7,
    nextHref,
    complete: completedCount === 7,
  };
}

export function updateLearningAlliance(
  supabase: SupabaseServerClient,
  userId: string,
  locale: Locale,
  accept: boolean
) {
  return recordLearningAllianceAction(supabase, userId, locale, accept ? "accepted" : "revoked");
}

export function updateGuideCompletion(
  supabase: SupabaseServerClient,
  userId: string,
  guideKey: OnboardingGuideKey,
  complete: boolean
) {
  return setGuideCompletion(supabase, userId, guideKey, complete);
}
