import React from "react";
import type { Locale } from "@/lib/i18n/config";
import type {
  CertificationJourneyState,
  CertificationJourneySummary,
} from "@/server/models/certification.model";
import { overrideCertification } from "@/features/certification/actions";
import { decideLevel2Review } from "@/features/certification/actions";
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
    level2DecisionTitle: string;
    level2DecisionDescription: string;
    approveReadiness: string;
    rejectReadiness: string;
    requireRevision: string;
    decisionReason: string;
    decisionReasonPlaceholder: string;
    readinessStatuses: Record<"pending" | "approved" | "rejected" | "revision_required" | "invalidated", string>;
    readinessRequested: string;
    readinessInvalid: string;
    readinessFailed: string;
    decisionSaved: string;
    decisionInvalid: string;
    decisionFailed: string;
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
  if (status === "readiness-requested") return dictionary.readinessRequested;
  if (status === "readiness-invalid") return dictionary.readinessInvalid;
  if (status === "readiness-failed") return dictionary.readinessFailed;
  if (status === "decision-saved") return dictionary.decisionSaved;
  if (status === "decision-invalid") return dictionary.decisionInvalid;
  if (status === "decision-failed") return dictionary.decisionFailed;
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

              {journey.canReviewLevel2Request && journey.readinessRequestId ? (
                <form action={decideLevel2Review.bind(null, locale)} className="grid gap-3 rounded-md bg-muted/40 p-4">
                  <input type="hidden" name="requestId" value={journey.readinessRequestId} />
                  <div>
                    <p className="font-medium">{dictionary.level2DecisionTitle}</p>
                    <p className="text-sm text-muted-foreground">{dictionary.level2DecisionDescription}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`decision-reason-${journey.id}`}>{dictionary.decisionReason}</Label>
                    <Textarea
                      id={`decision-reason-${journey.id}`}
                      name="reason"
                      maxLength={1000}
                      placeholder={dictionary.decisionReasonPlaceholder}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" name="decision" value="approved">{dictionary.approveReadiness}</Button>
                    <Button type="submit" name="decision" value="revision_required" variant="secondary">{dictionary.requireRevision}</Button>
                    <Button type="submit" name="decision" value="rejected" variant="outline">{dictionary.rejectReadiness}</Button>
                  </div>
                </form>
              ) : journey.readinessStatus ? (
                <p className="text-sm text-muted-foreground">
                  {dictionary.level2DecisionTitle}: {dictionary.readinessStatuses[journey.readinessStatus]}
                </p>
              ) : null}

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
