import type { Locale } from "@/lib/i18n/config";
import { submitFeedbackForm } from "@/features/feedback/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FeedbackFormProps = {
  locale: Locale;
  token: string;
  status?: string;
  dictionary: {
    title: string;
    description: string;
    rating: string;
    experienceText: string;
    emotionalImpact: string;
    submit: string;
    submitted: string;
    invalid: string;
    alreadySubmitted: string;
  };
  isSubmitted: boolean;
};

export function FeedbackForm({
  locale,
  token,
  status,
  dictionary,
  isSubmitted,
}: FeedbackFormProps) {
  const action = submitFeedbackForm.bind(null, locale, token);
  const message =
    status === "submitted"
      ? dictionary.submitted
      : status === "invalid"
        ? dictionary.invalid
        : isSubmitted
          ? dictionary.alreadySubmitted
          : null;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="rating">{dictionary.rating}</Label>
            <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue="5" disabled={isSubmitted} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="experienceText">{dictionary.experienceText}</Label>
            <Textarea id="experienceText" name="experienceText" rows={5} disabled={isSubmitted} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emotionalImpact">{dictionary.emotionalImpact}</Label>
            <Textarea id="emotionalImpact" name="emotionalImpact" rows={4} disabled={isSubmitted} />
          </div>
          <Button type="submit" className="w-fit" disabled={isSubmitted}>
            {dictionary.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
