import { saveProfileVisibility } from "@/features/practitioners/actions";
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
  save: string;
  saved: string;
  invalid: string;
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
  status,
}: {
  locale: Locale;
  profile: PractitionerProfile;
  canUsePublic: boolean;
  dictionary: VisibilityDictionary;
  status?: string;
}) {
  const action = saveProfileVisibility.bind(null, locale);
  const values: ProfileVisibility[] = canUsePublic
    ? ["private", "community", "public"]
    : ["private", "community"];

  return (
    <Card id="visibility">
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5">
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
              </div>
            ))}
          </div>
          {!canUsePublic ? (
            <p className="text-sm text-muted-foreground">{dictionary.publicUnavailable}</p>
          ) : null}
          {status === "visibility-saved" ? (
            <p className="text-sm text-emerald-700" role="status">{dictionary.saved}</p>
          ) : null}
          {status === "visibility-invalid" ? (
            <p className="text-sm text-destructive" role="alert">{dictionary.invalid}</p>
          ) : null}
          <Button className="w-fit" type="submit">{dictionary.save}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
