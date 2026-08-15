import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { correctTraining, submitTrainingRecord, reviewTraining } from "@/features/training/actions";
import type { Locale } from "@/lib/i18n/config";
import type { TrainingRecord } from "@/server/models/training.model";

type Dictionary = {
  title: string;
  description: string;
  addTitle: string;
  level: string;
  level1: string;
  level2: string;
  cohort: string;
  location: string;
  startedOn: string;
  completedOn: string;
  teachingInstructor: string;
  courseworkComplete: string;
  evidence: string;
  notes: string;
  submit: string;
  records: string;
  empty: string;
  claimed: string;
  verified: string;
  rejected: string;
  approve: string;
  reject: string;
  rejectionReason: string;
  submitted: string;
  invalid: string;
  correct: string;
  corrected: string;
};

function TrainingFields({ dictionary, record }: { dictionary: Dictionary; record?: TrainingRecord }) {
  return (
    <>
      <div className="grid gap-2"><Label htmlFor={`level-${record?.id ?? "new"}`}>{dictionary.level}</Label><select id={`level-${record?.id ?? "new"}`} name="level" defaultValue={record?.level} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="level_1">{dictionary.level1}</option><option value="level_2">{dictionary.level2}</option></select></div>
      <div className="grid gap-2"><Label htmlFor={`cohort-${record?.id ?? "new"}`}>{dictionary.cohort}</Label><Input id={`cohort-${record?.id ?? "new"}`} name="cohort" defaultValue={record?.cohort} required maxLength={160} /></div>
      <div className="grid gap-2"><Label htmlFor={`location-${record?.id ?? "new"}`}>{dictionary.location}</Label><Input id={`location-${record?.id ?? "new"}`} name="location" defaultValue={record?.location} required maxLength={240} /></div>
      <div className="grid gap-2"><Label htmlFor={`instructor-${record?.id ?? "new"}`}>{dictionary.teachingInstructor}</Label><Input id={`instructor-${record?.id ?? "new"}`} name="teachingInstructorName" defaultValue={record?.teachingInstructorName} required maxLength={160} /></div>
      <div className="grid gap-2"><Label htmlFor={`started-${record?.id ?? "new"}`}>{dictionary.startedOn}</Label><Input id={`started-${record?.id ?? "new"}`} name="startedOn" type="date" defaultValue={record?.startedOn} required /></div>
      <div className="grid gap-2"><Label htmlFor={`completed-${record?.id ?? "new"}`}>{dictionary.completedOn}</Label><Input id={`completed-${record?.id ?? "new"}`} name="completedOn" type="date" defaultValue={record?.completedOn} required /></div>
      <div className="grid gap-2"><Label htmlFor={`evidence-${record?.id ?? "new"}`}>{dictionary.evidence}</Label><Input id={`evidence-${record?.id ?? "new"}`} name="evidenceReference" defaultValue={record?.evidenceReference ?? ""} maxLength={1000} /></div>
      <div className="flex items-center gap-2 self-end pb-2"><Checkbox id={`coursework-${record?.id ?? "new"}`} name="courseworkComplete" defaultChecked={record?.courseworkComplete} /><Label htmlFor={`coursework-${record?.id ?? "new"}`}>{dictionary.courseworkComplete}</Label></div>
      <div className="grid gap-2 md:col-span-2"><Label htmlFor={`notes-${record?.id ?? "new"}`}>{dictionary.notes}</Label><Textarea id={`notes-${record?.id ?? "new"}`} name="notes" defaultValue={record?.notes ?? ""} maxLength={2000} /></div>
    </>
  );
}

export function TrainingWorkspace({
  locale,
  traineeUserId,
  records,
  canSubmit,
  canReview,
  dictionary,
  status,
}: {
  locale: Locale;
  traineeUserId: string;
  records: TrainingRecord[];
  canSubmit: boolean;
  canReview: boolean;
  dictionary: Dictionary;
  status?: string;
}) {
  const submitAction = submitTrainingRecord.bind(null, locale);
  const reviewAction = reviewTraining.bind(null, locale);

  return (
    <div className="grid gap-4">
      {status && dictionary[status as keyof Dictionary] ? (
        <p className="rounded-md border bg-muted p-3 text-sm" role="status">
          {dictionary[status as keyof Dictionary]}
        </p>
      ) : null}
      {canSubmit ? (
        <Card>
          <CardHeader><CardTitle>{dictionary.addTitle}</CardTitle><CardDescription>{dictionary.description}</CardDescription></CardHeader>
          <CardContent>
            <form action={submitAction} className="grid gap-4 md:grid-cols-2">
              <TrainingFields dictionary={dictionary} />
              <Button className="w-fit" type="submit">{dictionary.submit}</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>{dictionary.records}</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {records.length === 0 ? <p className="text-sm text-muted-foreground">{dictionary.empty}</p> : records.map((record) => (
            <div className="grid gap-3 rounded-md border p-4" key={record.id}>
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium">{record.level === "level_1" ? dictionary.level1 : dictionary.level2} · {record.cohort}</div><Badge variant={record.status === "verified" ? "default" : "secondary"}>{dictionary[record.status]}</Badge></div>
              <div className="text-sm text-muted-foreground">{record.startedOn} — {record.completedOn} · {record.location} · {record.teachingInstructorName}</div>
              {record.rejectionReason ? <p className="text-sm text-destructive">{record.rejectionReason}</p> : null}
              {canSubmit && record.status !== "verified" ? (
                <details>
                  <summary className="cursor-pointer text-sm font-medium">{dictionary.correct}</summary>
                  <form action={correctTraining.bind(null, locale)} className="mt-3 grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="recordId" value={record.id} />
                    <TrainingFields dictionary={dictionary} record={record} />
                    <Button className="w-fit" type="submit">{dictionary.correct}</Button>
                  </form>
                </details>
              ) : null}
              {canReview && record.status === "claimed" ? (
                <form action={reviewAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="recordId" value={record.id} />
                  <input type="hidden" name="traineeId" value={traineeUserId} />
                  <div className="grid min-w-60 flex-1 gap-2"><Label htmlFor={`reason-${record.id}`}>{dictionary.rejectionReason}</Label><Input id={`reason-${record.id}`} name="reason" maxLength={1000} /></div>
                  <Button name="decision" value="approve" size="sm" disabled={!record.courseworkComplete}>{dictionary.approve}</Button>
                  <Button name="decision" value="reject" size="sm" variant="outline">{dictionary.reject}</Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
