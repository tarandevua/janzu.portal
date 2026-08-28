import React from "react";
import { CheckCircle2Icon, CircleIcon, LockKeyholeIcon } from "lucide-react";
import {
  certificationJourneyStates,
  type CertificationJourneyState,
  type CertificationJourneySummary,
} from "@/server/models/certification.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import { requestLevel2Review } from "@/features/certification/actions";

type StateLabels = Record<CertificationJourneyState, string>;

type CertificationProgressCardProps = {
  progress: CertificationJourneySummary;
  locale: Locale;
  dictionary: {
    journeyDescription: string;
    countedSessions: string;
    nextMilestone: string;
    remaining: string;
    currentState: string;
    states: StateLabels;
    level2ReviewTitle: string;
    level2ReviewAvailable: string;
    level2ReviewUnavailable: string;
    requestLevel2Review: string;
    decisionReasonLabel: string;
    readinessStatuses: Record<"pending" | "approved" | "rejected" | "revision_required" | "invalidated", string>;
  };
};

export function CertificationProgressCard({
  progress,
  locale,
  dictionary,
}: CertificationProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{progress.traineeName ?? dictionary.states[progress.state]}</CardTitle>
            <CardDescription>{dictionary.journeyDescription}</CardDescription>
          </div>
          <Badge>{dictionary.states[progress.state]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.countedSessions}</p>
            <p className="text-2xl font-semibold">{progress.countedSessionsCount}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.nextMilestone}</p>
            <p className="text-2xl font-semibold">{progress.sessionMilestone}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground">{dictionary.remaining}</p>
            <p className="text-2xl font-semibold">{progress.remainingSessionsCount}</p>
          </div>
        </div>

        <div className="grid gap-3 rounded-md border p-4">
          <div>
            <p className="font-medium">{dictionary.level2ReviewTitle}</p>
            <p className="text-sm text-muted-foreground">
              {progress.readinessStatus
                ? dictionary.readinessStatuses[progress.readinessStatus]
                : progress.canRequestLevel2Review
                  ? dictionary.level2ReviewAvailable
                  : dictionary.level2ReviewUnavailable}
            </p>
            {progress.readinessDecisionReason ? (
              <p className="mt-2 text-sm">
                <span className="font-medium">{dictionary.decisionReasonLabel}:</span>{" "}
                {progress.readinessDecisionReason}
              </p>
            ) : null}
          </div>
          {progress.canRequestLevel2Review ? (
            <form action={requestLevel2Review.bind(null, locale)}>
              <input type="hidden" name="journeyId" value={progress.id} />
              <Button type="submit">{dictionary.requestLevel2Review}</Button>
            </form>
          ) : null}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">{dictionary.currentState}</p>
          <ol className="grid gap-2 sm:grid-cols-2" aria-label={dictionary.currentState}>
            {certificationJourneyStates.map((state, index) => {
              const complete = index < progress.currentStateIndex;
              const current = index === progress.currentStateIndex;
              const Icon = complete ? CheckCircle2Icon : current ? CircleIcon : LockKeyholeIcon;

              return (
                <li
                  key={state}
                  className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
                    current ? "border-primary bg-primary/5 font-medium" : ""
                  }`}
                  aria-current={current ? "step" : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{dictionary.states[state]}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
