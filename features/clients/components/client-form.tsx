import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/features/clients/actions";
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
  dictionary: {
    formTitle: string;
    formDescription: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    create: string;
    created: string;
    invalid: string;
  };
};

export function ClientForm({ locale, status, variant = "card", dictionary }: ClientFormProps) {
  const action = createClient.bind(null, locale);
  const message =
    status === "created" ? dictionary.created : status === "invalid" ? dictionary.invalid : null;

  const form = (
    <form action={action} className="grid gap-4">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="name">{dictionary.name}</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">{dictionary.email}</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{dictionary.phone}</Label>
              <Input id="phone" name="phone" />
            </div>
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
