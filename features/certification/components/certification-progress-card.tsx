import { CheckCircle2Icon, CircleIcon, LockKeyholeIcon } from "lucide-react";
import {
  certificationJourneyStates,
  type CertificationJourneyState,
  type CertificationJourneySummary,
} from "@/server/models/certification.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StateLabels = Record<CertificationJourneyState, string>;

type CertificationProgressCardProps = {
  progress: CertificationJourneySummary;
  dictionary: {
    journeyDescription: string;
    countedSessions: string;
    nextMilestone: string;
    remaining: string;
    currentState: string;
    states: StateLabels;
  };
};

export function CertificationProgressCard({
  progress,
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
