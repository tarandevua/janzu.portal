"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateEmailPreferences } from "@/features/settings/actions";
import type { Locale } from "@/lib/i18n/config";
import type { EmailPreference, EmailPreferenceKey } from "@/server/models/transactional-email.model";

type EmailPreferencesDictionary = {
  emailTitle: string;
  emailDescription: string;
  requiredEmailNotice: string;
  sessionUpdates: string;
  bookingRequests: string;
  feedbackUpdates: string;
  supervisionUpdates: string;
  certificationDecisions: string;
  saveEmailPreferences: string;
  emailPreferencesSaved: string;
  emailPreferencesInvalid: string;
  emailPreferencesFailed: string;
  savingEmailPreferences: string;
};

function SaveEmailPreferencesButton({ dictionary }: { dictionary: EmailPreferencesDictionary }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      <MailCheckIcon className="h-4 w-4" />
      {pending ? dictionary.savingEmailPreferences : dictionary.saveEmailPreferences}
    </Button>
  );
}

const labels: Record<EmailPreferenceKey, keyof EmailPreferencesDictionary> = {
  session_updates: "sessionUpdates",
  booking_requests: "bookingRequests",
  feedback_updates: "feedbackUpdates",
  supervision_updates: "supervisionUpdates",
  certification_decisions: "certificationDecisions",
};

export function EmailPreferencesForm({
  locale,
  preferences,
  status,
  dictionary,
}: {
  locale: Locale;
  preferences: EmailPreference[];
  status?: string;
  dictionary: EmailPreferencesDictionary;
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(preferences.map((item) => [item.key, item.enabled])) as Record<EmailPreferenceKey, boolean>
  );
  const action = updateEmailPreferences.bind(null, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.emailTitle}</CardTitle>
        <CardDescription>{dictionary.emailDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "email-preferences-saved" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700" role="status">
            {dictionary.emailPreferencesSaved}
          </p>
        ) : null}
        {status === "email-preferences-invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive" role="alert">
            {dictionary.emailPreferencesInvalid}
          </p>
        ) : null}
        {status === "email-preferences-failed" ? (
          <p className="mb-4 text-sm font-medium text-destructive" role="alert">
            {dictionary.emailPreferencesFailed}
          </p>
        ) : null}
        <form action={action} className="grid gap-4">
          <p className="text-sm text-muted-foreground">{dictionary.requiredEmailNotice}</p>
          {preferences.map((preference) => (
            <div key={preference.key} className="flex items-start gap-3 rounded-md border p-4">
              <input type="hidden" name={preference.key} value={values[preference.key] ? "true" : "false"} />
              <Checkbox
                id={`email-${preference.key}`}
                checked={values[preference.key]}
                onCheckedChange={(checked) =>
                  setValues((current) => ({ ...current, [preference.key]: checked === true }))
                }
              />
              <Label htmlFor={`email-${preference.key}`}>{dictionary[labels[preference.key]]}</Label>
            </div>
          ))}
          <div className="flex justify-end">
            <SaveEmailPreferencesButton dictionary={dictionary} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
