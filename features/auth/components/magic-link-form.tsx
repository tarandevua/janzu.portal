"use client";

import { useEffect, useRef, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { sendMagicLinkInline } from "@/features/auth/actions";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MagicLinkDictionary = {
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
  success: string;
  invalidEmail: string;
  genericError: string;
  authRequired: string;
  invalidLink: string;
  signedOut: string;
  unknownUserDisabled: string;
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
};

export function MagicLinkForm({ dictionary, locale, status }: MagicLinkFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const handledStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!status || handledStatusRef.current === status) {
      return;
    }

    handledStatusRef.current = status;
    const messageKey = statusCopy[status];

    if (!messageKey) {
      return;
    }

    if (["sent", "signed-out"].includes(status)) {
      toast.success(dictionary[messageKey]);
    } else {
      toast.error(dictionary[messageKey]);
    }

    router.replace(`/${locale}/login`);
  }, [dictionary, locale, router, status]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(dictionary.sending);

    startTransition(() => {
      void sendMagicLinkInline(locale, formData)
        .then((result) => {
          const messageKey = statusCopy[result.status] ?? "genericError";

          if (result.ok) {
            toast.success(dictionary[messageKey], { id: toastId });
            return;
          }

          toast.error(dictionary[messageKey], { id: toastId });
        })
        .catch(() => {
          toast.error(dictionary.genericError, { id: toastId });
        });
    });
  }

  return (
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
  );
}
