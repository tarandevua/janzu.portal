"use client";

import React, { useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestCertificateReplacementInline } from "@/features/certification/actions";
import type { Locale } from "@/lib/i18n/config";

export function CertificateReplacementRequestForm({
  locale,
  certificateId,
  dictionary,
}: {
  locale: Locale;
  certificateId: string;
  dictionary: {
    replacementReason: string;
    replacementReasonPlaceholder: string;
    requestReplacement: string;
    statusMessages: Record<string, string>;
  };
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const toastId = toast.loading(`${dictionary.requestReplacement}…`);

    startTransition(async () => {
      try {
        const result = await requestCertificateReplacementInline(locale, formData);
        const message = dictionary.statusMessages[result.status]
          ?? dictionary.statusMessages["certificate-action-failed"];

        if (!result.ok) {
          toast.error(message, { id: toastId });
          return;
        }

        toast.success(message, { id: toastId });
        form.reset();
        router.refresh();
      } catch {
        toast.error(dictionary.statusMessages["certificate-action-failed"], { id: toastId });
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-md border p-4">
      <input type="hidden" name="certificateId" value={certificateId} />
      <Label htmlFor={`replacement-request-${certificateId}`}>
        {dictionary.replacementReason}
      </Label>
      <Textarea
        id={`replacement-request-${certificateId}`}
        name="reason"
        minLength={10}
        maxLength={1000}
        required
        disabled={isPending}
        placeholder={dictionary.replacementReasonPlaceholder}
      />
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? `${dictionary.requestReplacement}…` : dictionary.requestReplacement}
      </Button>
    </form>
  );
}
