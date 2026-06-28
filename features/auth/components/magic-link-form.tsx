import { Send } from "lucide-react";
import { sendMagicLink } from "@/features/auth/actions";
import type { Locale } from "@/lib/i18n/config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MagicLinkDictionary = {
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  success: string;
  invalidEmail: string;
  genericError: string;
  authRequired: string;
  invalidLink: string;
  signedOut: string;
  unknownUserDisabled: string;
};

type MagicLinkFormProps = {
  dictionary: MagicLinkDictionary;
  locale: Locale;
  status?: string;
};

const statusCopy: Record<string, keyof MagicLinkDictionary> = {
  sent: "success",
  "invalid-email": "invalidEmail",
  error: "genericError",
  "auth-required": "authRequired",
  "invalid-link": "invalidLink",
  "signed-out": "signedOut",
  "unknown-user-disabled": "unknownUserDisabled",
};

export function MagicLinkForm({ dictionary, locale, status }: MagicLinkFormProps) {
  const messageKey = status ? statusCopy[status] : undefined;
  const message = messageKey ? dictionary[messageKey] : undefined;
  const isError = status ? !["sent", "signed-out"].includes(status) : false;
  const action = sendMagicLink.bind(null, locale);

  return (
    <form action={action} className="mt-6 space-y-4">
      {message ? (
        <Alert variant={isError ? "destructive" : "default"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={dictionary.emailPlaceholder}
          autoComplete="email"
          required
        />
      </div>

      <Button type="submit" className="w-full">
        <Send className="h-4 w-4" aria-hidden="true" />
        {dictionary.submit}
      </Button>
    </form>
  );
}
