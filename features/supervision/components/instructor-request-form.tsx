"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestInstructor } from "@/features/supervision/actions";
import type { Locale } from "@/lib/i18n/config";
import type { SupervisionPerson } from "@/server/models/supervision.model";

type InstructorRequestDictionary = {
  instructor: string;
  request: string;
  requested: string;
  invalid: string;
  alreadyPending: string;
  error: string;
};

export function InstructorRequestForm({
  locale,
  instructors,
  dictionary,
}: {
  locale: Locale;
  instructors: SupervisionPerson[];
  dictionary: InstructorRequestDictionary;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await requestInstructor(locale, formData);

        if (!result.ok) {
          toast.error(dictionary[result.status]);
          return;
        }

        toast.success(dictionary.requested);
        formRef.current?.reset();
        router.refresh();
      } catch {
        // This also handles browser-to-Server-Action transport failures.
        toast.error(dictionary.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="grid min-w-64 flex-1 gap-2">
        <Label htmlFor="instructorUserId">{dictionary.instructor}</Label>
        <select
          id="instructorUserId"
          name="instructorUserId"
          required
          disabled={isPending}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">—</option>
          {instructors.map((instructor) => (
            <option key={instructor.userId} value={instructor.userId}>
              {instructor.displayName}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={isPending || instructors.length === 0}>
        {dictionary.request}
      </Button>
    </form>
  );
}
