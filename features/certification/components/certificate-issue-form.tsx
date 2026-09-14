"use client";

import React, { useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { issueCertificateInline } from "@/features/certification/actions";
import type { Locale } from "@/lib/i18n/config";

export function CertificateIssueForm({
  locale,
  journeyId,
  templateReady,
  dictionary,
}: {
  locale: Locale;
  journeyId: string;
  templateReady: boolean;
  dictionary: {
    issueCertificate: string;
    statusMessages: Record<string, string>;
  };
}) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || !templateReady) return;

    submittingRef.current = true;
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(`${dictionary.issueCertificate}…`);

    startTransition(async () => {
      try {
        const result = await issueCertificateInline(locale, formData);
        const fallback = dictionary.statusMessages[result.status]
          ?? dictionary.statusMessages["certificate-action-failed"];

        if (!result.ok) {
          toast.error(result.message ?? fallback, { id: toastId });
          return;
        }

        toast.success(fallback, { id: toastId });
        router.refresh();
      } catch {
        toast.error(dictionary.statusMessages["certificate-action-failed"], { id: toastId });
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="journeyId" value={journeyId} />
      <Button type="submit" disabled={!templateReady || isPending}>
        {isPending ? `${dictionary.issueCertificate}…` : dictionary.issueCertificate}
      </Button>
    </form>
  );
}
