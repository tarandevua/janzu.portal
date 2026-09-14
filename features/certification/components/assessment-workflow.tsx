import React from "react";
import type { Locale } from "@/lib/i18n/config";
import type { AssessmentQueueItem, AssessorCandidate, AssessmentStatus } from "@/server/models/certification.model";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusToast } from "@/components/status-toast";
import { statusToastVariant } from "@/lib/status-toast";
import {
  decideAssessmentReview,
  recordAssessmentOutcomeAction,
  requestAssessmentReview,
  scheduleAssessmentAction,
  verifyAssessmentRemediationAction,
} from "@/features/certification/actions";
import {
  AssessorAssignmentForm,
  AssessorDesignationForm,
} from "@/features/certification/components/assessment-ajax-forms";

export type AssessmentDictionary = {
  assessmentTitle: string; assessmentDescription: string; assessmentEmpty: string;
  assessmentReadiness: string; requestAssessmentReadiness: string; assessmentReadinessPending: string;
  assessmentReadinessApproved: string; assessmentReadinessRejected: string; assessmentReadinessInvalidated: string;
  approveAssessmentReadiness: string; rejectAssessmentReadiness: string; assessmentDecisionReason: string;
  assessmentDecisionReasonPlaceholder: string; assessor: string; unassignedAssessor: string;
  assignAssessor: string; scheduleAssessment: string; assessmentDate: string; recordOutcome: string;
  changeAssessor: string; cancelAssessorAssignment: string;
  outcome: string; assessmentNotes: string; assessmentNotesPlaceholder: string; nextAction: string;
  nextActionPlaceholder: string; verifyRemediation: string; revision: string; assessedOn: string;
  assessorAuthorizationTitle: string; assessorAuthorizationDescription: string; designationReason: string;
  designateAssessor: string; revokeAssessor: string; activeAssessor: string; inactiveAssessor: string;
  assessmentStatus: Record<AssessmentStatus, string>;
  assessmentOutcomeOptions: Record<"incomplete" | "revision_required" | "failed" | "passed", string>;
  assessmentStatusMessages: Record<string, string>;
};

function readinessLabel(item: AssessmentQueueItem, dictionary: AssessmentDictionary) {
  if (item.readinessStatus === "pending") return dictionary.assessmentReadinessPending;
  if (item.readinessStatus === "approved") return dictionary.assessmentReadinessApproved;
  if (item.readinessStatus === "rejected") return dictionary.assessmentReadinessRejected;
  if (item.readinessStatus === "invalidated") return dictionary.assessmentReadinessInvalidated;
  return dictionary.assessmentReadiness;
}

export function AssessmentWorkflow({
  locale, items, candidates, canManageAssessors, status, dictionary,
}: {
  locale: Locale; items: AssessmentQueueItem[]; candidates: AssessorCandidate[];
  canManageAssessors: boolean; status?: string; dictionary: AssessmentDictionary;
}) {
  return (
    <div className="grid gap-4">
      {canManageAssessors ? (
        <AssessorAuthorizationSection locale={locale} candidates={candidates} dictionary={dictionary} />
      ) : null}
      <AssessmentQueueSection
        locale={locale}
        items={items}
        candidates={candidates}
        status={status}
        dictionary={dictionary}
      />
    </div>
  );
}

export function AssessorAuthorizationSection({
  locale,
  candidates,
  dictionary,
}: {
  locale: Locale;
  candidates: AssessorCandidate[];
  dictionary: AssessmentDictionary;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.assessorAuthorizationTitle}</CardTitle>
        <CardDescription>{dictionary.assessorAuthorizationDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {candidates.map((candidate) => (
          <AssessorDesignationForm
            key={candidate.userId}
            locale={locale}
            candidate={candidate}
            dictionary={dictionary}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export function AssessmentQueueSection({
  locale,
  items,
  candidates,
  status,
  dictionary,
}: {
  locale: Locale;
  items: AssessmentQueueItem[];
  candidates: AssessorCandidate[];
  status?: string;
  dictionary: AssessmentDictionary;
}) {
  const statusMessage = status ? dictionary.assessmentStatusMessages[status] : null;
  const activeCandidates = candidates.filter((candidate) => candidate.active);
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card>
        <CardHeader>
          <CardTitle>{dictionary.assessmentTitle}</CardTitle>
          <CardDescription>{dictionary.assessmentDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <StatusToast message={statusMessage} status={status} variant={statusToastVariant(status)} />
          {statusMessage ? <Alert><AlertDescription>{statusMessage}</AlertDescription></Alert> : null}
          {items.length === 0 ? <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{dictionary.assessmentEmpty}</div> : null}
          {items.map((item) => (
            <section id={item.assessmentId ? `assessment-${item.assessmentId}` : `journey-assessment-${item.journeyId}`} key={item.journeyId} className="grid scroll-mt-6 gap-4 rounded-md border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.traineeName}</h3>
                  <p className="text-sm text-muted-foreground">{readinessLabel(item, dictionary)}</p>
                </div>
                {item.assessmentStatus ? <Badge variant="secondary">{dictionary.assessmentStatus[item.assessmentStatus]}</Badge> : null}
              </div>

              {item.canRequestReadiness ? (
                <form action={requestAssessmentReview.bind(null, locale)}>
                  <input type="hidden" name="journeyId" value={item.journeyId} />
                  <Button type="submit">{dictionary.requestAssessmentReadiness}</Button>
                </form>
              ) : null}

              {item.canDecideReadiness && item.readinessRequestId ? (
                <form action={decideAssessmentReview.bind(null, locale)} className="grid gap-3 rounded-md bg-muted/40 p-4">
                  <input type="hidden" name="requestId" value={item.readinessRequestId} />
                  <div className="grid gap-2">
                    <Label htmlFor={`assessment-decision-${item.journeyId}`}>{dictionary.assessmentDecisionReason}</Label>
                    <Textarea id={`assessment-decision-${item.journeyId}`} name="reason" maxLength={1000} placeholder={dictionary.assessmentDecisionReasonPlaceholder} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button name="decision" value="approved">{dictionary.approveAssessmentReadiness}</Button>
                    <Button name="decision" value="rejected" variant="outline">{dictionary.rejectAssessmentReadiness}</Button>
                  </div>
                </form>
              ) : null}

              {item.assessmentId ? (
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <p><span className="font-medium">{dictionary.revision}:</span> {item.revisionNumber}</p>
                  <p><span className="font-medium">{dictionary.assessor}:</span> {item.assessorName ?? dictionary.unassignedAssessor}</p>
                  <p><span className="font-medium">{dictionary.assessmentDate}:</span> {item.scheduledAt ? dateFormatter.format(new Date(item.scheduledAt)) : "—"}</p>
                </div>
              ) : null}

              {item.canAssignAssessor && item.assessmentId ? (
                <AssessorAssignmentForm
                  locale={locale}
                  assessmentId={item.assessmentId}
                  candidates={activeCandidates}
                  currentAssessorUserId={item.assessorUserId}
                  dictionary={dictionary}
                />
              ) : null}

              {item.canSchedule && item.assessmentId ? (
                <form action={scheduleAssessmentAction.bind(null, locale)} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="assessmentId" value={item.assessmentId} />
                  <div className="grid gap-2">
                    <Label htmlFor={`scheduled-${item.assessmentId}`}>{dictionary.assessmentDate}</Label>
                    <Input id={`scheduled-${item.assessmentId}`} name="scheduledAt" type="datetime-local" required />
                  </div>
                  <Button type="submit">{dictionary.scheduleAssessment}</Button>
                </form>
              ) : null}

              {item.canRecordOutcome && item.assessmentId ? (
                <form action={recordAssessmentOutcomeAction.bind(null, locale)} className="grid gap-3 rounded-md bg-muted/40 p-4">
                  <input type="hidden" name="assessmentId" value={item.assessmentId} />
                  <div className="grid gap-2">
                    <Label htmlFor={`outcome-${item.assessmentId}`}>{dictionary.outcome}</Label>
                    <select id={`outcome-${item.assessmentId}`} name="outcome" className="h-10 rounded-md border bg-background px-3 text-sm" required>
                      {(Object.keys(dictionary.assessmentOutcomeOptions) as Array<"incomplete" | "revision_required" | "failed" | "passed">).map((outcome) => <option key={outcome} value={outcome}>{dictionary.assessmentOutcomeOptions[outcome]}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2"><Label htmlFor={`notes-${item.assessmentId}`}>{dictionary.assessmentNotes}</Label><Textarea id={`notes-${item.assessmentId}`} name="notes" maxLength={4000} placeholder={dictionary.assessmentNotesPlaceholder} /></div>
                  <div className="grid gap-2"><Label htmlFor={`next-${item.assessmentId}`}>{dictionary.nextAction}</Label><Textarea id={`next-${item.assessmentId}`} name="nextAction" maxLength={1000} placeholder={dictionary.nextActionPlaceholder} /></div>
                  <Button type="submit" className="w-fit">{dictionary.recordOutcome}</Button>
                </form>
              ) : null}

              {item.assessedAt ? <p className="text-sm"><span className="font-medium">{dictionary.assessedOn}:</span> {dateFormatter.format(new Date(item.assessedAt))}</p> : null}
              {item.notes ? <p className="whitespace-pre-wrap text-sm"><span className="font-medium">{dictionary.assessmentNotes}:</span> {item.notes}</p> : null}
              {item.nextAction ? <Alert><AlertDescription><span className="font-medium">{dictionary.nextAction}:</span> {item.nextAction}</AlertDescription></Alert> : null}
              {item.canVerifyRemediation && item.assessmentId ? (
                <form action={verifyAssessmentRemediationAction.bind(null, locale)}>
                  <input type="hidden" name="assessmentId" value={item.assessmentId} />
                  <Button type="submit">{dictionary.verifyRemediation}</Button>
                </form>
              ) : null}
            </section>
          ))}
        </CardContent>
    </Card>
  );
}
