import type { Locale } from "@/lib/i18n/config";
import type {
  CertificationJourneyState,
  CertificationJourneySummary,
} from "@/server/models/certification.model";
import { overrideCertification } from "@/features/certification/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StateLabels = Record<CertificationJourneyState, string>;

type CertificationJourneyReviewProps = {
  locale: Locale;
  journeys: CertificationJourneySummary[];
  canOverride: boolean;
  status?: string;
  dictionary: {
    reviewTitle: string;
    reviewDescription: string;
    emptyReview: string;
    countedSessions: string;
    currentState: string;
    manualOverride: string;
    overrideDescription: string;
    reason: string;
    reasonPlaceholder: string;
    evidenceReference: string;
    evidencePlaceholder: string;
    moveTo: string;
    overrideSaved: string;
    overrideInvalid: string;
    overrideForbidden: string;
    overrideFailed: string;
    protectedTransition: string;
    states: StateLabels;
  };
};

function getStatusMessage(
  status: string | undefined,
  dictionary: CertificationJourneyReviewProps["dictionary"]
) {
  if (status === "override-saved") return dictionary.overrideSaved;
  if (status === "override-invalid") return dictionary.overrideInvalid;
  if (status === "override-forbidden") return dictionary.overrideForbidden;
  if (status === "override-failed") return dictionary.overrideFailed;
  return null;
}

export function CertificationJourneyReview({
  locale,
  journeys,
  canOverride,
  status,
  dictionary,
}: CertificationJourneyReviewProps) {
  const statusMessage = getStatusMessage(status, dictionary);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.reviewTitle}</CardTitle>
        <CardDescription>{dictionary.reviewDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {statusMessage ? (
          <Alert>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        ) : null}

        {journeys.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {dictionary.emptyReview}
          </div>
        ) : (
          journeys.map((journey) => (
            <section id={`journey-${journey.id}`} key={journey.id} className="grid scroll-mt-6 gap-4 rounded-md border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{journey.traineeName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.countedSessions}: {journey.countedSessionsCount}
                  </p>
                </div>
                <Badge variant="secondary">
                  {dictionary.currentState}: {dictionary.states[journey.state]}
                </Badge>
              </div>

              {canOverride ? (
                journey.nextState ? (
                  <form action={overrideCertification.bind(null, locale)} className="grid gap-3">
                    <input type="hidden" name="journeyId" value={journey.id} />
                    <input type="hidden" name="expectedState" value={journey.state} />
                    <input type="hidden" name="resultingState" value={journey.nextState} />
                    <div>
                      <p className="font-medium">{dictionary.manualOverride}</p>
                      <p className="text-sm text-muted-foreground">{dictionary.overrideDescription}</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`reason-${journey.id}`}>{dictionary.reason}</Label>
                      <Textarea
                        id={`reason-${journey.id}`}
                        name="reason"
                        minLength={10}
                        maxLength={1000}
                        placeholder={dictionary.reasonPlaceholder}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`evidence-${journey.id}`}>{dictionary.evidenceReference}</Label>
                      <Input
                        id={`evidence-${journey.id}`}
                        name="evidenceReference"
                        minLength={3}
                        maxLength={1000}
                        placeholder={dictionary.evidencePlaceholder}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-fit">
                      {dictionary.moveTo}: {dictionary.states[journey.nextState]}
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">{dictionary.protectedTransition}</p>
                )
              ) : null}
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
