import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestPractitionerSession } from "@/features/session-requests/actions";
import type { Locale } from "@/lib/i18n/config";

type SessionRequestFormProps = {
  locale: Locale;
  practitionerId: string;
  status?: string;
  dictionary: {
    formTitle: string;
    formDescription: string;
    name: string;
    email: string;
    phone: string;
    preferredDate: string;
    message: string;
    submit: string;
    sent: string;
    invalid: string;
  };
};

export function SessionRequestForm({
  locale,
  practitionerId,
  status,
  dictionary,
}: SessionRequestFormProps) {
  const action = requestPractitionerSession.bind(null, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.formTitle}</CardTitle>
        <CardDescription>{dictionary.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "request-sent" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{dictionary.sent}</p>
        ) : null}
        {status === "request-invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">{dictionary.invalid}</p>
        ) : null}
        <form action={action} className="space-y-4">
          <input type="hidden" name="practitionerId" value={practitionerId} />
          <div className="space-y-2">
            <Label htmlFor="requesterName">{dictionary.name}</Label>
            <Input id="requesterName" name="requesterName" minLength={2} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requesterEmail">{dictionary.email}</Label>
            <Input id="requesterEmail" name="requesterEmail" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requesterPhone">{dictionary.phone}</Label>
            <Input id="requesterPhone" name="requesterPhone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredDate">{dictionary.preferredDate}</Label>
            <Input id="preferredDate" name="preferredDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{dictionary.message}</Label>
            <Textarea id="message" name="message" rows={5} />
          </div>
          <Button type="submit" className="w-full">
            <SendIcon className="h-4 w-4" />
            {dictionary.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
