import type { Locale } from "@/lib/i18n/config";
import type { PractitionerProfile } from "@/server/models/practitioner.model";
import { savePractitionerProfile } from "@/features/practitioners/actions";
import { CoordinatePicker } from "@/features/maps/components/coordinate-picker";
import { PublicProfileCheckbox } from "@/features/practitioners/components/public-profile-checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PractitionerProfileFormProps = {
  locale: Locale;
  profile: PractitionerProfile | null;
  fullName: string;
  dictionary: {
    title: string;
    description: string;
    fullName: string;
    bio: string;
    country: string;
    city: string;
    latitude: string;
    longitude: string;
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    languages: string;
    website: string;
    profileImageUrl: string;
    isPublic: string;
    save: string;
    saved: string;
    invalid: string;
  };
  status?: string;
};

export function PractitionerProfileForm({
  locale,
  profile,
  fullName,
  dictionary,
  status,
}: PractitionerProfileFormProps) {
  const action = savePractitionerProfile.bind(null, locale);
  const message =
    status === "saved" ? dictionary.saved : status === "invalid" ? dictionary.invalid : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="fullName">{dictionary.fullName}</Label>
            <Input id="fullName" name="fullName" defaultValue={fullName} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">{dictionary.bio}</Label>
            <Textarea id="bio" name="bio" defaultValue={profile?.bio ?? ""} rows={5} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="country">{dictionary.country}</Label>
              <Input id="country" name="country" defaultValue={profile?.country ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">{dictionary.city}</Label>
              <Input id="city" name="city" defaultValue={profile?.city ?? ""} />
            </div>
          </div>

          <CoordinatePicker
            defaultLatitude={profile?.latitude}
            defaultLongitude={profile?.longitude}
            markerLabel="P"
            dictionary={dictionary}
          />

          <div className="grid gap-2">
            <Label htmlFor="languages">{dictionary.languages}</Label>
            <Input id="languages" name="languages" defaultValue={profile?.languages.join(", ") ?? ""} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="website">{dictionary.website}</Label>
              <Input id="website" name="website" type="url" defaultValue={profile?.website ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profileImageUrl">{dictionary.profileImageUrl}</Label>
              <Input
                id="profileImageUrl"
                name="profileImageUrl"
                type="url"
                defaultValue={profile?.profileImageUrl ?? ""}
              />
            </div>
          </div>

          <PublicProfileCheckbox
            label={dictionary.isPublic}
            defaultChecked={profile?.isPublic ?? false}
          />

          <Button type="submit" className="w-fit">
            {dictionary.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
