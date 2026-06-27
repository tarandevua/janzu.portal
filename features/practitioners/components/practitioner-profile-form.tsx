import type { Locale } from "@/lib/i18n/config";
import type { PractitionerProfile } from "@/server/models/practitioner.model";
import { savePractitionerProfile } from "@/features/practitioners/actions";
import { CoordinatePicker } from "@/features/maps/components/coordinate-picker";
import { PublicProfileCheckbox } from "@/features/practitioners/components/public-profile-checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    profileImageUpload: string;
    profileImageUploadHelp: string;
    isPublic: string;
    save: string;
    saved: string;
    invalid: string;
    avatarType: string;
    avatarSize: string;
    avatarConfig: string;
    avatarAuth: string;
    avatarBucket: string;
    avatarUpload: string;
  };
  status?: string;
};

const statusMessages = {
  saved: "saved",
  invalid: "invalid",
  "avatar-type": "avatarType",
  "avatar-size": "avatarSize",
  "avatar-config": "avatarConfig",
  "avatar-auth": "avatarAuth",
  "avatar-bucket": "avatarBucket",
  "avatar-upload": "avatarUpload",
} as const;

function getAvatarFallback(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0]?.slice(0, 2) || "JP").toUpperCase();
}

export function PractitionerProfileForm({
  locale,
  profile,
  fullName,
  dictionary,
  status,
}: PractitionerProfileFormProps) {
  const action = savePractitionerProfile.bind(null, locale);
  const messageKey = status ? statusMessages[status as keyof typeof statusMessages] : null;
  const message = messageKey ? dictionary[messageKey] : null;
  const isError = status !== "saved";
  const avatarFallback = getAvatarFallback(fullName);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.title}</CardTitle>
        <CardDescription>{dictionary.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} encType="multipart/form-data" className="grid gap-5">
          {message ? (
            <Alert variant={isError ? "destructive" : "default"}>
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
              <Label htmlFor="avatarImage">{dictionary.profileImageUpload}</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={profile?.profileImageUrl ?? ""} alt={fullName} />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 gap-1">
                  <input
                    type="hidden"
                    id="profileImageUrl"
                    name="profileImageUrl"
                    value={profile?.profileImageUrl ?? ""}
                  />
                  <Input
                    id="avatarImage"
                    name="avatarImage"
                    type="file"
                    accept="image/jpeg,.jpg,.jpeg"
                  />
                  <p className="text-xs text-muted-foreground">{dictionary.profileImageUploadHelp}</p>
                </div>
              </div>
              <Label className="sr-only" htmlFor="profileImageUrl">
                {dictionary.profileImageUrl}
              </Label>
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
