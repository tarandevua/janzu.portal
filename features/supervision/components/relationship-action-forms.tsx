"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelInstructorRequest,
  endInstructorAssignment,
  respondInstructorRequest,
} from "@/features/supervision/actions";
import type { Locale } from "@/lib/i18n/config";

type RelationshipActionDictionary = {
  accept: string;
  decline: string;
  cancelRequest: string;
  end: string;
  reason: string;
  accepted: string;
  requestDeclined: string;
  requestCancelled: string;
  relationshipEnded: string;
  invalid: string;
  responseError: string;
  cancelError: string;
  endError: string;
};

export function InstructorRequestResponseForm({
  locale,
  assignmentId,
  dictionary,
}: {
  locale: Locale;
  assignmentId: string;
  dictionary: RelationshipActionDictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) formData.set(submitter.name, submitter.value);

    startTransition(async () => {
      try {
        const result = await respondInstructorRequest(locale, formData);
        if (!result.ok) {
          toast.error(result.status === "invalid" ? dictionary.invalid : dictionary.responseError);
          return;
        }

        toast.success(
          result.status === "accepted" ? dictionary.accepted : dictionary.requestDeclined
        );
        router.refresh();
      } catch {
        toast.error(dictionary.responseError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button name="decision" value="accept" size="sm" disabled={isPending}>
        {dictionary.accept}
      </Button>
      <Button name="decision" value="decline" variant="outline" size="sm" disabled={isPending}>
        {dictionary.decline}
      </Button>
    </form>
  );
}

export function EndInstructorRelationshipForm({
  locale,
  assignmentId,
  dictionary,
}: {
  locale: Locale;
  assignmentId: string;
  dictionary: RelationshipActionDictionary;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await endInstructorAssignment(locale, formData);
        if (!result.ok) {
          toast.error(result.status === "invalid" ? dictionary.invalid : dictionary.endError);
          return;
        }

        toast.success(dictionary.relationshipEnded);
        formRef.current?.reset();
        router.refresh();
      } catch {
        toast.error(dictionary.endError);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Input
        className="h-9 w-44"
        name="reason"
        maxLength={500}
        placeholder={dictionary.reason}
        disabled={isPending}
      />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {dictionary.end}
      </Button>
    </form>
  );
}

export function CancelInstructorRequestForm({
  locale,
  assignmentId,
  dictionary,
}: {
  locale: Locale;
  assignmentId: string;
  dictionary: RelationshipActionDictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await cancelInstructorRequest(locale, formData);
        if (!result.ok) {
          toast.error(result.status === "invalid" ? dictionary.invalid : dictionary.cancelError);
          return;
        }

        toast.success(dictionary.requestCancelled);
        router.refresh();
      } catch {
        toast.error(dictionary.cancelError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {dictionary.cancelRequest}
      </Button>
    </form>
  );
}
