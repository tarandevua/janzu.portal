"use client";

import React, { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProfileVisibilityInline } from "@/features/practitioners/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n/config";
import type {
  PractitionerProfile,
  ProfileVisibility,
} from "@/server/models/practitioner.model";

type VisibilityDictionary = {
  title: string;
  description: string;
  directory: string;
  displayName: string;
  profileImage: string;
  bio: string;
  languages: string;
  location: string;
  website: string;
  socialLinks: string;
  private: string;
  community: string;
  public: string;
  publicUnavailable: string;
  directoryHelp: string;
  save: string;
  saving: string;
  saved: string;
  invalid: string;
  error: string;
};

const fieldNames = [
  "directory",
  "displayName",
  "profileImage",
  "bio",
  "languages",
  "location",
  "website",
  "socialLinks",
] as const;

export function ProfileVisibilityForm({
  locale,
  profile,
  canUsePublic,
  dictionary,
}: {
  locale: Locale;
  profile: PractitionerProfile;
  canUsePublic: boolean;
  dictionary: VisibilityDictionary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const values: ProfileVisibility[] = canUsePublic
    ? ["private", "community", "public"]
    : ["private", "community"];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await saveProfileVisibilityInline(locale, formData);

        if (result.ok) {
          toast.success(dictionary.saved);
          router.refresh();
          return;
        }

        toast.error(result.status === "invalid" ? dictionary.invalid : dictionary.error);
      } catch {
        toast.error(dictionary.error);
      }
    });
  }

  return (
    <Card id="visibility">
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            {fieldNames.map((field) => (
              <div className="grid gap-2" key={field}>
                <Label htmlFor={`visibility-${field}`}>{dictionary[field]}</Label>
                <select
                  id={`visibility-${field}`}
                  name={field}
                  defaultValue={
                    field === "directory" ? profile.visibility.directory : profile.visibility[field]
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {values.map((value) => (
                    <option key={value} value={value}>
                      {dictionary[value]}
                    </option>
                  ))}
                </select>
                {field === "directory" ? (
                  <p className="text-xs text-muted-foreground">{dictionary.directoryHelp}</p>
                ) : null}
              </div>
            ))}
          </div>
          {!canUsePublic ? (
            <p className="text-sm text-muted-foreground">{dictionary.publicUnavailable}</p>
          ) : null}
          <Button className="w-fit" type="submit" disabled={isPending}>
            {isPending ? dictionary.saving : dictionary.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
