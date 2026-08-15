export const LEARNING_ALLIANCE_VERSION = "2026-08-15-v1";
export const onboardingGuideKeys = ["calendar", "sessions", "feedback"] as const;

export type OnboardingGuideKey = (typeof onboardingGuideKeys)[number];

export type OnboardingProgress = {
  allianceAccepted: boolean;
  profileComplete: boolean;
  trainingStarted: boolean;
  instructorSelected: boolean;
  completedGuides: OnboardingGuideKey[];
  completedCount: number;
  totalCount: number;
  nextHref: string;
  complete: boolean;
};
