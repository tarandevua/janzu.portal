import type { Locale } from "@/lib/i18n/config";
import type { Client } from "@/server/models/client.model";
import { createSession } from "@/features/sessions/actions";
import { SessionClientPicker } from "@/features/sessions/components/session-client-picker";
import { SessionDatePicker } from "@/features/sessions/components/session-date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SessionFormProps = {
  locale: Locale;
  clients: Client[];
  status?: string;
  variant?: "card" | "plain";
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
    created: string;
    invalid: string;
  };
};

export function SessionForm({
  locale,
  clients,
  status,
  variant = "card",
  dictionary,
}: SessionFormProps) {
  const action = createSession.bind(null, locale);
  const message =
    status === "created" ? dictionary.created : status === "invalid" ? dictionary.invalid : null;

  const form = (
    <form action={action} className="grid gap-4">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <SessionClientPicker clients={clients} dictionary={dictionary} />

          <div className="grid gap-4 md:grid-cols-2">
            <SessionDatePicker label={dictionary.date} placeholder={dictionary.pickDate} />
            <div className="grid gap-2">
              <Label htmlFor="durationMinutes">{dictionary.duration}</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" min="1" max="1440" required value="60" />
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

          <Button type="submit" className="w-fit">
            {dictionary.create}
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
