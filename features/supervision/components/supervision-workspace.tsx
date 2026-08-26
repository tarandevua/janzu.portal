import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/server/models/rbac.model";
import type { SupervisionAssignment, SupervisionPerson } from "@/server/models/supervision.model";
import {
  adminAssignInstructorAction,
} from "@/features/supervision/actions";
import { InstructorRequestForm } from "@/features/supervision/components/instructor-request-form";
import {
  CancelInstructorRequestForm,
  EndInstructorRelationshipForm,
  InstructorRequestResponseForm,
} from "@/features/supervision/components/relationship-action-forms";

type Dictionary = {
  title: string;
  description: string;
  chooseInstructor: string;
  chooseInstructorDescription: string;
  instructor: string;
  trainee: string;
  request: string;
  requests: string;
  history: string;
  empty: string;
  accept: string;
  decline: string;
  cancelRequest: string;
  end: string;
  reason: string;
  status: string;
  pending: string;
  active: string;
  declined: string;
  ended: string;
  cancelled: string;
  training: string;
  adminAssign: string;
  assign: string;
  requested: string;
  accepted: string;
  requestDeclined: string;
  requestCancelled: string;
  relationshipEnded: string;
  assigned: string;
  invalid: string;
  alreadyPending: string;
  error: string;
  responseError: string;
  cancelError: string;
  endError: string;
  trainingAccessDenied: string;
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
  nextActions: {
    reviewTraining: string;
    reviewSessionProgress: string;
    reviewLevel2Milestone: string;
    reviewAssessmentMilestone: string;
    reviewRevision: string;
    monitorJourney: string;
  };
};

function PersonSelect({ name, people, label }: { name: string; people: SupervisionPerson[]; label: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} required className="h-10 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">—</option>
        {people.map((person) => <option key={person.userId} value={person.userId}>{person.displayName}</option>)}
      </select>
    </div>
  );
}

export function SupervisionWorkspace({
  locale,
  userId,
  roles,
  assignments,
  instructors,
  requestableInstructors,
  trainees,
  dictionary,
  status,
}: {
  locale: Locale;
  userId: string;
  roles: Role[];
  assignments: SupervisionAssignment[];
  instructors: SupervisionPerson[];
  requestableInstructors: SupervisionPerson[];
  trainees: SupervisionPerson[];
  dictionary: Dictionary;
  status?: string;
}) {
  const isTrainee = roles.includes("apprentice");
  const isInstructor = roles.includes("instructor");
  const isAdmin = roles.includes("admin");
  const adminAction = adminAssignInstructorAction.bind(null, locale);
  const rawStatusMessage = status ? dictionary[status as keyof Dictionary] : null;
  const statusMessage = typeof rawStatusMessage === "string" ? rawStatusMessage : null;

  return (
    <div className="grid gap-4">
      {statusMessage ? (
        <p role="status" className="rounded-md border bg-muted p-3 text-sm">
          {statusMessage}
        </p>
      ) : null}

      {isTrainee ? (
        <Card>
          <CardHeader><CardTitle>{dictionary.chooseInstructor}</CardTitle><CardDescription>{dictionary.chooseInstructorDescription}</CardDescription></CardHeader>
          <CardContent>
            <InstructorRequestForm
              locale={locale}
              instructors={requestableInstructors}
              dictionary={dictionary}
            />
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <CardHeader><CardTitle>{dictionary.adminAssign}</CardTitle></CardHeader>
          <CardContent>
            <form action={adminAction} className="grid gap-3 md:grid-cols-3">
              <PersonSelect name="traineeUserId" people={trainees} label={dictionary.trainee} />
              <PersonSelect name="instructorUserId" people={instructors} label={dictionary.instructor} />
              <div className="grid gap-2"><Label htmlFor="reason">{dictionary.reason}</Label><Input id="reason" name="reason" required maxLength={500} /></div>
              <Button className="w-fit" type="submit">{dictionary.assign}</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>{dictionary.history}</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {assignments.length === 0 ? <p className="text-sm text-muted-foreground">{dictionary.empty}</p> : assignments.map((assignment) => (
            <div key={assignment.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="font-medium">{assignment.traineeName} · {assignment.instructorName}</div>
                <div className="mt-1 flex gap-2"><Badge variant={assignment.status === "active" ? "default" : "secondary"}>{dictionary[assignment.status]}</Badge></div>
                {assignment.endReason ? <p className="mt-2 text-sm text-muted-foreground">{assignment.endReason}</p> : null}
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {isInstructor && assignment.instructorUserId === userId && assignment.status === "pending" ? (
                  <InstructorRequestResponseForm
                    locale={locale}
                    assignmentId={assignment.id}
                    dictionary={dictionary}
                  />
                ) : null}
                {isTrainee && assignment.traineeUserId === userId && assignment.status === "pending" ? (
                  <CancelInstructorRequestForm
                    locale={locale}
                    assignmentId={assignment.id}
                    dictionary={dictionary}
                  />
                ) : null}
                {assignment.status === "active" ? (
                  <>
                    <Button asChild variant="outline" size="sm"><Link href={`/${locale}/dashboard/training?traineeId=${assignment.traineeUserId}`}>{dictionary.training}</Link></Button>
                    <EndInstructorRelationshipForm
                      locale={locale}
                      assignmentId={assignment.id}
                      dictionary={dictionary}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
