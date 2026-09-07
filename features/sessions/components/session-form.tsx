"use client";

import React, { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import { DeviceMetadataFields } from "@/components/device-metadata-fields";
import type { Client } from "@/server/models/client.model";
import { createSession } from "@/features/sessions/actions";
import { SessionClientPicker } from "@/features/sessions/components/session-client-picker";
import { SessionDatePicker } from "@/features/sessions/components/session-date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SessionFormProps = {
  locale: Locale;
  clients: Client[];
  variant?: "card" | "plain";
  onSuccess?: () => void;
  dictionary: {
    formTitle: string;
    formDescription: string;
    client: string;
    noClient: string;
    newClientName: string;
    newClientNamePlaceholder: string;
    date: string;
    pickDate: string;
    duration: string;
    location: string;
    notes: string;
    create: string;
    creating: string;
    created: string;
    invalid: string;
    createError: string;
  };
};

export function SessionForm({
  locale,
  clients,
  variant = "card",
  onSuccess,
  dictionary,
}: SessionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await createSession(locale, formData);
        if (!result.ok) {
          toast.error(dictionary.invalid);
          return;
        }

        toast.success(dictionary.created);
        onSuccess?.();
        router.refresh();
      } catch {
        toast.error(dictionary.createError);
      }
    });
  }

  const form = (
    <form onSubmit={handleSubmit} className="grid gap-4">
          <SessionClientPicker clients={clients} dictionary={dictionary} />

          <div className="grid gap-4 md:grid-cols-2">
            <SessionDatePicker label={dictionary.date} placeholder={dictionary.pickDate} />
            <div className="grid gap-2">
              <Label htmlFor="durationMinutes">{dictionary.duration}</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" min="1" max="1440" required defaultValue="60" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">{dictionary.location}</Label>
            <Input id="location" name="location" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">{dictionary.notes}</Label>
            <Textarea id="notes" name="notes" rows={4} />
          </div>

          <DeviceMetadataFields />

          <Button type="submit" className="w-fit" disabled={isPending}>
            {isPending ? dictionary.creating : dictionary.create}
          </Button>
    </form>
  );

  if (variant === "plain") {
    return form;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.formTitle}</CardTitle>
        <CardDescription>{dictionary.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {form}
      </CardContent>
    </Card>
  );
}
