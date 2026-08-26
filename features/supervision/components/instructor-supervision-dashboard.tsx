import Link from "next/link";
import type { Route } from "next";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import type { CertificationJourneyState } from "@/server/models/certification.model";
import type { SupervisionDashboardTrainee } from "@/server/models/supervision.model";
import { getSupervisionNextActionKey } from "@/server/services/supervision.service";

type DashboardDictionary = {
  dashboardTitle: string;
  dashboardDescription: string;
  dashboardEmpty: string;
  currentLevel: string;
  noVerifiedLevel: string;
  level1: string;
  level2: string;
  level3: string;
  verifiedTraining: string;
  verifiedTrainingCount: string;
  sessionProgress: string;
  recentFeedback: string;
  noRecentFeedback: string;
  ratingOutOfFive: string;
  milestone: string;
  nextAction: string;
  nextActions: Record<ReturnType<typeof getSupervisionNextActionKey>, string>;
};

type StateLabels = Record<CertificationJourneyState, string>;

function formatDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

function levelLabel(
  level: SupervisionDashboardTrainee["currentLevel"],
  dictionary: DashboardDictionary
) {
  if (level === "level_1") return dictionary.level1;
  if (level === "level_2") return dictionary.level2;
  if (level === "level_3") return dictionary.level3;
  return dictionary.noVerifiedLevel;
}

function SummaryLink({
  href,
  label,
  children,
}: {
  href: Route;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="grid min-h-24 gap-1 rounded-md border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium leading-6">{children}</span>
    </Link>
  );
}

export function InstructorSupervisionDashboard({
  locale,
  trainees,
  dictionary,
  stateLabels,
}: {
  locale: Locale;
  trainees: SupervisionDashboardTrainee[];
  dictionary: DashboardDictionary;
  stateLabels: StateLabels;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.dashboardTitle}</CardTitle>
        <CardDescription>{dictionary.dashboardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {trainees.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {dictionary.dashboardEmpty}
          </div>
        ) : (
          trainees.map((trainee) => {
            const trainingParams = new URLSearchParams({ traineeId: trainee.traineeUserId });
            if (trainee.latestVerifiedTrainingId) {
              trainingParams.set("recordId", trainee.latestVerifiedTrainingId);
            }
            const trainingHref = `/${locale}/dashboard/training?${trainingParams}` as Route;
            const certificationHref = `/${locale}/dashboard/certification${
              trainee.journeyId ? `#journey-${trainee.journeyId}` : ""
            }` as Route;
            const feedbackParams = new URLSearchParams();
            if (trainee.practitionerId) feedbackParams.set("participantId", trainee.practitionerId);
            if (trainee.recentFeedbackId) feedbackParams.set("feedbackId", trainee.recentFeedbackId);
            const feedbackHref = `/${locale}/dashboard/feedback${
              feedbackParams.size ? `?${feedbackParams}` : ""
            }` as Route;
            const nextActionKey = getSupervisionNextActionKey(trainee);

            return (
              <article key={trainee.assignmentId} className="grid gap-4 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-semibold">{trainee.traineeName}</h3>
                  {trainee.journeyState ? (
                    <Badge variant="secondary">{stateLabels[trainee.journeyState]}</Badge>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <SummaryLink href={trainingHref} label={dictionary.currentLevel}>
                    {levelLabel(trainee.currentLevel, dictionary)}
                  </SummaryLink>
                  <SummaryLink href={trainingHref} label={dictionary.verifiedTraining}>
                    {dictionary.verifiedTrainingCount.replace(
                      "{count}",
                      String(trainee.verifiedTrainingCount)
                    )}
                  </SummaryLink>
                  <SummaryLink href={certificationHref} label={dictionary.sessionProgress}>
                    {trainee.countedSessionsCount} / {trainee.nextSessionMilestone}
                  </SummaryLink>
                  <SummaryLink href={feedbackHref} label={dictionary.recentFeedback}>
                    {trainee.recentFeedbackSessionDate && trainee.recentFeedbackRating !== null
                      ? `${formatDate(locale, trainee.recentFeedbackSessionDate)} · ${dictionary.ratingOutOfFive.replace("{rating}", String(trainee.recentFeedbackRating))}`
                      : dictionary.noRecentFeedback}
                  </SummaryLink>
                  <SummaryLink href={certificationHref} label={dictionary.milestone}>
                    {trainee.journeyState
                      ? stateLabels[trainee.journeyState]
                      : `${trainee.countedSessionsCount} / ${trainee.nextSessionMilestone}`}
                  </SummaryLink>
                  <SummaryLink href={certificationHref} label={dictionary.nextAction}>
                    {dictionary.nextActions[nextActionKey]}
                  </SummaryLink>
                </div>
              </article>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
