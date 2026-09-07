"use client";

import React, { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignAssessmentInline,
  cancelAssessmentAssignmentInline,
  manageAssessorDesignationInline,
} from "@/features/certification/actions";
import type { Locale } from "@/lib/i18n/config";
import type { AssessorCandidate } from "@/server/models/certification.model";

type StatusMessages = Record<string, string>;

export function AssessorDesignationForm({
  locale,
  candidate,
  dictionary,
}: {
  locale: Locale;
  candidate: AssessorCandidate;
  dictionary: {
    designationReason: string;
    designateAssessor: string;
    revokeAssessor: string;
    activeAssessor: string;
    inactiveAssessor: string;
    assessmentStatusMessages: StatusMessages;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const actionLabel = candidate.active
    ? dictionary.revokeAssessor
    : dictionary.designateAssessor;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const toastId = toast.loading(`${actionLabel}…`);

    startTransition(async () => {
      try {
        const result = await manageAssessorDesignationInline(locale, formData);
        const message = dictionary.assessmentStatusMessages[result.status];

        if (!result.ok) {
          toast.error(
            message ?? dictionary.assessmentStatusMessages["assessor-designation-failed"],
            { id: toastId }
          );
          return;
        }

        toast.success(message, { id: toastId });
        form.reset();
        router.refresh();
      } catch {
        toast.error(dictionary.assessmentStatusMessages["assessor-designation-failed"], {
          id: toastId,
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,2fr)_auto] sm:items-end"
    >
      <input type="hidden" name="userId" value={candidate.userId} />
      <input type="hidden" name="active" value={candidate.active ? "false" : "true"} />
      <div>
        <p className="font-medium">{candidate.displayName}</p>
        <Badge variant={candidate.active ? "default" : "secondary"}>
          {candidate.active ? dictionary.activeAssessor : dictionary.inactiveAssessor}
        </Badge>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`designation-reason-${candidate.userId}`}>
          {dictionary.designationReason}
        </Label>
        <Input
          id={`designation-reason-${candidate.userId}`}
          name="reason"
          minLength={10}
          maxLength={1000}
          required
        />
      </div>
      <Button type="submit" variant={candidate.active ? "outline" : "default"} disabled={isPending}>
        {isPending ? `${actionLabel}…` : actionLabel}
      </Button>
    </form>
  );
}

export function AssessorAssignmentForm({
  locale,
  assessmentId,
  candidates,
  currentAssessorUserId,
  dictionary,
}: {
  locale: Locale;
  assessmentId: string;
  candidates: AssessorCandidate[];
  currentAssessorUserId: string | null;
  dictionary: {
    assessor: string;
    unassignedAssessor: string;
    assignAssessor: string;
    changeAssessor: string;
    cancelAssessorAssignment: string;
    assessmentStatusMessages: StatusMessages;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const actionLabel = currentAssessorUserId
    ? dictionary.changeAssessor
    : dictionary.assignAssessor;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(`${actionLabel}…`);

    startTransition(async () => {
      try {
        const result = await assignAssessmentInline(locale, formData);
        const message = dictionary.assessmentStatusMessages[result.status];

        if (!result.ok) {
          toast.error(
            message ?? dictionary.assessmentStatusMessages["assessment-assignment-failed"],
            { id: toastId }
          );
          return;
        }

        toast.success(message, { id: toastId });
        router.refresh();
      } catch {
        toast.error(dictionary.assessmentStatusMessages["assessment-assignment-failed"], {
          id: toastId,
        });
      }
    });
  }

  function handleCancel() {
    const formData = new FormData();
    formData.set("assessmentId", assessmentId);
    const toastId = toast.loading(`${dictionary.cancelAssessorAssignment}…`);

    startTransition(async () => {
      try {
        const result = await cancelAssessmentAssignmentInline(locale, formData);
        const message = dictionary.assessmentStatusMessages[result.status];

        if (!result.ok) {
          toast.error(
            message ?? dictionary.assessmentStatusMessages["assessment-cancellation-failed"],
            { id: toastId }
          );
          return;
        }

        toast.success(message, { id: toastId });
        router.refresh();
      } catch {
        toast.error(dictionary.assessmentStatusMessages["assessment-cancellation-failed"], {
          id: toastId,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <div className="grid min-w-64 gap-2">
        <Label htmlFor={`assessor-${assessmentId}`}>{dictionary.assessor}</Label>
        <select
          id={`assessor-${assessmentId}`}
          name="assessorUserId"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          required
          defaultValue={currentAssessorUserId ?? ""}
          disabled={isPending}
        >
          <option value="" disabled>{dictionary.unassignedAssessor}</option>
          {candidates.map((candidate) => (
            <option key={candidate.userId} value={candidate.userId}>
              {candidate.displayName}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? `${actionLabel}…` : actionLabel}
      </Button>
      {currentAssessorUserId ? (
        <Button type="button" variant="outline" disabled={isPending} onClick={handleCancel}>
          {dictionary.cancelAssessorAssignment}
        </Button>
      ) : null}
    </form>
  );
}
