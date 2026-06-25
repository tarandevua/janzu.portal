import type { Locale } from "@/lib/i18n/config";
import type { Client } from "@/server/models/client.model";
import { createSession } from "@/features/sessions/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SessionFormProps = {
  locale: Locale;
  clients: Client[];
  status?: string;
  dictionary: {
    formTitle: string;
    formDescription: string;
    client: string;
    noClient: string;
    date: string;
    duration: string;
    location: string;
    notes: string;
    create: string;
    created: string;
    invalid: string;
  };
};

export function SessionForm({ locale, clients, status, dictionary }: SessionFormProps) {
  const action = createSession.bind(null, locale);
  const message =
    status === "created" ? dictionary.created : status === "invalid" ? dictionary.invalid : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.formTitle}</CardTitle>
        <CardDescription>{dictionary.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="clientId">{dictionary.client}</Label>
            <Select name="clientId">
              <SelectTrigger id="clientId">
                <SelectValue placeholder={dictionary.noClient} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{dictionary.noClient}</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sessionDate">{dictionary.date}</Label>
              <Input id="sessionDate" name="sessionDate" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="durationMinutes">{dictionary.duration}</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" min="1" max="1440" required />
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
      </CardContent>
    </Card>
  );
}
