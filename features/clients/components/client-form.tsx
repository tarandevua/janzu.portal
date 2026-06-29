import type { Locale } from "@/lib/i18n/config";
import type { Client } from "@/server/models/client.model";
import { createClient, updateClient } from "@/features/clients/actions";
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
  dictionary: {
    formTitle: string;
    editFormTitle: string;
    formDescription: string;
    editFormDescription: string;
    name: string;
    email: string;
    phone: string;
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
  dictionary,
}: ClientFormProps) {
  const action =
    mode === "edit" && client
      ? updateClient.bind(null, locale, client.id)
      : createClient.bind(null, locale);
  const message =
    status === "created"
      ? dictionary.created
      : status === "updated"
        ? dictionary.updated
        : status === "invalid"
          ? dictionary.invalid
          : status === "edit-invalid"
            ? dictionary.editInvalid
            : null;
  const isInvalid = status === "invalid" || status === "edit-invalid";
  const fieldSuffix = client?.id ?? "new";
  const title = mode === "edit" ? dictionary.editFormTitle : dictionary.formTitle;
  const description = mode === "edit" ? dictionary.editFormDescription : dictionary.formDescription;

  const form = (
    <form action={action} className="grid gap-4">
          {message ? (
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
          <div className="grid gap-2">
            <Label htmlFor={`client-notes-${fieldSuffix}`}>{dictionary.notes}</Label>
            <Textarea
              id={`client-notes-${fieldSuffix}`}
              name="notes"
              rows={4}
              defaultValue={client?.notes ?? ""}
            />
          </div>
          <Button type="submit" className="w-fit">
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
