import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setGuideComplete, setLearningAlliance } from "@/features/onboarding/actions";
import type { Locale } from "@/lib/i18n/config";
import { LEARNING_ALLIANCE_VERSION, type OnboardingProgress } from "@/server/models/onboarding.model";

type Dictionary = {
  title: string;
  description: string;
  progress: string;
  complete: string;
  open: string;
  learningAlliance: string;
  learningAllianceDescription: string;
  agreementStatement: string;
  agreementNonLegal: string;
  version: string;
  accept: string;
  revoke: string;
  profile: string;
  profileDescription: string;
  training: string;
  trainingDescription: string;
  instructor: string;
  instructorDescription: string;
  guidance: string;
  calendar: string;
  calendarDescription: string;
  sessions: string;
  sessionsDescription: string;
  feedback: string;
  feedbackDescription: string;
  markComplete: string;
  markIncomplete: string;
  allianceAccepted: string;
  allianceRevoked: string;
  guideUpdated: string;
  invalid: string;
};

function StatusIcon({ complete }: { complete: boolean }) {
  return complete
    ? <CheckCircle2Icon className="size-5 text-emerald-600" aria-hidden />
    : <CircleIcon className="size-5 text-muted-foreground" aria-hidden />;
}

function Step({
  title,
  description,
  complete,
  href,
  openLabel,
}: {
  title: string;
  description: string;
  complete: boolean;
  href: string;
  openLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3"><StatusIcon complete={complete} /><div><div className="font-medium">{title}</div><p className="text-sm text-muted-foreground">{description}</p></div></div>
      <Button asChild variant="outline" size="sm"><Link href={href as Route}>{openLabel}</Link></Button>
    </div>
  );
}

export function FirstStepsChecklist({
  locale,
  progress,
  dictionary,
  status,
}: {
  locale: Locale;
  progress: OnboardingProgress;
  dictionary: Dictionary;
  status?: string;
}) {
  const allianceAction = setLearningAlliance.bind(null, locale);
  const guideAction = setGuideComplete.bind(null, locale);
  const statusMessages: Record<string, string> = {
    "alliance-accepted": dictionary.allianceAccepted,
    "alliance-revoked": dictionary.allianceRevoked,
    "guide-updated": dictionary.guideUpdated,
    invalid: dictionary.invalid,
  };
  const guideDescriptions = {
    calendar: dictionary.calendarDescription,
    sessions: dictionary.sessionsDescription,
    feedback: dictionary.feedbackDescription,
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>{dictionary.title}</CardTitle><CardDescription>{dictionary.description}</CardDescription></div><Badge>{progress.completedCount}/{progress.totalCount}</Badge></div></CardHeader>
        <CardContent><div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={progress.totalCount} aria-valuenow={progress.completedCount}><div className="h-full bg-primary" style={{ width: `${(progress.completedCount / progress.totalCount) * 100}%` }} /></div></CardContent>
      </Card>

      {status && statusMessages[status] ? <p className="rounded-md border bg-muted p-3 text-sm" role="status">{statusMessages[status]}</p> : null}

      <Card id="learning-alliance">
        <CardHeader><CardTitle>{dictionary.learningAlliance}</CardTitle><CardDescription>{dictionary.learningAllianceDescription}</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-md border bg-muted/40 p-4 text-sm"><p>{dictionary.agreementStatement}</p><p className="mt-2 text-muted-foreground">{dictionary.agreementNonLegal}</p><p className="mt-2 text-xs">{dictionary.version}: {LEARNING_ALLIANCE_VERSION}</p></div>
          <form action={allianceAction}>
            <Button name="action" value={progress.allianceAccepted ? "revoke" : "accept"} variant={progress.allianceAccepted ? "outline" : "default"}>{progress.allianceAccepted ? dictionary.revoke : dictionary.accept}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6">
          <Step title={dictionary.profile} description={dictionary.profileDescription} complete={progress.profileComplete} href={`/${locale}/dashboard/profile#visibility`} openLabel={dictionary.open} />
          <Step title={dictionary.training} description={dictionary.trainingDescription} complete={progress.trainingStarted} href={`/${locale}/dashboard/training`} openLabel={dictionary.open} />
          <Step title={dictionary.instructor} description={dictionary.instructorDescription} complete={progress.instructorSelected} href={`/${locale}/dashboard/supervision`} openLabel={dictionary.open} />
        </CardContent>
      </Card>

      <Card id="guidance">
        <CardHeader><CardTitle>{dictionary.guidance}</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {(["calendar", "sessions", "feedback"] as const).map((guideKey) => {
            const done = progress.completedGuides.includes(guideKey);
            return (
              <div key={guideKey} className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3"><StatusIcon complete={done} /><div><Link className="font-medium underline-offset-4 hover:underline" href={`/${locale}/dashboard/knowledge-base/getting-started/first-steps#${guideKey}`}>{dictionary[guideKey]}</Link><p className="text-sm text-muted-foreground">{guideDescriptions[guideKey]}</p></div></div>
                <form action={guideAction}><input type="hidden" name="guideKey" value={guideKey} /><Button name="complete" value={done ? "false" : "true"} variant="outline" size="sm">{done ? dictionary.markIncomplete : dictionary.markComplete}</Button></form>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
