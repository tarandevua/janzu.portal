"use client";

import React, { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleCheckBig, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { sendMagicLinkInline } from "@/features/auth/actions";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MagicLinkDictionary = {
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
  success: string;
  successTitle: string;
  successDescription: string;
  invalidEmail: string;
  genericError: string;
  authRequired: string;
  invalidLink: string;
  signedOut: string;
  unknownUserDisabled: string;
  deletedUser: string;
};

type MagicLinkFormProps = {
  dictionary: MagicLinkDictionary;
  locale: Locale;
  status?: string;
};

const statusCopy: Record<string, keyof MagicLinkDictionary> = {
  sent: "success",
  "invalid-email": "invalidEmail",
  error: "genericError",
  "auth-required": "authRequired",
  "invalid-link": "invalidLink",
  "signed-out": "signedOut",
  "unknown-user-disabled": "unknownUserDisabled",
  "deleted-user": "deletedUser",
};

const errorCodeCopy: Record<string, keyof MagicLinkDictionary> = {
  otp_expired: "invalidLink",
};

const ERROR_TOAST_DURATION = 12_000;

export function MagicLinkForm({ dictionary, locale, status }: MagicLinkFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const handledStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const authErrorCode = hashParams.get("error_code");
    const authError = hashParams.get("error");
    const handledStatus = status ?? authErrorCode ?? authError ?? undefined;

    if (!handledStatus || handledStatusRef.current === handledStatus) {
      return;
    }

    handledStatusRef.current = handledStatus;
    const messageKey = status
      ? statusCopy[status]
      : (authErrorCode && errorCodeCopy[authErrorCode]) ||
        (authError === "access_denied" ? "invalidLink" : undefined);

    if (!messageKey) {
      return;
    }

    if (status && ["sent", "signed-out"].includes(status)) {
      toast.success(dictionary[messageKey]);
    } else {
      toast.error(dictionary[messageKey], { duration: ERROR_TOAST_DURATION });
    }

    router.replace(`/${locale}/login`);
  }, [dictionary, locale, router, status]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const toastId = toast.loading(dictionary.sending);

    startTransition(() => {
      void sendMagicLinkInline(locale, formData)
        .then((result) => {
          const messageKey = statusCopy[result.status] ?? "genericError";

          if (result.ok) {
            setSentEmail(email);
            toast.success(dictionary[messageKey], { id: toastId });
            return;
          }

          toast.error(dictionary[messageKey], { id: toastId, duration: ERROR_TOAST_DURATION });
        })
        .catch(() => {
          toast.error(dictionary.genericError, { id: toastId, duration: ERROR_TOAST_DURATION });
        });
    });
  }

  if (sentEmail) {
    return (
      <div className="py-6 text-center" role="status" aria-live="polite">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CircleCheckBig className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold">{dictionary.successTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {dictionary.successDescription}
        </p>
        <p className="mt-3 break-all text-sm font-medium text-foreground">{sentEmail}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Mail className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-semibold">{dictionary.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{dictionary.description}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{dictionary.emailLabel}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={dictionary.emailPlaceholder}
            autoComplete="email"
            disabled={isPending}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {isPending ? dictionary.sending : dictionary.submit}
        </Button>
      </form>
    </>
  );
}
