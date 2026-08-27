"use client";

import React, { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveWhatsAppConsentInline } from "@/features/practitioners/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type { PractitionerProfile } from "@/server/models/practitioner.model";

type Dictionary = {
  title: string; description: string; number: string; numberHelp: string;
  visibility: string; private: string; community: string; neverPublic: string;
  consent: string; consentHelp: string; save: string; saving: string;
  revoke: string; saved: string; revoked: string; invalid: string; error: string;
  consentRecorded: string;
};

export function WhatsAppConsentForm({ locale, profile, dictionary }: {
  locale: Locale; profile: PractitionerProfile; dictionary: Dictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget);
    formData.set("intent", submitter?.value === "revoke" ? "revoke" : "save");

    startTransition(async () => {
      try {
        const result = await saveWhatsAppConsentInline(locale, formData);
        if (result.ok) {
          toast.success(result.status === "revoked" ? dictionary.revoked : dictionary.saved);
          router.refresh();
          return;
        }
        toast.error(result.status === "invalid" ? dictionary.invalid : dictionary.error);
      } catch {
        toast.error(dictionary.error);
      }
    });
  }

  return (
    <Card id="whatsapp-consent">
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-number">{dictionary.number}</Label>
            <Input id="whatsapp-number" name="number" type="tel" inputMode="tel"
              placeholder="+37360123456" defaultValue={profile.whatsapp.number ?? ""} />
            <p className="text-xs text-muted-foreground">{dictionary.numberHelp}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp-visibility">{dictionary.visibility}</Label>
            <select id="whatsapp-visibility" name="visibility"
              defaultValue={profile.whatsapp.visibility}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="private">{dictionary.private}</option>
              <option value="community">{dictionary.community}</option>
            </select>
            <p className="text-xs text-muted-foreground">{dictionary.neverPublic}</p>
          </div>
          <div className="flex items-start gap-3">
            <input id="whatsapp-consent-checkbox" name="affirmativeConsent" value="yes"
              type="checkbox" className="mt-1 size-4" />
            <div className="grid gap-1">
              <Label htmlFor="whatsapp-consent-checkbox">{dictionary.consent}</Label>
              <p className="text-xs text-muted-foreground">{dictionary.consentHelp}</p>
            </div>
          </div>
          {profile.whatsapp.grantedAt ? (
            <p className="text-sm text-muted-foreground">{dictionary.consentRecorded}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" value="save" disabled={isPending}>
              {isPending ? dictionary.saving : dictionary.save}
            </Button>
            {profile.whatsapp.number ? (
              <Button type="submit" value="revoke" variant="destructive" disabled={isPending}>
                {dictionary.revoke}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
