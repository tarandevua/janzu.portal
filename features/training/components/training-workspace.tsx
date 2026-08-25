"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  correctTraining,
  reviewTraining,
  submitTrainingRecord,
  type TrainingActionState,
} from "@/features/training/actions";
import type { Locale } from "@/lib/i18n/config";
import {
  formatTrainingDate,
  formatTrainingDateTime,
  type TrainingLevel,
  type TrainingRecord,
  type TrainingSubject,
} from "@/server/models/training.model";

type Dictionary = {
  title: string;
  description: string;
  guide: string;
  addTitle: string;
  level: string;
  level1: string;
  level2: string;
  level3: string;
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
  currentLevel: string;
  noVerifiedLevel: string;
  recordDetails: string;
  yes: string;
  no: string;
  notProvided: string;
  verifier: string;
  verifiedAt: string;
  claimed: string;
  verified: string;
  rejected: string;
  approve: string;
  reject: string;
  rejectionReason: string;
  submitted: string;
  invalid: string;
  error: string;
  correct: string;
  corrected: string;
  reviewingTitle: string;
  activeInstructor: string;
  noActiveInstructor: string;
  backToSupervision: string;
};

const INITIAL_ACTION_STATE: TrainingActionState = {
  ok: false,
  status: "idle",
  resultId: null,
};

function trainingLevelLabel(level: TrainingLevel, dictionary: Dictionary) {
  if (level === "level_1") return dictionary.level1;
  if (level === "level_2") return dictionary.level2;
  return dictionary.level3;
}

function avatarFallback(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "JT";
}

function TrainingFields({ dictionary, record }: { dictionary: Dictionary; record?: TrainingRecord }) {
  return (
    <>
      <div className="grid gap-2"><Label htmlFor={`level-${record?.id ?? "new"}`}>{dictionary.level}</Label><select id={`level-${record?.id ?? "new"}`} name="level" defaultValue={record?.level ?? "level_1"} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="level_1">{dictionary.level1}</option><option value="level_2">{dictionary.level2}</option><option value="level_3">{dictionary.level3}</option></select></div>
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

function TrainingRecordForm({
  locale,
  dictionary,
  record,
}: {
  locale: Locale;
  dictionary: Dictionary;
  record?: TrainingRecord;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handledResultId = useRef<string | null>(null);
  const action = record
    ? correctTraining.bind(null, locale)
    : submitTrainingRecord.bind(null, locale);
  const [state, formAction, isPending] = useActionState<TrainingActionState, FormData>(
    action,
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (!state.resultId || handledResultId.current === state.resultId) return;
    handledResultId.current = state.resultId;

    if (state.ok) {
      toast.success(dictionary[state.status as keyof Dictionary]);
      if (!record) formRef.current?.reset();
      router.refresh();
    } else {
      toast.error(dictionary[state.status as keyof Dictionary]);
    }
  }, [dictionary, record, router, state.ok, state.resultId, state.status]);

  return (
    <form ref={formRef} action={formAction} className={record ? "mt-3 grid gap-4 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
      {record ? <input type="hidden" name="recordId" value={record.id} /> : null}
      <TrainingFields dictionary={dictionary} record={record} />
      <Button className="w-fit" type="submit" disabled={isPending}>
        {record ? dictionary.correct : dictionary.submit}
      </Button>
    </form>
  );
}

function TrainingReviewForm({
  locale,
  traineeUserId,
  record,
  dictionary,
}: {
  locale: Locale;
  traineeUserId: string;
  record: TrainingRecord;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const handledResultId = useRef<string | null>(null);
  const [state, formAction, isPending] = useActionState<TrainingActionState, FormData>(
    reviewTraining.bind(null, locale),
    INITIAL_ACTION_STATE
  );

  useEffect(() => {
    if (!state.resultId || handledResultId.current === state.resultId) return;
    handledResultId.current = state.resultId;
    if (state.ok) {
      toast.success(dictionary[state.status as keyof Dictionary]);
      router.refresh();
    } else {
      toast.error(dictionary[state.status as keyof Dictionary]);
    }
  }, [dictionary, router, state.ok, state.resultId, state.status]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="recordId" value={record.id} />
      <input type="hidden" name="traineeId" value={traineeUserId} />
      <div className="grid min-w-60 flex-1 gap-2"><Label htmlFor={`reason-${record.id}`}>{dictionary.rejectionReason}</Label><Input id={`reason-${record.id}`} name="reason" maxLength={1000} /></div>
      <Button name="decision" value="approve" size="sm" disabled={isPending || !record.courseworkComplete}>{dictionary.approve}</Button>
      <Button name="decision" value="reject" size="sm" variant="outline" disabled={isPending}>{dictionary.reject}</Button>
    </form>
  );
}

export function TrainingWorkspace({
  locale,
  traineeUserId,
  subject,
  records,
  currentLevel,
  canSubmit,
  canReview,
  focusRecordId,
  dictionary,
}: {
  locale: Locale;
  traineeUserId: string;
  subject: TrainingSubject;
  records: TrainingRecord[];
  currentLevel: TrainingLevel | null;
  canSubmit: boolean;
  canReview: boolean;
  focusRecordId: string | null;
  dictionary: Dictionary;
}) {
  useEffect(() => {
    if (!focusRecordId) return;
    const focusedRecord = document.getElementById(`training-record-${focusRecordId}`);
    focusedRecord?.focus({ preventScroll: true });
    focusedRecord?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusRecordId]);

  return (
    <div className="grid gap-4">
      {canReview ? (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-14 w-14">
                {subject.profileImageUrl ? (
                  <AvatarImage src={subject.profileImageUrl} alt={subject.displayName} />
                ) : null}
                <AvatarFallback>{avatarFallback(subject.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardDescription>{dictionary.reviewingTitle}</CardDescription>
                <CardTitle className="truncate">{subject.displayName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subject.activeInstructorName
                    ? `${dictionary.activeInstructor}: ${subject.activeInstructorName}`
                    : dictionary.noActiveInstructor}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/dashboard/supervision`}>
                {dictionary.backToSupervision}
              </Link>
            </Button>
          </CardHeader>
        </Card>
      ) : null}

      {canSubmit ? (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.addTitle}</CardTitle>
            <CardDescription>{dictionary.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrainingRecordForm locale={locale} dictionary={dictionary} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.records}</CardTitle>
          <CardDescription>
            {dictionary.currentLevel}: {currentLevel
              ? trainingLevelLabel(currentLevel, dictionary)
              : dictionary.noVerifiedLevel}
          </CardDescription>
          <Link
            className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
            href={`/${locale}/dashboard/knowledge-base/certification/training-history`}
          >
            {dictionary.guide}
          </Link>
        </CardHeader>
        <CardContent className="grid gap-3">
          {records.length === 0 ? <p className="text-sm text-muted-foreground">{dictionary.empty}</p> : records.map((record) => (
            <div
              className={`grid gap-3 rounded-md border p-4 outline-none ${focusRecordId === record.id ? "border-primary ring-2 ring-primary/30" : ""}`}
              id={`training-record-${record.id}`}
              key={record.id}
              tabIndex={-1}
            >
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium">{trainingLevelLabel(record.level, dictionary)} · {record.cohort}</div><Badge variant={record.status === "verified" ? "default" : "secondary"}>{dictionary[record.status]}</Badge></div>
              <div className="text-sm text-muted-foreground">
                {formatTrainingDate(record.startedOn, locale)} — {formatTrainingDate(record.completedOn, locale)} · {record.location} · {record.teachingInstructorName}
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-medium">{dictionary.recordDetails}</summary>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="font-medium">{dictionary.courseworkComplete}</dt><dd className="text-muted-foreground">{record.courseworkComplete ? dictionary.yes : dictionary.no}</dd></div>
                  <div><dt className="font-medium">{dictionary.evidence}</dt><dd className="break-words text-muted-foreground">{record.evidenceReference ?? dictionary.notProvided}</dd></div>
                  <div className="sm:col-span-2"><dt className="font-medium">{dictionary.notes}</dt><dd className="whitespace-pre-wrap break-words text-muted-foreground">{record.notes ?? dictionary.notProvided}</dd></div>
                  {record.verifiedBy ? (
                    <>
                      <div><dt className="font-medium">{dictionary.verifier}</dt><dd className="text-muted-foreground">{record.verifiedByName ?? dictionary.notProvided}</dd></div>
                      <div><dt className="font-medium">{dictionary.verifiedAt}</dt><dd className="text-muted-foreground">{record.verifiedAt ? formatTrainingDateTime(record.verifiedAt, locale) : dictionary.notProvided}</dd></div>
                    </>
                  ) : null}
                </dl>
              </details>
              {record.rejectionReason ? <p className="text-sm text-destructive">{record.rejectionReason}</p> : null}
              {canSubmit && record.status !== "verified" ? (
                <details>
                  <summary className="cursor-pointer text-sm font-medium">{dictionary.correct}</summary>
                  <TrainingRecordForm locale={locale} dictionary={dictionary} record={record} />
                </details>
              ) : null}
              {canReview && record.status === "claimed" ? (
                <TrainingReviewForm locale={locale} traineeUserId={traineeUserId} record={record} dictionary={dictionary} />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
