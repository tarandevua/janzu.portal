"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Client } from "@/server/models/client.model";
import {
  createClientInline,
  updateClientInline,
  type ClientActionState,
} from "@/features/clients/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClientFormProps = {
  locale: Locale;
  status?: string;
  variant?: "card" | "plain";
  client?: Client;
  mode?: "create" | "edit";
  onSuccess?: () => void;
  dictionary: {
    formTitle: string;
    editFormTitle: string;
    formDescription: string;
    editFormDescription: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    notes: string;
    create: string;
    update: string;
    created: string;
    updated: string;
    invalid: string;
    editInvalid: string;
  };
};

export function ClientForm({
  locale,
  status,
  variant = "card",
  client,
  mode = "create",
  onSuccess,
  dictionary,
}: ClientFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action =
    mode === "edit" && client
      ? updateClientInline.bind(null, locale, client.id)
      : createClientInline.bind(null, locale);
  const [state, formAction, isPending] = useActionState<ClientActionState, FormData>(
    action,
    { ok: false, status: "idle", resultId: null }
  );
  const message =
    state.status === "created"
      ? dictionary.created
      : state.status === "updated"
        ? dictionary.updated
        : state.status === "invalid" || status === "invalid"
          ? dictionary.invalid
          : status === "edit-invalid"
            ? dictionary.editInvalid
            : null;
  const isInvalid = state.status === "invalid" || status === "invalid" || status === "edit-invalid";
  const fieldSuffix = client?.id ?? "new";
  const title = mode === "edit" ? dictionary.editFormTitle : dictionary.formTitle;
  const description = mode === "edit" ? dictionary.editFormDescription : dictionary.formDescription;

  useEffect(() => {
    if (!state.resultId) {
      return;
    }

    if (state.status === "created") {
      toast.success(dictionary.created);
      formRef.current?.reset();
      router.refresh();
      onSuccess?.();
    }

    if (state.status === "updated") {
      toast.success(dictionary.updated);
      router.refresh();
      onSuccess?.();
    }

    if (state.status === "invalid") {
      toast.error(mode === "edit" ? dictionary.editInvalid : dictionary.invalid);
    }
  }, [
    dictionary.created,
    dictionary.editInvalid,
    dictionary.invalid,
    dictionary.updated,
    mode,
    onSuccess,
    router,
    state.resultId,
    state.status,
  ]);

  const form = (
    <form ref={formRef} action={formAction} className="grid gap-4">
          {message && isInvalid ? (
            <Alert variant={isInvalid ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor={`client-name-${fieldSuffix}`}>{dictionary.name}</Label>
            <Input
              id={`client-name-${fieldSuffix}`}
              name="name"
              defaultValue={client?.name ?? ""}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`client-email-${fieldSuffix}`}>{dictionary.email}</Label>
              <Input
                id={`client-email-${fieldSuffix}`}
                name="email"
                type="email"
                defaultValue={client?.email ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`client-phone-${fieldSuffix}`}>{dictionary.phone}</Label>
              <Input
                id={`client-phone-${fieldSuffix}`}
                name="phone"
                defaultValue={client?.phone ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`client-country-${fieldSuffix}`}>{dictionary.country}</Label>
              <Input
                id={`client-country-${fieldSuffix}`}
                name="country"
                defaultValue={client?.country ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`client-city-${fieldSuffix}`}>{dictionary.city}</Label>
              <Input
                id={`client-city-${fieldSuffix}`}
                name="city"
                defaultValue={client?.city ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`client-notes-${fieldSuffix}`}>{dictionary.notes}</Label>
            <Textarea
              id={`client-notes-${fieldSuffix}`}
              name="notes"
              rows={4}
              defaultValue={client?.notes ?? ""}
            />
          </div>
          <Button type="submit" className="w-fit" disabled={isPending}>
            {mode === "edit" ? dictionary.update : dictionary.create}
          </Button>
    </form>
  );

  if (variant === "plain") {
    return form;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {form}
      </CardContent>
    </Card>
  );
}
