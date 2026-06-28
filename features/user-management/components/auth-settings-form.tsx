"use client";

import { useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { updateAuthSettings } from "@/features/user-management/actions";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type AuthSettingsFormProps = {
  locale: Locale;
  allowUnknownMagicLinkLogin: boolean;
  status?: string;
  dictionary: {
    authSettingsTitle: string;
    authSettingsDescription: string;
    allowUnknownMagicLinkLogin: string;
    allowUnknownMagicLinkLoginHelp: string;
    saveAuthSettings: string;
    authSettingsSaved: string;
    authSettingsInvalid: string;
  };
};

export function AuthSettingsForm({
  locale,
  allowUnknownMagicLinkLogin,
  status,
  dictionary,
}: AuthSettingsFormProps) {
  const [isAllowed, setIsAllowed] = useState(allowUnknownMagicLinkLogin);
  const action = updateAuthSettings.bind(null, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.authSettingsTitle}</CardTitle>
        <CardDescription>{dictionary.authSettingsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "auth-settings-saved" ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">
            {dictionary.authSettingsSaved}
          </p>
        ) : null}
        {status === "auth-settings-invalid" ? (
          <p className="mb-4 text-sm font-medium text-destructive">
            {dictionary.authSettingsInvalid}
          </p>
        ) : null}
        <form action={action} className="grid gap-4">
          <input
            type="hidden"
            name="allowUnknownMagicLinkLogin"
            value={isAllowed ? "true" : "false"}
          />
          <div className="flex items-start gap-3 rounded-md border p-4">
            <Checkbox
              id="allowUnknownMagicLinkLogin"
              checked={isAllowed}
              onCheckedChange={(checked) => setIsAllowed(checked === true)}
            />
            <div className="grid gap-1">
              <Label htmlFor="allowUnknownMagicLinkLogin">
                {dictionary.allowUnknownMagicLinkLogin}
              </Label>
              <p className="text-sm text-muted-foreground">
                {dictionary.allowUnknownMagicLinkLoginHelp}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">
              <ShieldCheckIcon className="h-4 w-4" />
              {dictionary.saveAuthSettings}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
